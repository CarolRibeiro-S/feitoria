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
