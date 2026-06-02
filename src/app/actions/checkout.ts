'use server'

import { createClient } from '@supabase/supabase-js'

// ── Variáveis de ambiente ────────────────────────────────────────────────────
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('[checkout] NEXT_PUBLIC_SUPABASE_URL :', SUPABASE_URL ? '✓ definida' : '✗ AUSENTE')
console.log('[checkout] SUPABASE_SERVICE_ROLE_KEY      :', SUPABASE_KEY ? `✓ definida (${SUPABASE_KEY.slice(0, 12)}…)` : '✗ AUSENTE')

const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_KEY!)

// ── Types ────────────────────────────────────────────────────────────────────

export type ItemPedidoInput = {
  produto_id: number
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
  const numero = `FT-${Date.now().toString().slice(-7)}`
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

  console.log(`[criarPedido] Concluído. Número: ${numero}`)
  console.log('─────────────────────────────────────────────\n')
  return numero
}
