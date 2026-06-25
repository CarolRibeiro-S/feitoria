'use server'

import { createClient } from '@supabase/supabase-js'

// Service role bypassa RLS — nunca expor essa chave no cliente
// Esse módulo só roda no servidor (Server Actions)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function insertUsuario(params: {
  id: string
  nome: string
  email: string
  tipo: 'cliente' | 'produtora'
}) {
  const { error } = await supabaseAdmin.from('usuarios').insert(params)
  if (error) {
    console.error('[insertUsuario] Erro:', error)
    throw new Error(error.message)
  }
}

export async function insertProdutora(params: {
  usuario_id: string
  nome_marca: string
  cidade: string
}) {
  const { error } = await supabaseAdmin.from('produtoras').insert(params)
  if (error) {
    console.error('[insertProdutora] Erro:', error)
    throw new Error(error.message)
  }
}

export async function updateClienteProfile(params: {
  id: string
  data_nascimento?: string
  telefone?: string
  cep?: string
  endereco?: string
  numero_endereco?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  preferencias?: string[]
}) {
  const { id, ...rest } = params
  const filtered = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined))
  if (Object.keys(filtered).length === 0) return
  const { error } = await supabaseAdmin.from('usuarios').update(filtered).eq('id', id)
  if (error) {
    console.error('[updateClienteProfile] Erro:', error)
    throw new Error(error.message)
  }
}
