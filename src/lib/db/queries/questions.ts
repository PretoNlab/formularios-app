import { eq, and, asc, notInArray, inArray, sql } from "drizzle-orm"
import { db } from "../client"
import { questions } from "../schema"
import type { ApiResponse } from "../../types/form"

// ─── Inferred row types ───────────────────────────────────────────────────────

type QuestionRow = typeof questions.$inferSelect

// ─── Input types ─────────────────────────────────────────────────────────────

/**
 * Shape expected when upserting questions from the builder.
 * `id` should be provided for existing questions; omit or use a client-generated
 * UUID for new ones (Drizzle will use the DB default if omitted, but the builder
 * typically pre-generates IDs with crypto.randomUUID()).
 */
export type UpsertQuestionInput = typeof questions.$inferInsert

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Returns all questions for a form, ordered by `order` ascending.
 */
export async function getQuestionsByForm(
  formId: string
): Promise<ApiResponse<QuestionRow[]>> {
  try {
    const result = await db
      .select()
      .from(questions)
      .where(eq(questions.formId, formId))
      .orderBy(asc(questions.order))

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
 * Batch upsert for the builder's save action.
 *
 * Within a single transaction:
 *  1. Deletes any questions belonging to the form whose IDs are NOT in the list
 *     (i.e. questions that were removed in the builder).
 *  2. Inserts/updates every question in the list via ON CONFLICT DO UPDATE.
 *
 * This keeps the DB in sync with the builder state in one round-trip.
 */
export async function upsertQuestions(
  formId: string,
  questionList: UpsertQuestionInput[]
): Promise<ApiResponse<QuestionRow[]>> {
  try {
    const result = await db.transaction(async (tx) => {
      // Collect IDs of questions that should survive
      const incomingIds = questionList
        .map((q) => q.id)
        .filter((id): id is string => !!id)

      // Defense in depth: if the caller supplied IDs, every one of them must
      // either be new (no row exists) or already belong to this form. Without
      // this check, an attacker who knows the UUID of a question in another
      // tenant's form could overwrite it via ON CONFLICT (id) since `formId`
      // is intentionally not in the SET clause.
      if (incomingIds.length > 0) {
        const existing = await tx
          .select({ id: questions.id, formId: questions.formId })
          .from(questions)
          .where(inArray(questions.id, incomingIds))

        const foreign = existing.find((row) => row.formId !== formId)
        if (foreign) {
          throw new Error("ID de pergunta pertence a outro formulário.")
        }
      }

      // Delete removed questions
      if (incomingIds.length > 0) {
        await tx
          .delete(questions)
          .where(
            and(
              eq(questions.formId, formId),
              notInArray(questions.id, incomingIds)
            )
          )
      } else {
        // All questions were removed
        await tx.delete(questions).where(eq(questions.formId, formId))
      }

      if (questionList.length === 0) return []

      // Upsert — insert new rows, update existing on id conflict
      const rows = await tx
        .insert(questions)
        .values(questionList.map((q) => ({ ...q, formId })))
        .onConflictDoUpdate({
          target: questions.id,
          set: {
            title: sql`excluded.title`,
            description: sql`excluded.description`,
            required: sql`excluded.required`,
            order: sql`excluded.order`,
            properties: sql`excluded.properties`,
            logicRules: sql`excluded.logic_rules`,
            updatedAt: new Date(),
          },
        })
        .returning()

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
 * Updates only the `order` field for a set of questions.
 * `orderedIds` is the full ordered array of question IDs as they appear in the builder.
 *
 * Runs all updates concurrently inside a transaction for atomicity.
 */
export async function reorderQuestions(
  formId: string,
  orderedIds: string[]
): Promise<ApiResponse<void>> {
  try {
    await db.transaction(async (tx) => {
      await Promise.all(
        orderedIds.map((id, index) =>
          tx
            .update(questions)
            .set({ order: index, updatedAt: new Date() })
            .where(and(eq(questions.id, id), eq(questions.formId, formId)))
        )
      )
    })

    return { success: true }
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
