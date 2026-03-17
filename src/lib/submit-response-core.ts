import { z } from "zod"
import { eq, asc, and, gte, sql } from "drizzle-orm"
import { createHash } from "crypto"
import { db } from "@/lib/db/client"
import { forms, questions, responses, answers, users } from "@/lib/db/schema"
import { getIntegrationsByForm } from "@/lib/db/queries/integrations"
import { sendResponseNotification, sendFirstResponseEmail } from "@/lib/email"
import { appendGoogleSheetsRow } from "@/lib/google-sheets"
import type { AnswerValue, FormSettings, IntegrationConfig } from "@/lib/db/schema"

// ─── Constants ────────────────────────────────────────────────────────────────

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MIN = 60
const NON_INPUT_TYPES = new Set(["welcome", "thank_you", "statement"])

// ─── Validation schemas (exported so callers can reuse) ───────────────────────

export const answerValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.object({ fileUrl: z.string(), fileName: z.string() }),
  z.null(),
])

export const submitBodySchema = z.object({
  formId: z.string().uuid("ID de formulário inválido."),
  answers: z.record(z.string(), answerValueSchema),
  clientMeta: z
    .object({
      utmSource: z.string().max(200).optional(),
      utmMedium: z.string().max(200).optional(),
      utmCampaign: z.string().max(200).optional(),
      referrer: z.string().max(500).optional(),
      deviceType: z.enum(["desktop", "mobile", "tablet"]).optional(),
    })
    .optional(),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function hashIp(ip: string): string {
  return createHash("sha256")
    .update(ip + process.env.NEXT_PUBLIC_SUPABASE_URL)
    .digest("hex")
    .slice(0, 32)
}

// Private IP ranges and localhost — blocked to prevent SSRF
const PRIVATE_IP_RE =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1$|fc00:|fe80:)/i

function isAllowedWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "https:") return false
    if (PRIVATE_IP_RE.test(parsed.hostname)) return false
    return true
  } catch {
    return false
  }
}

function isAnswerEmpty(value: AnswerValue | undefined): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === "string") return value.trim() === ""
  if (Array.isArray(value)) return value.length === 0
  return false
}

async function isRateLimited(formId: string, ipHash: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MIN * 60 * 1000)
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(responses)
    .where(
      and(
        eq(responses.formId, formId),
        gte(responses.startedAt, windowStart),
        sql`${responses.metadata}->>'ipHash' = ${ipHash}`
      )
    )
  return (result?.count ?? 0) >= RATE_LIMIT_MAX
}

// ─── Core submission logic ────────────────────────────────────────────────────

