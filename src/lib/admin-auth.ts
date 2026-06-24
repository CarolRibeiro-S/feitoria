import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUserTipo } from "./user-tipo";

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

  return (await getUserTipo(supabase, user.id)) === "admin";
}
