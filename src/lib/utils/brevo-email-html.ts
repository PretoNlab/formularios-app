import type { Question } from "@/lib/types/form"

export type BrevoFormInput = {
  title: string
  description?: string | null
  slug: string
  theme?: {
    logo?: { url: string; position?: string } | null
    colors?: { accent?: string } | null
  } | null
  questions?: Question[]
}

export interface BrevoHtmlOptions {
  shareUrl: string
  mode: "card" | "question"
  questionId?: string
  includeEmailTag?: boolean
  buttonText?: string
  primaryColor?: string
}

/**
 * Escapes special HTML characters to prevent XSS in raw email HTML
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

/**
 * Generates email-client compatible inline-styled HTML snippet for Brevo (Sendinblue) campaigns.
 */
export function generateBrevoEmailHtml(form: BrevoFormInput, options: BrevoHtmlOptions): string {
  const {
    shareUrl,
    mode,
    questionId,
    includeEmailTag = true,
    buttonText = "Responder Formulário",
    primaryColor = form.theme?.colors?.accent || "#3b82f6",
  } = options

  // Append tracking & optional Brevo email tag
  function buildUrl(queryParams?: Record<string, string>): string {
    const url = new URL(shareUrl)
    url.searchParams.set("utm_source", "brevo")
    url.searchParams.set("utm_medium", "email")

    if (queryParams) {
      Object.entries(queryParams).forEach(([k, v]) => {
        url.searchParams.set(k, v)
      })
    }

    let urlString = url.toString()
    if (includeEmailTag) {
      // Append Brevo contact email tag without escaping double curlies
      urlString += (urlString.includes("?") ? "&" : "?") + "email={{ contact.EMAIL }}"
    }
    return urlString
  }

  const title = escapeHtml(form.title || "Formulário")
  const description = escapeHtml(form.description || "")
  const logoUrl = form.theme?.logo?.url
  const defaultCtaUrl = buildUrl()

  if (mode === "question" && questionId) {
    const questions = form.questions || []
    const targetQuestion = questions.find((q) => q.id === questionId)
    if (targetQuestion) {
      return generateInteractiveQuestionHtml(targetQuestion, buildUrl, {
        title,
        logoUrl,
        primaryColor,
        formTitle: title,
      })
    }
  }

  // Fallback / Card Mode
  return `<!-- Inicio Bloco Formularios.ia para Brevo -->
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
  ${
    logoUrl
      ? `<tr>
    <td align="center" style="padding: 28px 24px 12px 24px;">
      <img src="${escapeHtml(logoUrl)}" alt="Logo" style="max-height: 48px; max-width: 180px; height: auto; border: 0; display: block;" />
    </td>
  </tr>`
      : ""
  }
  <tr>
    <td style="padding: ${logoUrl ? "12px" : "32px"} 32px 20px 32px; text-align: center;">
      <h2 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 700; color: #111827; line-height: 1.3;">${title}</h2>
      ${
        description
          ? `<p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">${description}</p>`
          : ""
      }
    </td>
  </tr>
  <tr>
    <td align="center" style="padding: 12px 32px 32px 32px;">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${defaultCtaUrl}" style="height:46px;v-text-anchor:middle;width:240px;" arcsize="20%" stroke="f" fillcolor="${primaryColor}">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">${escapeHtml(buttonText)}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${defaultCtaUrl}" target="_blank" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 13px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: background-color 0.2s;">
        ${escapeHtml(buttonText)} &rarr;
      </a>
      <!--<![endif]-->
    </td>
  </tr>
