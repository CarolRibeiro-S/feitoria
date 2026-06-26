'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type CupomValido = {
  id: string
  codigo: string
  percentual_desconto: number
}

export async function validarCupom(
  codigo: string,
  usuario_id: string
): Promise<CupomValido | null> {
  const hoje = new Date().toISOString().split('T')[0]
  const { data } = await supabaseAdmin
    .from('cupons')
    .select('id, codigo, percentual_desconto')
    .eq('codigo', codigo.trim().toUpperCase())
    .eq('usuario_id', usuario_id)
    .eq('usado', false)
    .gte('valido_ate', hoje)
    .single()
  return (data as CupomValido) ?? null
}

export async function verificarCupomAniversario(
  usuario_id: string
): Promise<{ codigo: string; novo: boolean } | null> {
  const { data: usuario } = await supabaseAdmin
    .from('usuarios')
    .select('data_nascimento')
    .eq('id', usuario_id)
    .single()

  if (!usuario?.data_nascimento) return null

  const hoje = new Date()
  const nascimento = new Date(usuario.data_nascimento)

  // Compare UTC months to avoid timezone issues
  if (nascimento.getUTCMonth() !== hoje.getUTCMonth()) return null

  const anoAtual = hoje.getFullYear()
  const inicioAno = `${anoAtual}-01-01`

  const { data: existente } = await supabaseAdmin
    .from('cupons')
    .select('codigo')
    .eq('usuario_id', usuario_id)
    .eq('tipo', 'aniversario')
    .gte('criado_em', inicioAno)
    .single()

  if (existente) return { codigo: existente.codigo, novo: false }

  const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase()
  const codigo = `ANIV${anoAtual}-${randomPart}`

  const ultimoDiaMes = new Date(anoAtual, hoje.getMonth() + 1, 0)
  const valido_ate = ultimoDiaMes.toISOString().split('T')[0]

  const { error } = await supabaseAdmin.from('cupons').insert({
    usuario_id,
    codigo,
    tipo: 'aniversario',
    percentual_desconto: 12,
    valido_ate,
  })

  if (error) {
    console.error('[fidelidade] Erro ao criar cupom de aniversário:', error)
    return null
  }

  return { codigo, novo: true }
}
