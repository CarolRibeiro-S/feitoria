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

  // Verify service role key is present (admin.createUser requires it)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[createProdutoraAccount] SUPABASE_SERVICE_ROLE_KEY is not set — admin.createUser() will fail.");
    return { ok: false, error: "Configuração de servidor incompleta (service role key ausente)." };
  }

  console.log("[createProdutoraAccount] Starting — produtoraId:", produtoraId, "email:", emailLower);

  // 1. Create auth user (email already confirmed, temp password)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: emailLower,
    password: tempPassword,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    console.error("[createProdutoraAccount] Auth error:", JSON.stringify(authError, null, 2));
    return { ok: false, error: authError?.message ?? "Erro ao criar usuário no Auth." };
  }

  const newUserId = authData.user.id;
  console.log("[createProdutoraAccount] Auth user created:", newUserId);

  // 2. Update the usuarios row that the handle_new_user trigger already created
  const { error: updateError } = await supabaseAdmin
    .from("usuarios")
    .update({ tipo: "produtora", nome: produtoraNome })
    .eq("id", newUserId);

  if (updateError) {
    console.error("[createProdutoraAccount] Update usuarios error:", JSON.stringify(updateError, null, 2));
    // Rollback: remove the auth user so the email can be retried
    await supabaseAdmin.auth.admin.deleteUser(newUserId);
    return { ok: false, error: "Erro ao atualizar perfil: " + updateError.message };
  }

  console.log("[createProdutoraAccount] usuarios row updated for:", newUserId);

  // 3. Link auth user to produtora row
  const { error: produtoraError } = await supabaseAdmin
    .from("produtoras")
    .update({ usuario_id: newUserId })
    .eq("id", produtoraId);

  if (produtoraError) {
    console.error("[createProdutoraAccount] Update produtoras error:", JSON.stringify(produtoraError, null, 2));
    return { ok: false, error: "Erro ao vincular à produtora: " + produtoraError.message };
  }

  console.log("[createProdutoraAccount] produtoras.usuario_id linked:", newUserId, "→", produtoraId);

  // 4. Generate recovery link so admin can share it (same pattern as reset-password route)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email: emailLower,
    options: { redirectTo: `${siteUrl}/redefinir-senha` },
  });

  if (linkError) {
    console.error("[createProdutoraAccount] generateLink error:", JSON.stringify(linkError, null, 2));
  }

  console.log("[createProdutoraAccount] Done. actionLink present:", !!linkData?.properties?.action_link);

  return {
    ok: true,
    usuarioId: newUserId,
    actionLink: linkData?.properties?.action_link ?? null,
  };
}
