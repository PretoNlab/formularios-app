import { eq, and, desc, asc, sql, isNotNull, count } from "drizzle-orm"
import { db } from "../client"
import { forms, questions, responses, answers } from "../schema"
import type { ResponseMetadata, AnswerValue } from "../schema"
import type { ApiResponse, PaginatedResponse, FormAnalytics } from "../../types/form"

// ─── Inferred row types ───────────────────────────────────────────────────────

type ResponseRow = typeof responses.$inferSelect
type AnswerRow = typeof answers.$inferSelect

export type ResponseWithAnswers = ResponseRow & { answers: AnswerRow[] }

// ─── Input types ─────────────────────────────────────────────────────────────

export interface SaveAnswerInput {
  questionId: string
  value: AnswerValue
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Starts a new response session. Call this when the respondent opens the form.
 * Returns the response row with its generated ID, which must be stored client-side
 * and passed to subsequent `saveAnswers` / `completeResponse` calls.
 */
export async function createResponse(
  formId: string,
  metadata: Partial<ResponseMetadata> = {}
): Promise<ApiResponse<ResponseRow>> {
  try {
    const [created] = await db
      .insert(responses)
      .values({
        formId,
        metadata: {
          userAgent: null,
          ipHash: null,
          utmSource: null,
          utmMedium: null,
          utmCampaign: null,
          referrer: null,
          deviceType: null,
          ...metadata,
        },
      })
      .returning()

    return { success: true, data: created }
  } catch (error) {
    return {
      success: false,
      error: {
        code: "DB_ERROR",
        message: error instanceof Error ? error.message : "Database error",
      },
    }
  }
}

/**
 * Batch-upserts answers for a response.
 * Safe to call multiple times — subsequent calls update existing answers.
 * Also updates `lastActiveAt` on the parent response.
 */
export async function saveAnswers(
  responseId: string,
  answerList: SaveAnswerInput[]
): Promise<ApiResponse<AnswerRow[]>> {
  try {
    if (answerList.length === 0) return { success: true, data: [] }

    const result = await db.transaction(async (tx) => {
      const rows = await tx
        .insert(answers)
        .values(
          answerList.map((a) => ({
            responseId,
            questionId: a.questionId,
            value: a.value,
          }))
        )
        .onConflictDoUpdate({
          target: [answers.responseId, answers.questionId],
          set: {
            value: sql`excluded.value`,
            answeredAt: new Date(),
          },
        })
        .returning()

      await tx
        .update(responses)
        .set({ lastActiveAt: new Date() })
        .where(eq(responses.id, responseId))

      return rows
    })

    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: {
        code: "DB_ERROR",
        message: error instanceof Error ? error.message : "Database error",
      },
    }
  }
}

/**
 * Marks a response as complete and increments the form's `responseCount`.
 * Call this when the respondent reaches the thank-you screen.
 */
export async function completeResponse(
  responseId: string
): Promise<ApiResponse<ResponseRow>> {
  try {
    const result = await db.transaction(async (tx) => {
      const [completed] = await tx
        .update(responses)
        .set({ completedAt: new Date(), lastActiveAt: new Date() })
        .where(eq(responses.id, responseId))
        .returning()

      if (!completed) return null

      await tx
        .update(forms)
        .set({ responseCount: sql`${forms.responseCount} + 1` })
        .where(eq(forms.id, completed.formId))

      return completed
    })

    if (!result) {
      return { success: false, error: { code: "NOT_FOUND", message: "Response not found" } }
    }

    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: {
        code: "DB_ERROR",
        message: error instanceof Error ? error.message : "Database error",
      },
    }
  }
}

/**
 * Returns paginated responses for a form, newest first.
 * Each response includes its answers array.
 */
