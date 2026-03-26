import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://formularios.ia"
const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"

export async function sendWelcomeEmail({ toEmail, name }: { toEmail: string; name: string }) {
  const dashboardUrl = `${appUrl}/dashboard`

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#0f0f0f;padding:28px 32px;">
            <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">formularios.ia</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 16px;color:#0f0f0f;font-size:22px;font-weight:700;line-height:1.3;">Bem-vindo, ${escapeHtml(name)}!</h1>
            <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.7;">
              Sua conta no <strong>formularios.ia</strong> está pronta. Crie formulários profissionais em minutos e comece a coletar respostas agora mesmo.
            </p>
            <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.7;">
              Com o formularios.ia você pode criar pesquisas, formulários de contato, coleta de leads e muito mais — com uma experiência fluida para quem responde.
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="background:#0f0f0f;border-radius:8px;">
                  <a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Criar meu primeiro formulário →</a>
                </td>
              </tr>
            </table>

            <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 24px;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              Você está recebendo este e-mail porque criou uma conta no formularios.ia.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  await resend.emails.send({
    from,
    to: toEmail,
    subject: `Bem-vindo ao formularios.ia, ${name}!`,
    html,
  })
}

export async function sendFirstResponseEmail({
  toEmail,
  formId,
  formTitle,
}: {
  toEmail: string
  formId: string
  formTitle: string
}) {
  const responsesUrl = `${appUrl}/responses/${formId}`

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#0f0f0f;padding:28px 32px;">
            <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">formularios.ia</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">🎉 Marco atingido</p>
            <h1 style="margin:0 0 16px;color:#0f0f0f;font-size:22px;font-weight:700;line-height:1.3;">Sua primeira resposta chegou!</h1>
            <p style="margin:0 0 8px;color:#374151;font-size:14px;line-height:1.7;">
              O formulário <strong>${escapeHtml(formTitle)}</strong> acaba de receber sua primeira resposta. Seu formulário está funcionando!
            </p>
            <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.7;">
              Veja o que foi respondido e acompanhe as próximas respostas pelo painel de analytics.
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="background:#0f0f0f;border-radius:8px;">
                  <a href="${responsesUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Ver a resposta →</a>
                </td>
              </tr>
            </table>

            <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 24px;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              Você está recebendo este e-mail porque tem uma conta no formularios.ia.
              <a href="${appUrl}/dashboard" style="color:#6b7280;">Gerenciar notificações</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  await resend.emails.send({
    from,
    to: toEmail,
    subject: `🎉 Primeira resposta recebida: ${formTitle}`,
    html,
  })
}

export async function sendResponseNotification({
  toEmail,
  formId,
  formTitle,
}: {
  toEmail: string | string[]
  formId: string
  formTitle: string
}) {
  const responsesUrl = `${appUrl}/responses/${formId}`

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#0f0f0f;padding:28px 32px;">
            <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">formularios.ia</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Nova resposta recebida</p>
            <h1 style="margin:0 0 24px;color:#0f0f0f;font-size:22px;font-weight:700;line-height:1.3;">${escapeHtml(formTitle)}</h1>

            <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">
              Seu formulário recebeu uma nova resposta completa.
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="background:#0f0f0f;border-radius:8px;">
                  <a href="${responsesUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Ver respostas →</a>
                </td>
              </tr>
            </table>

            <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 24px;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              Você está recebendo este e-mail porque ativou notificações para este formulário.
              <a href="${appUrl}/dashboard" style="color:#6b7280;">Gerenciar notificações</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  await resend.emails.send({
    from,
    to: toEmail,
    subject: `Nova resposta: ${formTitle}`,
    html,
  })
}
