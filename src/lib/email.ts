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

type QA = { id: string; title: string; type: string; order: number }

function formatEmailAnswer(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—"
  if (typeof value === "boolean") return value ? "Sim" : "Não"
  if (Array.isArray(value)) return value.map(String).join(", ")
  if (typeof value === "object" && value !== null && "fileName" in value)
    return (value as { fileName: string }).fileName
  return String(value)
}

export async function sendResponseNotification({
  toEmail,
  formId,
  formTitle,
  questions = [],
  answers = {},
}: {
  toEmail: string | string[]
  formId: string
  formTitle: string
  questions?: QA[]
  answers?: Record<string, unknown>
}) {
  const responsesUrl = `${appUrl}/responses/${formId}`

  const NON_INPUT = new Set(["welcome", "thank_you", "statement"])
  const qaRows = [...questions]
    .filter((q) => !NON_INPUT.has(q.type))
    .sort((a, b) => a.order - b.order)
    .map((q) => {
      const display = escapeHtml(formatEmailAnswer(answers[q.id]))
      return `<tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;vertical-align:top;">
        <p style="margin:0 0 3px;color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;">${escapeHtml(q.title)}</p>
        <p style="margin:0;color:#111827;font-size:14px;line-height:1.5;">${display}</p>
      </td></tr>`
    })
    .join("")

  const qaSection = qaRows
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">${qaRows}</table>`
    : ""

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

            ${qaSection}

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

  const recipients = Array.isArray(toEmail) ? toEmail : [toEmail]
  const sendingPromises = recipients.map(async (email) => {
    try {
      const response = await resend.emails.send({
        from,
        to: email,
        subject: `Nova resposta: ${formTitle}`,
        html,
      })
      
      if (response.error) {
        console.error(`[email notification] Resend error for ${email}:`, response.error)
        return { email, success: false, error: response.error }
      }
      
      return { email, success: true }
    } catch (err) {
      console.error(`[email notification] Exception for ${email}:`, err)
      return { email, success: false, error: err }
    }
  })

  return await Promise.all(sendingPromises)
}