export async function getResponsesByForm(
  formId: string,
  page: number,
  pageSize: number
): Promise<PaginatedResponse<ResponseWithAnswers>> {
  try {
    const offset = (page - 1) * pageSize

    const [totalResult, rows] = await Promise.all([
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(responses)
        .where(eq(responses.formId, formId)),

      db.query.responses.findMany({
        where: eq(responses.formId, formId),
        orderBy: [desc(responses.startedAt)],
        limit: pageSize,
        offset,
        with: { answers: true },
      }),
    ])

    const total = totalResult[0]?.total ?? 0
    const totalPages = Math.ceil(total / pageSize)

    return {
      success: true,
      data: rows,
      pagination: { page, pageSize, total, totalPages },
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: "DB_ERROR",
        message: error instanceof Error ? error.message : "Database error",
      },
      pagination: { page, pageSize, total: 0, totalPages: 0 },
    }
  }
}

/**
 * Fast count of total (not necessarily completed) responses for a form.
 */
export async function getResponseCount(formId: string): Promise<ApiResponse<number>> {
  try {
    const [result] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(responses)
      .where(eq(responses.formId, formId))

    return { success: true, data: result?.total ?? 0 }
  } catch (error) {
    return {
      success: false,
      error: {
        code: "DB_ERROR",
        message: error instanceof Error ? error.message : "Database error",
      },
    }
  }
}

/**
 * Computes analytics for a form:
 *  - Total views, total responses, completion rate
 *  - Average completion time (seconds)
 *  - Responses by day (last 30 days)
 *  - Dropoff rate per question
 */
export async function getFormAnalytics(
  formId: string
): Promise<ApiResponse<FormAnalytics>> {
  try {
    // ── 1. Form-level counters ───────────────────────────────────────────────
    const form = await db.query.forms.findFirst({
      where: eq(forms.id, formId),
      columns: { viewCount: true, responseCount: true },
    })

    if (!form) {
      return { success: false, error: { code: "NOT_FOUND", message: "Form not found" } }
    }

    // ── 2. Response completion stats ─────────────────────────────────────────
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        completed: sql<number>`count(case when ${responses.completedAt} is not null then 1 end)::int`,
        avgSeconds: sql<number | null>`
          avg(extract(epoch from (${responses.completedAt} - ${responses.startedAt})))
        `,
      })
      .from(responses)
      .where(eq(responses.formId, formId))

    const total = stats?.total ?? 0
    const completed = stats?.completed ?? 0
    const completionRate = total > 0 ? completed / total : 0
    const averageCompletionTime = Math.round(stats?.avgSeconds ?? 0)

    // ── 3. Responses per day — last 30 days ──────────────────────────────────
    const responsesByDay = await db
      .select({
        date: sql<string>`date(${responses.startedAt})::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(responses)
      .where(
        and(
          eq(responses.formId, formId),
          sql`${responses.startedAt} >= now() - interval '30 days'`
        )
      )
      .groupBy(sql`date(${responses.startedAt})`)
      .orderBy(sql`date(${responses.startedAt})`)

    // ── 4. Dropoff by question ────────────────────────────────────────────────
    const formQuestions = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.formId, formId))
      .orderBy(asc(questions.order))

    const answerCounts = await db
      .select({
        questionId: answers.questionId,
        respondentCount: sql<number>`count(distinct ${answers.responseId})::int`,
      })
      .from(answers)
      .innerJoin(responses, eq(answers.responseId, responses.id))
      .where(eq(responses.formId, formId))
      .groupBy(answers.questionId)

    const answerCountMap = new Map(
      answerCounts.map((a) => [a.questionId, a.respondentCount])
    )

    const dropoffByQuestion = formQuestions.map((q) => ({
      questionId: q.id,
      dropoffRate: total > 0 ? 1 - (answerCountMap.get(q.id) ?? 0) / total : 0,
    }))

    return {
      success: true,
      data: {
        totalViews: form.viewCount,
        totalResponses: total,
        completionRate,
        averageCompletionTime,
        responsesByDay,
        dropoffByQuestion,
        questionStats: [], // Detailed per-question stats computed on demand
      },
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: "DB_ERROR",
        message: error instanceof Error ? error.message : "Database error",
      },
    }
  }
}
