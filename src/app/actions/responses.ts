"use server"

import { z } from "zod"
import { eq, asc, and, gte, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { createHash } from "crypto"
import { db } from "@/lib/db/client"
import { forms, questions, responses } from "@/lib/db/schema"
import { createResponse, saveAnswers, completeResponse } from "@/lib/db/queries/responses"
import { getIntegrationsByForm } from "@/lib/db/queries/integrations"
import { sendResponseNotification } from "@/lib/email"
import type { AnswerValue, FormSettings } from "@/lib/db/schema"

// ─── Rate limiting ────────────────────────────────────────────────────────────

const RATE_LIMIT_MAX = 5          // max submissions per IP per form
const RATE_LIMIT_WINDOW_MIN = 60  // within this many minutes

function hashIp(ip: string): string {
  return createHash("sha256").update(ip + process.env.NEXT_PUBLIC_SUPABASE_URL).digest("hex").slice(0, 32)
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

// ─── Validation schema ────────────────────────────────────────────────────────

const answerValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.object({ fileUrl: z.string(), fileName: z.string() }),
  z.null(),
])

const submitResponseSchema = z.object({
  formId: z.string().uuid("ID de formulário inválido."),
  answers: z.record(z.string(), answerValueSchema),
})

const clientMetaSchema = z.object({
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  referrer: z.string().max(500).optional(),
  deviceType: z.enum(["desktop", "mobile", "tablet"]).optional(),
})

function isAnswerEmpty(value: AnswerValue | undefined): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === "string") return value.trim() === ""
  if (Array.isArray(value)) return value.length === 0
  return false
}

const NON_INPUT_TYPES = new Set(["welcome", "thank_you", "statement"])

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Submits a completed form response.
 * Validates input with Zod, checks form status, enforces required fields,
 * then saves answers and fires webhooks/notifications.
 */
