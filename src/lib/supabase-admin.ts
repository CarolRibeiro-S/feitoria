import { createClient } from "@supabase/supabase-js";

// Server-only — never import in client components.
// Uses service role key to bypass RLS for admin operations.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
