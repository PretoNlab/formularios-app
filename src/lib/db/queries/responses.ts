import { eq, and, desc, asc, sql, inArray } from "drizzle-orm"
import { db } from "../client"
import { forms, questions, responses, answers } from "../schema"
import type { ResponseMetadata, AnswerValue } from "../schema"
import type { ApiResponse, PaginatedResponse, FormAnalytics, QuestionAnalytics, QuestionType } from "../../types/form"

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

const LAYOUT_TYPES = new Set(["welcome", "statement", "thank_you"])
const SELECTION_TYPES = new Set(["multiple_choice", "dropdown", "yes_no"])
const CHECKBOX_TYPES = new Set(["checkbox"])
const NUMERIC_TYPES = new Set(["rating", "scale", "nps", "number"])

/**
 * Computes analytics for a form:
 *  - Total views, total responses, completion rate
 *  - Average completion time (seconds)
 *  - Responses by day (last 30 days)
 *  - Dropoff rate per question
 *  - Per-question answer distributions + NPS score
 *  - Mobile percentage from user agents
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

    // ── 2. Response completion stats + mobile detection ───────────────────────
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        completed: sql<number>`count(case when ${responses.completedAt} is not null then 1 end)::int`,
        avgSeconds: sql<number | null>`
          avg(extract(epoch from (${responses.completedAt} - ${responses.startedAt})))
        `,
        mobileCount: sql<number>`
          count(case when
            lower(${responses.metadata}->>'userAgent') like '%mobile%' or
            lower(${responses.metadata}->>'userAgent') like '%android%' or
            lower(${responses.metadata}->>'userAgent') like '%iphone%'
          then 1 end)::int
        `,
      })
      .from(responses)
      .where(eq(responses.formId, formId))

    const total = stats?.total ?? 0
    const completed = stats?.completed ?? 0
    const completionRate = total > 0 ? completed / total : 0
    const averageCompletionTime = Math.round(stats?.avgSeconds ?? 0)
    const mobilePercentage = total > 0 ? (stats?.mobileCount ?? 0) / total : 0

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

    // ── 4. Questions metadata ─────────────────────────────────────────────────
    const formQuestions = await db
      .select({ id: questions.id, title: questions.title, type: questions.type, properties: questions.properties })
      .from(questions)
      .where(eq(questions.formId, formId))
      .orderBy(asc(questions.order))

    // ── 5. Dropoff by question ────────────────────────────────────────────────
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

    // ── 6. Per-question answer distributions ─────────────────────────────────
    const inputQuestions = formQuestions.filter((q) => !LAYOUT_TYPES.has(q.type))

    const questionStats: QuestionAnalytics[] = []

    if (inputQuestions.length > 0) {
      const allAnswers = await db
        .select({ questionId: answers.questionId, value: answers.value })
        .from(answers)
        .innerJoin(responses, eq(answers.responseId, responses.id))
        .where(
          and(
            eq(responses.formId, formId),
            inArray(answers.questionId, inputQuestions.map((q) => q.id))
          )
        )

      // Group raw answers by questionId
      const byQuestion = new Map<string, unknown[]>()
      for (const a of allAnswers) {
        const arr = byQuestion.get(a.questionId) ?? []
        arr.push(a.value)
        byQuestion.set(a.questionId, arr)
      }

      for (const q of inputQuestions) {
        const qAnswers = byQuestion.get(q.id) ?? []
        const totalAnswers = qAnswers.length
        const skipRate = total > 0 ? 1 - totalAnswers / total : 0
        const base = {
          questionId: q.id,
          questionTitle: q.title,
          questionType: q.type as QuestionType,
          totalAnswers,
          skipRate,
        }

        // Selection (multiple_choice, dropdown, yes_no)
        if (SELECTION_TYPES.has(q.type)) {
          const counts = new Map<string, number>()
          for (const v of qAnswers) {
            const key = String(v ?? "")
            if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
          }
          const optionCounts = Array.from(counts.entries())
            .map(([option, count]) => ({
              option,
              count,
              percentage: totalAnswers > 0 ? count / totalAnswers : 0,
            }))
            .sort((a, b) => b.count - a.count)
          questionStats.push({ ...base, optionCounts })
          continue
        }

        // Checkbox (value is string[])
        if (CHECKBOX_TYPES.has(q.type)) {
          const counts = new Map<string, number>()
          for (const v of qAnswers) {
            const items = Array.isArray(v) ? v : [String(v ?? "")]
            for (const item of items) {
              if (item) counts.set(item, (counts.get(item) ?? 0) + 1)
            }
          }
          const optionCounts = Array.from(counts.entries())
            .map(([option, count]) => ({
              option,
              count,
              percentage: totalAnswers > 0 ? count / totalAnswers : 0,
            }))
            .sort((a, b) => b.count - a.count)
          questionStats.push({ ...base, optionCounts })
          continue
        }

        // Numeric (rating, scale, nps, number)
        if (NUMERIC_TYPES.has(q.type)) {
          const nums = qAnswers
            .map((v) => (typeof v === "number" ? v : parseFloat(String(v ?? ""))))
            .filter((n) => !isNaN(n))

          if (nums.length === 0) { questionStats.push(base); continue }

          const avg = nums.reduce((a, b) => a + b, 0) / nums.length
          const distMap = new Map<number, number>()
          for (const n of nums) distMap.set(n, (distMap.get(n) ?? 0) + 1)
          const distribution = Array.from(distMap.entries())
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => a.value - b.value)

          let npsScore: number | undefined
          let npsPromoters: number | undefined
          let npsPassives: number | undefined
          let npsDetractors: number | undefined

          const props = q.properties as {
            scaleMin?: number; scaleMax?: number
            scaleMinLabel?: string; scaleMaxLabel?: string
            ratingMax?: number; ratingStyle?: string
          } | null
          const isNpsScale = q.type === "scale" && props?.scaleMin === 0 && props?.scaleMax === 10
          if (q.type === "nps" || isNpsScale) {
            const promoters = nums.filter((n) => n >= 9).length
            const passives = nums.filter((n) => n >= 7 && n <= 8).length
            const detractors = nums.filter((n) => n <= 6).length
            npsScore = Math.round(((promoters - detractors) / nums.length) * 100)
            npsPromoters = Math.round((promoters / nums.length) * 100)
            npsPassives = Math.round((passives / nums.length) * 100)
            npsDetractors = Math.round((detractors / nums.length) * 100)
          }

          questionStats.push({
            ...base,
            average: Math.round(avg * 10) / 10,
            min: Math.min(...nums),
            max: Math.max(...nums),
            distribution,
            // Rating context
            ...(q.type === "rating" && {
              ratingMax: props?.ratingMax ?? 5,
              ratingStyle: (props?.ratingStyle ?? "stars") as "stars" | "hearts" | "thumbs" | "numbers",
            }),
            // Scale context (non-NPS)
            ...(!isNpsScale && q.type === "scale" && {
              scaleMin: props?.scaleMin ?? 1,
              scaleMax: props?.scaleMax ?? 10,
              scaleMinLabel: props?.scaleMinLabel,
              scaleMaxLabel: props?.scaleMaxLabel,
            }),
            npsScore,
            npsPromoters,
            npsPassives,
            npsDetractors,
          })
          continue
        }

        // Text types — store last 5 non-empty samples
        const textSamples = qAnswers
          .filter((v) => typeof v === "string" && (v as string).trim().length > 0)
          .slice(-5)
          .reverse() as string[]
        questionStats.push({ ...base, textSamples })
      }
    }

    // ── 7. Source breakdown (UTM source or referrer) ──────────────────────────
    const sourceRows = await db
      .select({
        source: sql<string>`coalesce(nullif(${responses.metadata}->>'utmSource', ''), nullif(${responses.metadata}->>'referrer', ''), 'Direto')`,
        count: sql<number>`count(*)::int`,
      })
      .from(responses)
      .where(eq(responses.formId, formId))
      .groupBy(sql`coalesce(nullif(${responses.metadata}->>'utmSource', ''), nullif(${responses.metadata}->>'referrer', ''), 'Direto')`)
      .orderBy(sql`count(*) desc`)

    const sourceBreakdown = sourceRows.map((r) => ({
      source: r.source,
      count: r.count,
      percentage: total > 0 ? r.count / total : 0,
    }))

    // ── 8. Device breakdown ───────────────────────────────────────────────────
    const deviceRows = await db
      .select({
        device: sql<string>`coalesce(nullif(${responses.metadata}->>'deviceType', ''), 'unknown')`,
        count: sql<number>`count(*)::int`,
      })
      .from(responses)
      .where(eq(responses.formId, formId))
      .groupBy(sql`coalesce(nullif(${responses.metadata}->>'deviceType', ''), 'unknown')`)
      .orderBy(sql`count(*) desc`)

    const deviceBreakdown = deviceRows.map((r) => ({
      device: r.device,
      count: r.count,
      percentage: total > 0 ? r.count / total : 0,
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
        questionStats,
        mobilePercentage,
        sourceBreakdown,
        deviceBreakdown,
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
