import type { SupabaseClient } from "@supabase/supabase-js";

// Single source of truth for reading a user's tipo from the database.
// Returns null when the record is absent or RLS blocks the read — callers
// must treat null as "access denied", never fall back to user_metadata.
// user_metadata is writable by the user via supabase.auth.updateUser()
// and must never be used to gate any privilege check.
export async function getUserTipo(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("usuarios")
    .select("tipo")
    .eq("id", userId)
    .maybeSingle();
  return data?.tipo ?? null;
}
