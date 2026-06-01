import { createServerSupabaseClient } from '@/lib/supabase-server'

export type UserTipo = 'cliente' | 'produtora' | 'admin'

// Retorna o usuário autenticado atual (server-side)
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

// Retorna o tipo do usuário consultando a tabela usuarios
export async function getUserTipo(userId: string): Promise<UserTipo | null> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('usuarios')
    .select('tipo')
    .eq('id', userId)
    .single()
  return (data?.tipo as UserTipo) ?? null
}

// Faz logout (chamar de Server Action ou Route Handler)
export async function signOutServer() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
}
