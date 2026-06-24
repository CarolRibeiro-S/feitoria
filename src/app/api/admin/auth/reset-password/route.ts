import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkIsAdmin } from "@/lib/admin-auth";

// POST /api/admin/auth/reset-password
// Generates a password-recovery link using the service role key.
// Returns the action_link so the admin can copy/share it directly.
export async function POST(request: NextRequest) {
  if (!(await checkIsAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email } = await request.json();
  if (!email)
    return NextResponse.json({ error: "email required" }, { status: 400 });

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${siteUrl}/redefinir-senha` },
  });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    action_link: data.properties?.action_link ?? null,
  });
}
