'use server'

import { createClient } from '@supabase/supabase-js'
import { resend } from '@/lib/resend'
import { pedidoConfirmadoClienteEmail } from '@/lib/emails/pedido-confirmado-cliente'
import { pedidoNovoProdutoraEmail } from '@/lib/emails/pedido-novo-produtora'

// ── Variáveis de ambiente ────────────────────────────────────────────────────
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('[checkout] NEXT_PUBLIC_SUPABASE_URL :', SUPABASE_URL ? '✓ definida' : '✗ AUSENTE')
console.log('[checkout] SUPABASE_SERVICE_ROLE_KEY      :', SUPABASE_KEY ? `✓ definida (${SUPABASE_KEY.slice(0, 12)}…)` : '✗ AUSENTE')

const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_KEY!)

// ── Types ────────────────────────────────────────────────────────────────────

export type ItemPedidoInput = {
  produto_id: string
  nome_produto: string
  produtor: string
  preco_unitario: number
  quantidade: number
}

export type PedidoInput = {
  usuario_id?: string | null
  nome_cliente: string
  email_cliente: string
  cpf_cliente: string
  tipo_entrega: 'entrega' | 'retirada'
  cep?: string
  endereco?: string
  numero_endereco?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  data_retirada?: string
  hora_retirada?: string
  forma_pagamento: 'pix' | 'cartao'
  subtotal: number
  frete: number
  total: number
  itens: ItemPedidoInput[]
  desconto_fidelidade_usado?: boolean
  cupom_codigo?: string | null
}

// ── Server Action ────────────────────────────────────────────────────────────

