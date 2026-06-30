'use server'

import { randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkIsAdmin } from "@/lib/admin-auth";

export type CriarContaResult =
  | { ok: true; usuarioId: string; actionLink: string | null; message: string }
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

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[createProdutoraAccount] SUPABASE_SERVICE_ROLE_KEY is not set.");
    return { ok: false, error: "Configuração de servidor incompleta (service role key ausente)." };
  }

  console.log("[createProdutoraAccount] Starting — produtoraId:", produtoraId, "email:", emailLower);

  // ── Strategy 1: inviteUserByEmail ──────────────────────────────────────────
  // Sends an invite email directly; user sets their own password via the link.
  let newUserId: string | null = null;
  let usedInvite = false;

  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    emailLower,
    { data: { tipo: "produtora", nome: produtoraNome } }
  );

  if (!inviteError && inviteData?.user) {
    newUserId = inviteData.user.id;
    usedInvite = true;
    console.log("[createProdutoraAccount] Invite sent. userId:", newUserId);
  } else {
    console.error("[createProdutoraAccount] inviteUserByEmail error:", JSON.stringify(inviteError, null, 2));
    console.log("[createProdutoraAccount] Falling back to createUser...");

    // ── Strategy 2: createUser fallback ───────────────────────────────────────
    const tempPassword = randomBytes(24).toString("base64url");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: emailLower,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { tipo: "produtora", nome: produtoraNome },
      app_metadata: {},
    });

    if (authError || !authData?.user) {
      console.error("[createProdutoraAccount] Auth error:", JSON.stringify(authError, null, 2));
      return { ok: false, error: authError?.message ?? "Erro ao criar usuário no Auth." };
    }

    newUserId = authData.user.id;
    console.log("[createProdutoraAccount] Auth user created via createUser. userId:", newUserId);
  }

  // ── Update usuarios (trigger handle_new_user already inserted the row) ─────
  const { error: updateError } = await supabaseAdmin
    .from("usuarios")
    .update({ tipo: "produtora", nome: produtoraNome })
    .eq("id", newUserId);

  if (updateError) {
    console.error("[createProdutoraAccount] Update usuarios error:", JSON.stringify(updateError, null, 2));
    await supabaseAdmin.auth.admin.deleteUser(newUserId);
    return { ok: false, error: "Erro ao atualizar perfil: " + updateError.message };
  }

  console.log("[createProdutoraAccount] usuarios row updated for:", newUserId);

  // ── Link to produtora ───────────────────────────────────────────────────────
  const { error: produtoraError } = await supabaseAdmin
    .from("produtoras")
    .update({ usuario_id: newUserId })
    .eq("id", produtoraId);

  if (produtoraError) {
    console.error("[createProdutoraAccount] Update produtoras error:", JSON.stringify(produtoraError, null, 2));
    return { ok: false, error: "Erro ao vincular à produtora: " + produtoraError.message };
  }

  console.log("[createProdutoraAccount] produtoras.usuario_id linked:", newUserId, "→", produtoraId);

  // ── For invite flow: no recovery link needed (invite email handles it) ──────
  if (usedInvite) {
    return {
      ok: true,
      usuarioId: newUserId,
      actionLink: null,
      message: `Convite enviado! A produtora receberá um email para definir sua senha.`,
    };
  }

  // ── For createUser fallback: generate a recovery link for the admin to share ─
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
    message: linkData?.properties?.action_link
      ? "Conta criada! Copie o link abaixo e envie para a produtora."
      : `Conta criada! Um email foi enviado para ${emailLower}.`,
  };
}
