'use server'

import { checkIsAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { resend } from '@/lib/resend'

export type NotificarKitResult =
  | { ok: true }
  | { ok: false; error: string }

function buildKitEmail(nome: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Os Kits FEITORIA chegaram!</title>
</head>
<body style="margin:0;padding:0;background-color:#F0ECE6;font-family:Georgia,serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0ECE6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#F6F3EE;border:1px solid #E8E0D4;">

          <!-- Header -->
          <tr>
            <td style="background:#3B2F2A;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-family:Georgia,serif;font-size:22px;letter-spacing:0.3em;color:#F6F3EE;font-weight:normal;">
                FEITORIA
              </p>
              <p style="margin:6px 0 0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.25em;color:#C55A3A;text-transform:uppercase;">
                Kits &amp; Presentes
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">

              <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#C55A3A;font-weight:bold;">
                Uma boa notícia
              </p>
              <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:26px;font-weight:normal;color:#3B2F2A;">
                Olá, ${nome.split(' ')[0]}!
              </h1>

              <p style="margin:0 0 16px;font-size:15px;color:#5A4A44;line-height:1.7;font-family:Arial,sans-serif;">
                Os <strong>Kits &amp; Presentes da FEITORIA</strong> já estão disponíveis!
              </p>
              <p style="margin:0 0 32px;font-size:14px;color:#7A6B64;line-height:1.7;font-family:Arial,sans-serif;">
                Preparamos combinações especiais de produtos artesanais para momentos únicos —
                exatamente como você pediu para ser avisado.
              </p>

              <!-- Divider -->
              <div style="border-top:1px solid #E8E0D4;margin:0 0 32px;" />

              <!-- CTA -->
              <div style="text-align:center;">
                <a href="https://www.somosfeitoria.com.br/kits"
                   style="display:inline-block;background:#C55A3A;color:#F6F3EE;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;padding:16px 40px;">
                  Ver Kits
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#3B2F2A;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;color:#C4B9B2;">
                Dúvidas? Fale com a gente:
              </p>
              <a href="mailto:contato@somosfeitoria.com.br"
                 style="font-family:Arial,sans-serif;font-size:13px;color:#C55A3A;text-decoration:none;">
                contato@somosfeitoria.com.br
              </a>
              <p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#6B5C57;">
                © FEITORIA — Marketplace de produtoras artesanais
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`
}

export async function notificarInteresseKit(
  id: string,
  nome: string,
  email: string,
): Promise<NotificarKitResult> {
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) return { ok: false, error: 'Acesso negado.' }

  // 1. Envia o email
  const { error: emailError } = await resend.emails.send({
    from: 'FEITORIA <onboarding@resend.dev>',
    to: email,
    subject: 'Os Kits FEITORIA chegaram!',
    html: buildKitEmail(nome),
  })

  if (emailError) {
    console.error('[notificarInteresseKit] Falha ao enviar email:', emailError)
    return { ok: false, error: 'Falha ao enviar o email. Tente novamente.' }
  }

  // 2. Só marca notificado após email enviado com sucesso
  const { error: dbError } = await supabaseAdmin
    .from('interesse_kits')
    .update({ notificado: true })
    .eq('id', id)

  if (dbError) {
    console.error('[notificarInteresseKit] Email enviado mas falha ao atualizar banco:', dbError)
    // Email já foi, registra o erro mas não retorna failure (usuário foi notificado)
    return { ok: true }
  }

  return { ok: true }
}
