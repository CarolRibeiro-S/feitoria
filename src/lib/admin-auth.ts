import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Verifies the current request has a valid admin session.
// Used in API Route Handlers to guard admin endpoints.
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

  // Mirror the middleware fallback: autoritativo via DB, fallback via user_metadata
  const tipo: string = record?.tipo ?? (user.user_metadata?.tipo as string) ?? "";
  return tipo === "admin";
}
