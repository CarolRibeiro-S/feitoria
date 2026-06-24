import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Verifies the current request carries a valid admin session.
// Authorization is based EXCLUSIVELY on usuarios.tipo from the database.
// user_metadata is intentionally NOT used: it is writable by the user
// themselves via supabase.auth.updateUser() and must never be trusted
// for privilege checks. Use app_metadata (service-role only) if a
// metadata-level flag is ever needed in the future.
export async function checkIsAdmin(): Promise<boolean> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;

  const { data: record } = await supabase
    .from("usuarios")
    .select("tipo")
    .eq("id", user.id)
    .maybeSingle();

  // No fallback. If the DB record is missing or RLS blocks the read,
  // access is denied. Admins must have tipo='admin' in the usuarios table.
  return record?.tipo === "admin";
}
