'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function createProduto(formData: {
  nome: string
  descricao: string
  preco: number
  categoria: string
  foto: string
  produtora_id: string
}) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('produtos').insert([
    {
      nome: formData.nome,
      descricao: formData.descricao,
      preco: formData.preco,
      categoria: formData.categoria,
      foto: formData.foto,
      produtora_id: formData.produtora_id,
      disponivel: true
    }
  ])

  if (error) {
    console.error('[createProduto] Erro:', error)
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/produtos')
}