export async function criarPedido(input: PedidoInput): Promise<string> {
  console.log('\n─────────────────────────────────────────────')
  console.log('[criarPedido] Iniciando criação de pedido...')
  console.log('[criarPedido] Input recebido:', JSON.stringify({
    usuario_id: input.usuario_id,
    nome_cliente: input.nome_cliente,
    email_cliente: input.email_cliente,
    tipo_entrega: input.tipo_entrega,
    forma_pagamento: input.forma_pagamento,
    subtotal: input.subtotal,
    frete: input.frete,
    total: input.total,
    qtd_itens: input.itens.length,
  }, null, 2))

  // ── 1. Verifica conexão com o Supabase ──────────────────────────────────
  console.log('\n[criarPedido] 1/3 — Verificando conexão com Supabase...')
  try {
    const { error: pingError } = await supabaseAdmin
      .from('pedidos')
      .select('id')
      .limit(1)

    if (pingError) {
      console.error('[criarPedido] ERRO de conexão / tabela não existe:')
      console.error('  message :', pingError.message)
      console.error('  code    :', pingError.code)
      console.error('  details :', pingError.details)
      console.error('  hint    :', pingError.hint)
      throw new Error(`Tabela pedidos inacessível: ${pingError.message}`)
    }
    console.log('[criarPedido] Tabela pedidos acessível.')
  } catch (err) {
    console.error('[criarPedido] Exceção ao pingar tabela pedidos:', err)
    throw err
  }

  // ── 2. Insere o pedido ──────────────────────────────────────────────────
  const numero = `FT-${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
  console.log(`\n[criarPedido] 2/3 — Inserindo pedido número ${numero}...`)

  const pedidoPayload = {
    numero,
    usuario_id: input.usuario_id ?? null,
    nome_cliente: input.nome_cliente,
    email_cliente: input.email_cliente,
    cpf_cliente: input.cpf_cliente,
    tipo_entrega: input.tipo_entrega,
    cep: input.cep ?? null,
    endereco: input.endereco ?? null,
    numero_endereco: input.numero_endereco ?? null,
    complemento: input.complemento ?? null,
    bairro: input.bairro ?? null,
    cidade: input.cidade ?? null,
    estado: input.estado ?? null,
    data_retirada: input.data_retirada ?? null,
    hora_retirada: input.hora_retirada ?? null,
    forma_pagamento: input.forma_pagamento,
    subtotal: input.subtotal,
    frete: input.frete,
    total: input.total,
    status: 'pendente',
  }
  console.log('[criarPedido] Payload do pedido:', JSON.stringify(pedidoPayload, null, 2))

  const { data: pedido, error: pedidoError } = await supabaseAdmin
    .from('pedidos')
    .insert(pedidoPayload)
    .select('id')
    .single()

  if (pedidoError) {
    console.error('[criarPedido] ERRO ao inserir pedido:')
    console.error('  message :', pedidoError.message)
    console.error('  code    :', pedidoError.code)
    console.error('  details :', pedidoError.details)
    console.error('  hint    :', pedidoError.hint)
    console.error('  objeto completo:', JSON.stringify(pedidoError, null, 2))
    throw new Error(`Erro ao criar pedido: ${pedidoError.message} (${pedidoError.code})`)
  }

  if (!pedido) {
    console.error('[criarPedido] Insert não retornou id — pedido pode não ter sido criado.')
    throw new Error('Insert retornou vazio inesperadamente.')
  }

  console.log(`[criarPedido] Pedido criado com id: ${pedido.id}`)

  // ── 3. Insere os itens ──────────────────────────────────────────────────
  if (input.itens.length > 0) {
    console.log(`\n[criarPedido] 3/3 — Inserindo ${input.itens.length} item(ns)...`)

    const itensPayload = input.itens.map((item) => ({
      pedido_id: pedido.id,
      produto_id: item.produto_id,
      nome_produto: item.nome_produto,
      produtor: item.produtor,
      preco_unitario: item.preco_unitario,
      quantidade: item.quantidade,
    }))
    console.log('[criarPedido] Payload dos itens:', JSON.stringify(itensPayload, null, 2))

    const { error: itensError } = await supabaseAdmin
      .from('itens_pedido')
      .insert(itensPayload)

    if (itensError) {
      console.error('[criarPedido] ERRO ao inserir itens_pedido:')
      console.error('  message :', itensError.message)
      console.error('  code    :', itensError.code)
      console.error('  details :', itensError.details)
      console.error('  hint    :', itensError.hint)
      console.error('  objeto completo:', JSON.stringify(itensError, null, 2))
      // Não lança — o pedido principal já foi criado
    } else {
      console.log('[criarPedido] Itens inseridos com sucesso.')
    }
  } else {
    console.log('[criarPedido] 3/3 — Nenhum item para inserir.')
  }

  // ── 4. Marca carrinho abandonado como convertido ────────────────────────
  try {
    if (input.usuario_id) {
      await supabaseAdmin
        .from('carrinhos_abandonados')
        .update({ convertido: true })
        .eq('usuario_id', input.usuario_id)
        .eq('convertido', false)
    } else if (input.email_cliente) {
      await supabaseAdmin
        .from('carrinhos_abandonados')
        .update({ convertido: true })
        .eq('email', input.email_cliente)
        .eq('convertido', false)
    }
  } catch {
    // Non-critical — pedido já foi criado com sucesso
  }

  // ── 5. Lógica de fidelidade ─────────────────────────────────────────────
  if (input.usuario_id) {
    try {
      const selosGerados = Math.floor(input.subtotal / 100)

      if (selosGerados > 0) {
        await supabaseAdmin.from('selos_cliente').insert({
          usuario_id: input.usuario_id,
          pedido_id: pedido.id,
          valor_compra: input.subtotal,
          selos_gerados: selosGerados,
        })
      }

      const { data: progresso } = await supabaseAdmin
        .from('progresso_fidelidade')
        .select('selos_atuais, selos_historico_total, elegivel_desconto')
        .eq('usuario_id', input.usuario_id)
        .single()

      const selos_historico_total = (progresso?.selos_historico_total ?? 0) + selosGerados
      let selos_atuais = (progresso?.selos_atuais ?? 0) + selosGerados

      if (input.desconto_fidelidade_usado) {
        selos_atuais = 0
      }

      const elegivel_desconto = selos_atuais >= 10

      await supabaseAdmin.from('progresso_fidelidade').upsert(
        {
          usuario_id: input.usuario_id,
          selos_atuais,
          selos_historico_total,
          elegivel_desconto,
          ultima_atualizacao: new Date().toISOString(),
        },
        { onConflict: 'usuario_id' }
      )

      if (input.cupom_codigo) {
        await supabaseAdmin
          .from('cupons')
          .update({ usado: true })
          .eq('codigo', input.cupom_codigo)
          .eq('usuario_id', input.usuario_id)
      }
    } catch (err) {
      console.error('[criarPedido] Erro na lógica de fidelidade (non-critical):', err)
    }
  }

  console.log(`[criarPedido] Concluído. Número: ${numero}`)
  console.log('─────────────────────────────────────────────\n')

  // ── 6. Transactional emails (non-critical — errors never cancel the order) ─
  try {
    // Build common delivery fields
    const emailEntregaBase = {
      tipo_entrega: input.tipo_entrega,
      endereco:       input.endereco,
      numero_endereco: input.numero_endereco,
      bairro:         input.bairro,
      cidade:         input.cidade,
      estado:         input.estado,
      local_retirada: input.tipo_entrega === 'retirada' ? input.bairro : undefined,
      data_retirada:  input.data_retirada,
      hora_retirada:  input.hora_retirada,
    }

    // 6a. Email para o cliente
    const clienteEmail = pedidoConfirmadoClienteEmail({
      numero,
      nome_cliente: input.nome_cliente,
      itens: input.itens.map(i => ({
        nome_produto:   i.nome_produto,
        produtor:       i.produtor,
        preco_unitario: i.preco_unitario,
        quantidade:     i.quantidade,
      })),
      subtotal: input.subtotal,
      frete:    input.frete,
      total:    input.total,
      ...emailEntregaBase,
    })

    await resend.emails.send({
      from: 'FEITORIA <onboarding@resend.dev>',
      to:   input.email_cliente,
      subject: clienteEmail.subject,
      html:    clienteEmail.html,
    })
    console.log('[criarPedido] Email cliente enviado para:', input.email_cliente)

    // 6b. Busca emails das produtoras via join produtoras → usuarios
    // Also selects produtoras.email as fallback when usuario_id is not yet linked
    const uniqueProdutorNames = [...new Set(input.itens.map(i => i.produtor))]
    console.log('[email-produtora] Produtoras únicas no pedido:', uniqueProdutorNames)

    const { data: produtorasRows, error: produtorasError } = await supabaseAdmin
      .from('produtoras')
      .select('nome_marca, usuario_id, email')
      .in('nome_marca', uniqueProdutorNames)

    console.log('[email-produtora] Resultado da query produtoras:', JSON.stringify(produtorasRows))
    if (produtorasError) {
      console.error('[email-produtora] Erro na query produtoras:', JSON.stringify(produtorasError))
    }

    const usuarioIds = (produtorasRows ?? [])
      .map((p: { nome_marca: string; usuario_id: string | null; email: string | null }) => p.usuario_id)
      .filter(Boolean) as string[]

    const { data: usuariosRows, error: usuariosError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, nome')
      .in('id', usuarioIds)

    console.log('[email-produtora] Resultado da query usuarios:', JSON.stringify(usuariosRows))
    if (usuariosError) {
      console.error('[email-produtora] Erro na query usuarios:', JSON.stringify(usuariosError))
    }

    const usuariosMap = new Map(
      (usuariosRows ?? []).map((u: { id: string; email: string; nome: string | null }) => [u.id, u])
    )

    // Build a nome_marca → email map.
    // Primary:  produtoras.usuario_id → usuarios.email (linked auth account)
    // Fallback: produtoras.email column (set during onboarding, before account is linked)
    const produtoraEmailMap = new Map<string, { email: string; nome: string }>()
    for (const row of (produtorasRows ?? []) as { nome_marca: string; usuario_id: string | null; email: string | null }[]) {
      console.log('[email-produtora] Processando produtora:', row.nome_marca, '| usuario_id:', row.usuario_id, '| email direto:', row.email)

      let emailDest: string | null = null
      let nomeDest: string = row.nome_marca

      if (row.usuario_id) {
        const user = usuariosMap.get(row.usuario_id)
        if (user?.email) {
          emailDest = user.email
          nomeDest  = user.nome ?? row.nome_marca
          console.log('[email-produtora] Email via usuarios:', emailDest)
        }
      }

      // Fallback: use email stored directly on produtoras row
      if (!emailDest && row.email) {
        emailDest = row.email
        console.log('[email-produtora] Fallback — usando produtoras.email:', emailDest)
      }

      if (emailDest) {
        produtoraEmailMap.set(row.nome_marca, { email: emailDest, nome: nomeDest })
      } else {
        console.warn('[email-produtora] Nenhum email encontrado para produtora:', row.nome_marca)
      }
    }

    // 6c. Envia um email por produtora única
    for (const nomeProdutora of uniqueProdutorNames) {
      const dest = produtoraEmailMap.get(nomeProdutora)
      console.log('[email-produtora] Enviando para:', nomeProdutora, '→', dest?.email ?? 'SEM EMAIL')
      if (!dest) continue

      const itensDaProdutora = input.itens.filter(i => i.produtor === nomeProdutora)
      const produtoraEmail = pedidoNovoProdutoraEmail({
        numero,
        data_pedido:  new Date().toISOString().split('T')[0],
        nome_produtora: dest.nome,
        itens: itensDaProdutora.map(i => ({
          nome_produto:   i.nome_produto,
          quantidade:     i.quantidade,
          preco_unitario: i.preco_unitario,
        })),
        nome_cliente:  input.nome_cliente,
        email_cliente: input.email_cliente,
        ...emailEntregaBase,
      })

      const emailResult = await resend.emails.send({
        from: 'FEITORIA <onboarding@resend.dev>',
        to:   dest.email,
        subject: produtoraEmail.subject,
        html:    produtoraEmail.html,
      })
      console.log('[email-produtora] Resultado do envio para', dest.email, ':', JSON.stringify(emailResult))
    }
  } catch (emailErr) {
    // Email errors must never surface to the user — order is already confirmed
    console.error('[criarPedido] Erro ao enviar email (non-critical):', emailErr)
  }

  return numero
}
