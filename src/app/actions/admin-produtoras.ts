'use server'

import { randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkIsAdmin } from "@/lib/admin-auth";

export type CriarContaResult =
  | { ok: true; usuarioId: string; actionLink: string | null }
  | { ok: false; error: string };

export async function criarContaProdutora(
  produtoraId: string,
  produtoraNome: string,
  email: string
): Promise<CriarContaResult> {
  if (!(await checkIsAdmin())) {
    return { ok: false, error: "Acesso negado." };
  }

  const emailLower = email.trim().toLowerCase();
  const tempPassword = randomBytes(24).toString("base64url");

  // 1. Create auth user (email already confirmed, temp password)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: emailLower,
    password: tempPassword,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return { ok: false, error: authError?.message ?? "Erro ao criar usuário no Auth." };
  }

  const newUserId = authData.user.id;

  // 2. Insert profile into usuarios
  const { error: usuariosError } = await supabaseAdmin.from("usuarios").insert({
    id: newUserId,
    email: emailLower,
    nome: produtoraNome,
    tipo: "produtora",
  });

  if (usuariosError) {
    // Rollback: remove the auth user so the email can be retried
    await supabaseAdmin.auth.admin.deleteUser(newUserId);
    return { ok: false, error: "Erro ao criar perfil: " + usuariosError.message };
  }

  // 3. Link auth user to produtora row
  const { error: produtoraError } = await supabaseAdmin
    .from("produtoras")
    .update({ usuario_id: newUserId })
    .eq("id", produtoraId);

  if (produtoraError) {
    return { ok: false, error: "Erro ao vincular à produtora: " + produtoraError.message };
  }

  // 4. Generate recovery link so admin can share it (same pattern as reset-password route)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email: emailLower,
    options: { redirectTo: `${siteUrl}/redefinir-senha` },
  });

  return {
    ok: true,
    usuarioId: newUserId,
    actionLink: linkData?.properties?.action_link ?? null,
  };
}