export async function submitResponseCore(params: {
  formId: string
  answers: Record<string, AnswerValue>
  clientMeta?: {
    utmSource?: string
    utmMedium?: string
    utmCampaign?: string
    referrer?: string
    deviceType?: "desktop" | "mobile" | "tablet"
  }
  ipHash: string
  userAgent: string | null
}): Promise<void> {
  const { formId, answers: parsedAnswers, clientMeta = {}, ipHash, userAgent } = params

  // 1. Fetch form for status + settings validation
  const form = await db.query.forms.findFirst({
    where: eq(forms.id, formId),
    columns: { id: true, status: true, title: true, settings: true, responseCount: true, createdById: true },
  })

  if (!form) throw new Error("Formulário não encontrado.")
  if (form.status !== "published") throw new Error("Este formulário não está aceitando respostas.")

  const settings = form.settings as FormSettings

  // 2. Check response limit
  if (settings.responseLimit !== null && settings.responseLimit !== undefined) {
    if (form.responseCount >= settings.responseLimit) {
      throw new Error("Este formulário atingiu o limite de respostas.")
    }
  }

  // 3. Fetch questions for required-field validation + ID allowlist
  const formQuestions = await db
    .select({
      id: questions.id,
      required: questions.required,
      type: questions.type,
      title: questions.title,
      order: questions.order,
    })
    .from(questions)
    .where(eq(questions.formId, formId))
    .orderBy(asc(questions.order))

  const validQuestionIds = new Set(formQuestions.map((q) => q.id))

  // 4. Validate required fields
  for (const q of formQuestions) {
    if (q.required && !NON_INPUT_TYPES.has(q.type)) {
      if (isAnswerEmpty(parsedAnswers[q.id] as AnswerValue | undefined)) {
        throw new Error("Campo obrigatório não preenchido.")
      }
    }
  }

  // 5. Sanitize: only save answers for questions that belong to this form
  const sanitizedAnswers = Object.fromEntries(
    Object.entries(parsedAnswers).filter(([qId]) => validQuestionIds.has(qId))
  ) as Record<string, AnswerValue>

  // 6. Rate limit check
  if (await isRateLimited(formId, ipHash)) {
    throw new Error("Muitas respostas enviadas. Aguarde um momento e tente novamente.")
  }

  // 7-9. Atomically create response, save answers, and mark complete
  const answerList = Object.entries(sanitizedAnswers).map(([questionId, value]) => ({
    questionId,
    value,
  }))

  const response = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(responses)
      .values({
        formId,
        metadata: {
          userAgent,
          ipHash,
          utmSource: clientMeta.utmSource ?? null,
          utmMedium: clientMeta.utmMedium ?? null,
          utmCampaign: clientMeta.utmCampaign ?? null,
          referrer: clientMeta.referrer ?? null,
          deviceType: clientMeta.deviceType ?? null,
        },
      })
      .returning()

    if (answerList.length > 0) {
      await tx
        .insert(answers)
        .values(
          answerList.map((a) => ({
            responseId: created.id,
            questionId: a.questionId,
            value: a.value,
          }))
        )
        .onConflictDoUpdate({
          target: [answers.responseId, answers.questionId],
          set: { value: sql`excluded.value`, answeredAt: new Date() },
        })
    }

    await tx
      .update(responses)
      .set({ completedAt: new Date(), lastActiveAt: new Date() })
      .where(eq(responses.id, created.id))

    await tx
      .update(forms)
      .set({ responseCount: sql`${forms.responseCount} + 1` })
      .where(eq(forms.id, formId))

    return created
  }).catch(() => {
    throw new Error("Falha ao registrar resposta.")
  })

  // 10. Send email notification (fire-and-forget)
  if (settings.notifyOnResponse && settings.notificationEmail) {
    sendResponseNotification({
      toEmail: settings.notificationEmail,
      formId,
      formTitle: form.title,
      responseId: response.id,
      answers: sanitizedAnswers,
    }).catch(() => {})
  }

  // 10b. First-response milestone email (fire-and-forget)
  if (form.responseCount === 0) {
    db.query.users
      .findFirst({ where: eq(users.id, form.createdById), columns: { email: true } })
      .then((creator) => {
        if (creator?.email) {
          sendFirstResponseEmail({ toEmail: creator.email, formId, formTitle: form.title }).catch(() => {})
        }
      })
      .catch(() => {})
  }

  // 11. Fire webhooks (fire-and-forget)
  const { data: webhooks } = await getIntegrationsByForm(formId, "webhook")
  if (webhooks && webhooks.length > 0) {
    const payload = JSON.stringify({
      event: "response.completed",
      formId,
      responseId: response.id,
      answers: sanitizedAnswers,
      submittedAt: new Date().toISOString(),
    })
    for (const wh of webhooks) {
      if (!wh.enabled) continue
      const url = (wh.config as { url?: string })?.url
      if (!url || !isAllowedWebhookUrl(url)) continue
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload }).catch(() => {})
    }
  }

  // 12. Append to Google Sheets (fire-and-forget)
  const { data: sheetsIntegrations } = await getIntegrationsByForm(formId, "google_sheets")
  if (sheetsIntegrations && sheetsIntegrations.length > 0) {
    const questionOrder = formQuestions
      .filter((q) => !NON_INPUT_TYPES.has(q.type))
      .map((q) => ({ id: q.id, title: q.title, order: q.order }))

    for (const integration of sheetsIntegrations) {
      if (!integration.enabled) continue
      const config = integration.config as IntegrationConfig
      if (!config.accessToken || !config.refreshToken || !config.spreadsheetId || !config.sheetName) continue
      appendGoogleSheetsRow({
        accessToken: config.accessToken,
        refreshToken: config.refreshToken,
        tokenExpiry: config.tokenExpiry,
        spreadsheetId: config.spreadsheetId,
        sheetName: config.sheetName,
        questionOrder,
        answers: sanitizedAnswers as Record<string, unknown>,
      }).catch(() => {})
    }
  }
}