</table>
<!-- Fim Bloco Formularios.ia para Brevo -->`
}

function generateInteractiveQuestionHtml(
  question: Question,
  buildUrl: (params?: Record<string, string>) => string,
  ctx: { title: string; logoUrl?: string; primaryColor: string; formTitle: string }
): string {
  const qTitle = escapeHtml(question.title || "Sua opinião é importante")
  const qDesc = question.description ? escapeHtml(question.description) : ""
  const qKey = `q_${question.id}`

  let optionsButtonsHtml = ""

  if (question.type === "nps" || question.type === "scale" || question.type === "opinion_scale") {
    // 0 to 10 or 1 to 10 rating buttons
    const minVal = question.properties.scaleMin ?? 0
    const maxVal = question.properties.scaleMax ?? (question.type === "nps" ? 10 : 10)
    const buttons: string[] = []

    for (let i = minVal; i <= maxVal; i++) {
      const url = buildUrl({ [qKey]: String(i) })
      buttons.push(
        `<td align="center" style="padding: 3px;">
          <a href="${url}" target="_blank" style="display: block; width: 38px; height: 38px; line-height: 38px; background-color: #f3f4f6; color: #1f2937; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; text-align: center; border: 1px solid #e5e7eb;">${i}</a>
        </td>`
      )
    }

    const minLabel = escapeHtml(question.properties.scaleMinLabel || "Pouco provável")
    const maxLabel = escapeHtml(question.properties.scaleMaxLabel || "Muito provável")

    optionsButtonsHtml = `
    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto; width: 100%; max-width: 520px;">
      <tr>
        ${buttons.join("\n")}
      </tr>
    </table>
    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 8px auto 0 auto; width: 100%; max-width: 520px;">
      <tr>
        <td align="left" style="font-size: 11px; color: #9ca3af; font-weight: 500;">${minLabel}</td>
        <td align="right" style="font-size: 11px; color: #9ca3af; font-weight: 500;">${maxLabel}</td>
      </tr>
    </table>`
  } else if (question.type === "rating") {
    // 1 to 5 rating stars/numbers
    const maxRating = question.properties.ratingMax || 5
    const buttons: string[] = []

    for (let i = 1; i <= maxRating; i++) {
      const url = buildUrl({ [qKey]: String(i) })
      buttons.push(
        `<td align="center" style="padding: 4px;">
          <a href="${url}" target="_blank" style="display: block; width: 44px; height: 44px; line-height: 44px; background-color: #fef3c7; color: #d97706; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 700; text-align: center; border: 1px solid #fde68a;">★ ${i}</a>
        </td>`
      )
    }

    optionsButtonsHtml = `
    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
      <tr>
        ${buttons.join("\n")}
      </tr>
    </table>`
  } else if (question.type === "yes_no") {
    const yesUrl = buildUrl({ [qKey]: "Sim" })
    const noUrl = buildUrl({ [qKey]: "Não" })

    optionsButtonsHtml = `
    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
      <tr>
        <td align="center" style="padding: 0 8px;">
          <a href="${yesUrl}" target="_blank" style="display: inline-block; background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600;">👍 Sim</a>
        </td>
        <td align="center" style="padding: 0 8px;">
          <a href="${noUrl}" target="_blank" style="display: inline-block; background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600;">👎 Não</a>
        </td>
      </tr>
    </table>`
  } else if (question.type === "multiple_choice" || question.type === "dropdown") {
    const optionsList = question.properties.options || []
    const optionRows = optionsList.slice(0, 6).map((opt) => {
      const url = buildUrl({ [qKey]: opt.label })
      return `<tr>
        <td align="center" style="padding: 5px 0;">
          <a href="${url}" target="_blank" style="display: block; width: 85%; max-width: 380px; background-color: #f9fafb; color: #374151; border: 1px solid #e5e7eb; padding: 11px 16px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500; text-align: center;">${escapeHtml(opt.label)}</a>
        </td>
      </tr>`
    })

    optionsButtonsHtml = `
    <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
      ${optionRows.join("\n")}
    </table>`
  } else {
    // Default fallback to CTA button
    const defaultUrl = buildUrl()
    optionsButtonsHtml = `
    <a href="${defaultUrl}" target="_blank" style="display: inline-block; background-color: ${ctx.primaryColor}; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 13px 28px; border-radius: 8px;">
      Responder no formulário &rarr;
    </a>`
  }

  return `<!-- Inicio Bloco Pergunta Interativa para Brevo -->
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
  ${
    ctx.logoUrl
      ? `<tr>
    <td align="center" style="padding: 24px 24px 8px 24px;">
      <img src="${escapeHtml(ctx.logoUrl)}" alt="Logo" style="max-height: 40px; max-width: 160px; height: auto; border: 0; display: block;" />
    </td>
  </tr>`
      : ""
  }
  <tr>
    <td style="padding: ${ctx.logoUrl ? "12px" : "28px"} 28px 16px 28px; text-align: center;">
      <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; tracking: 0.05em; color: ${ctx.primaryColor};">${ctx.formTitle}</p>
      <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #111827; line-height: 1.3;">${qTitle}</h3>
      ${qDesc ? `<p style="margin: 0; font-size: 13px; color: #6b7280;">${qDesc}</p>` : ""}
    </td>
  </tr>
  <tr>
    <td align="center" style="padding: 8px 20px 28px 20px;">
      ${optionsButtonsHtml}
    </td>
  </tr>
  <tr>
    <td align="center" style="padding: 12px; background-color: #f9fafb; border-top: 1px solid #f3f4f6;">
      <span style="font-size: 11px; color: #9ca3af;">Clique em uma opção para registrar sua resposta</span>
    </td>
  </tr>
</table>
<!-- Fim Bloco Pergunta Interativa para Brevo -->`
}