export async function submitResponseAction(
  formId: string,
  rawAnswers: Record<string, AnswerValue>,
  rawClientMeta?: unknown
) {
  // 1. Parse + sanitize input with Zod
  const parsed = submitResponseSchema.safeParse({ formId, answers: rawAnswers })
  if (!parsed.success) throw new Error("Dados de envio inválidos.")
  const { answers: parsedAnswers } = parsed.data

  const clientMeta = rawClientMeta
    ? (clientMetaSchema.safeParse(rawClientMeta).data ?? {})
    : {}

  // 2. Fetch form for status + settings validation
  const form = await db.query.forms.findFirst({
    where: eq(forms.id, formId),
    columns: { id: true, status: true, title: true, settings: true, responseCount: true },
  })

  if (!form) throw new Error("Formulário não encontrado.")
  if (form.status !== "published") throw new Error("Este formulário não está aceitando respostas.")

  const settings = form.settings as FormSettings

  // 3. Check response limit
  if (settings.responseLimit !== null && settings.responseLimit !== undefined) {
    if (form.responseCount >= settings.responseLimit) {
      throw new Error("Este formulário atingiu o limite de respostas.")
    }
  }

  // 4. Fetch questions for required-field validation + ID allowlist
  const formQuestions = await db
    .select({ id: questions.id, required: questions.required, type: questions.type })
    .from(questions)
    .where(eq(questions.formId, formId))
    .orderBy(asc(questions.order))

  const validQuestionIds = new Set(formQuestions.map((q) => q.id))

  // 5. Validate required fields
  for (const q of formQuestions) {
    if (q.required && !NON_INPUT_TYPES.has(q.type)) {
      if (isAnswerEmpty(parsedAnswers[q.id] as AnswerValue | undefined)) {
        throw new Error("Campo obrigatório não preenchido.")
      }
    }
  }

  // 6. Sanitize: only save answers for questions that belong to this form
  const sanitizedAnswers = Object.fromEntries(
    Object.entries(parsedAnswers).filter(([qId]) => validQuestionIds.has(qId))
  ) as Record<string, AnswerValue>

  // 7. Extract client IP, hash it, check rate limit
  const headersList = await headers()
  const userAgent = headersList.get("user-agent")
  const rawIp =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown"
  const ipHash = hashIp(rawIp)

  if (await isRateLimited(formId, ipHash)) {
    throw new Error("Muitas respostas enviadas. Aguarde um momento e tente novamente.")
  }

  // 8. Create the response session
  const { data: response, success } = await createResponse(formId, {
    userAgent,
    ipHash,
    utmSource: clientMeta.utmSource ?? null,
    utmMedium: clientMeta.utmMedium ?? null,
    utmCampaign: clientMeta.utmCampaign ?? null,
    referrer: clientMeta.referrer ?? null,
    deviceType: clientMeta.deviceType ?? null,
  })
  if (!success || !response) throw new Error("Falha ao registrar resposta.")

  // 9. Save answers
  const answerList = Object.entries(sanitizedAnswers).map(([questionId, value]) => ({
    questionId,
    value,
  }))
  if (answerList.length > 0) {
    await saveAnswers(response.id, answerList)
  }

  // 10. Mark complete (also increments form.responseCount)
  await completeResponse(response.id)

  // 11. Send email notification (fire-and-forget)
  if (settings.notifyOnResponse && settings.notificationEmail) {
    sendResponseNotification({
      toEmail: settings.notificationEmail,
      formId,
      formTitle: form.title,
      responseId: response.id,
      answers: sanitizedAnswers,
    }).catch(() => {
      // Swallow errors — email failure must not affect the respondent
    })
  }

  // 12. Fire webhooks (fire-and-forget — never block the respondent)
  const { data: integrationsList } = await getIntegrationsByForm(formId, "webhook")
  if (integrationsList && integrationsList.length > 0) {
    const payload = JSON.stringify({
      event: "response.completed",
      formId,
      responseId: response.id,
      answers: sanitizedAnswers,
      submittedAt: new Date().toISOString(),
    })

    for (const integration of integrationsList) {
      if (!integration.enabled) continue
      const url = (integration.config as { url?: string })?.url
      if (!url) continue

      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      }).catch(() => {
        // Swallow errors — webhook failure must not affect the respondent
      })
    }
  }
}

/**
 * Exports all responses for a form as a CSV string.
 */
export async function exportResponsesAction(formId: string): Promise<string> {
  const formQuestions = await db
    .select({ id: questions.id, title: questions.title, order: questions.order })
    .from(questions)
    .where(eq(questions.formId, formId))
    .orderBy(asc(questions.order))

  const allResponses = await db.query.responses.findMany({
    where: eq(responses.formId, formId),
    orderBy: [asc(responses.startedAt)],
    with: { answers: true },
  })

  function csvCell(value: unknown): string {
    if (value === null || value === undefined) return ""
    let str: string
    if (typeof value === "boolean") str = value ? "Sim" : "Não"
    else if (Array.isArray(value)) str = value.join("; ")
    else if (typeof value === "object" && "fileName" in (value as object))
      str = (value as { fileName: string }).fileName
    else str = String(value)
    if (str.includes('"') || str.includes(",") || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const csvHeaders = [
    "ID",
    "Data de início",
    "Concluída em",
    "Status",
    "Tempo (s)",
    ...formQuestions.map((q) => q.title || `Pergunta ${q.order + 1}`),
  ]

  const rows = allResponses.map((r) => {
    const answerMap = new Map(r.answers.map((a) => [a.questionId, a.value]))
    const duration =
      r.completedAt
        ? Math.round((new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime()) / 1000)
        : ""
    return [
      r.id,
      new Date(r.startedAt).toISOString(),
      r.completedAt ? new Date(r.completedAt).toISOString() : "",
      r.completedAt ? "Completa" : "Parcial",
      String(duration),
      ...formQuestions.map((q) => csvCell(answerMap.get(q.id))),
    ]
  })

  const lines = [csvHeaders.map(csvCell).join(","), ...rows.map((r) => r.map(csvCell).join(","))]
  return lines.join("\n")
}
