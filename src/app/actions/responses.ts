"use server"

import { eq, asc, and, inArray, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { db } from "@/lib/db/client"
import { questions, responses, forms } from "@/lib/db/schema"
import { submitResponseCore, submitBodySchema, hashIp } from "@/lib/submit-response-core"
import { requireFormOwner } from "@/lib/auth"
import { getFormAnalytics } from "@/lib/db/queries/responses"
import { randomBytes } from "crypto"
import type { AnswerValue } from "@/lib/db/schema"
import type { AnalyticsPeriod, FormAnalytics, ApiResponse } from "@/lib/types/form"

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Submits a completed form response (called from builder preview / direct server action usage).
 * The public form renderer now uses /api/responses/submit instead, so the SW can intercept it.
 */
export async function submitResponseAction(
  formId: string,
  rawAnswers: Record<string, AnswerValue>,
  rawClientMeta?: unknown
) {
  const parsed = submitBodySchema.safeParse({ formId, answers: rawAnswers, clientMeta: rawClientMeta })
  if (!parsed.success) throw new Error("Dados de envio inválidos.")

  const headersList = await headers()
  const userAgent = headersList.get("user-agent")
  const rawIp =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown"

  await submitResponseCore({
    formId: parsed.data.formId,
    answers: parsed.data.answers as Record<string, AnswerValue>,
    clientMeta: parsed.data.clientMeta,
    ipHash: hashIp(rawIp),
    userAgent,
  })
}

/**
 * Exports all responses for a form as a CSV string.
 */
export async function exportResponsesAction(formId: string, ids?: string[]): Promise<string> {
  await requireFormOwner(formId)

  const formQuestions = await db
    .select({ id: questions.id, title: questions.title, order: questions.order })
    .from(questions)
    .where(eq(questions.formId, formId))
    .orderBy(asc(questions.order))

  const allResponses = await db.query.responses.findMany({
    where:
      ids && ids.length > 0
        ? and(eq(responses.formId, formId), inArray(responses.id, ids))
        : eq(responses.formId, formId),
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
    else if (typeof value === "object" && value !== null && !("fileName" in (value as object)) && !Array.isArray(value))
      str = Object.entries(value as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join("; ")
    else str = String(value)
    
    if (/^[=+\-@\t\r]/.test(str)) {
      str = "'" + str
    }
    
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

/**
 * Recomputes analytics for a form within a period window. Called from the client
 * when the user changes the period selector on the Analytics tab.
 */
export async function getAnalyticsForPeriodAction(
  formId: string,
  period: AnalyticsPeriod,
  answerFilter?: { questionId: string; value: string } | null
): Promise<ApiResponse<FormAnalytics>> {
  await requireFormOwner(formId)
  return getFormAnalytics(formId, period, answerFilter)
}

/**
 * Toggles the public visibility of the analytics dashboard for a form.
 */
export async function togglePublicAnalyticsAction(
  formId: string,
  isPublic: boolean
): Promise<ApiResponse<{ shareToken: string | null }>> {
  await requireFormOwner(formId)
  
  try {
    let newShareToken = null
    if (isPublic) {
      newShareToken = randomBytes(16).toString("hex")
    }
    
    await db
      .update(forms)
      .set({ isAnalyticsPublic: isPublic, shareToken: newShareToken })
      .where(eq(forms.id, formId))
      
    return { success: true, data: { shareToken: newShareToken } }
  } catch (error) {
    return {
      success: false,
      error: { code: "DB_ERROR", message: "Failed to update form visibility." }
    }
  }
}

/**
 * Deletes specific responses from a form and decrements the form's responseCount.
 */
export async function deleteResponsesAction(
  formId: string,
  responseIds: string[]
): Promise<ApiResponse<{ deletedCount: number }>> {
  await requireFormOwner(formId)

  if (!responseIds || responseIds.length === 0) {
    return { success: true, data: { deletedCount: 0 } }
  }

  try {
    const deleted = await db
      .delete(responses)
      .where(and(eq(responses.formId, formId), inArray(responses.id, responseIds)))
      .returning({ id: responses.id })

    const deletedCount = deleted.length

    if (deletedCount > 0) {
      await db
        .update(forms)
        .set({ responseCount: sql`GREATEST(${forms.responseCount} - ${deletedCount}, 0)` })
        .where(eq(forms.id, formId))
    }

    return { success: true, data: { deletedCount } }
  } catch (error) {
    console.error("[deleteResponsesAction] Error:", error)
    return {
      success: false,
      error: { code: "DB_ERROR", message: "Failed to delete responses." }
    }
  }
}
