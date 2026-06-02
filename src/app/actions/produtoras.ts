'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function getProdutora(usuario_id: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('produtoras')
    .select('*')
    .eq('usuario_id', usuario_id)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
    console.error('[getProdutora] Erro:', error)
    return null
  }

  return data
}

export async function updateProdutora(usuario_id: string, formData: {
  nome_marca: string
  descricao: string
  cidade: string
  estado: string
  instagram: string
  foto_perfil_url: string
}) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('produtoras')
    .update({
      nome_marca: formData.nome_marca,
      descricao: formData.descricao,
      cidade: formData.cidade,
      estado: formData.estado,
      instagram: formData.instagram,
      foto_perfil_url: formData.foto_perfil_url
    })
    .eq('usuario_id', usuario_id)

  if (error) {
    console.error('[updateProdutora] Erro:', error)
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/perfil')
}
