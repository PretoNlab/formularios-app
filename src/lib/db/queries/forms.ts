import { eq, desc, sql, getTableColumns } from "drizzle-orm"
import { db } from "../client"
import { forms, questions } from "../schema"
import type { FormThemeConfig, FormSettings } from "../schema"
import type { ApiResponse } from "../../types/form"
import { generateSlug } from "../../utils/slug"

// ─── Inferred row types ───────────────────────────────────────────────────────

type FormRow = typeof forms.$inferSelect
type QuestionRow = typeof questions.$inferSelect

export type FormListItem = FormRow & { questionCount: number }
export type FormWithQuestions = FormRow & { questions: QuestionRow[] }

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreateFormInput {
  workspaceId: string
  createdById: string
  title?: string
  description?: string
}

export type UpdateFormInput = Partial<
  Pick<FormRow, "title" | "description" | "slug" | "theme" | "settings">
>

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Lists all forms in a workspace, ordered by most recently updated.
 * Includes a computed `questionCount` alongside the stored `responseCount`.
 */
export async function getFormsByWorkspace(
  workspaceId: string
): Promise<ApiResponse<FormListItem[]>> {
  try {
    const result = await db
      .select({
        ...getTableColumns(forms),
        questionCount: sql<number>`(
          select count(*) from ${questions}
          where ${questions.formId} = ${forms.id}
        )::int`,
      })
      .from(forms)
      .where(eq(forms.workspaceId, workspaceId))
      .orderBy(desc(forms.updatedAt))

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
 * Fetches a published form by slug for the public renderer.
 * Includes all questions ordered by `order` asc.
 */
export async function getFormBySlug(
  slug: string
): Promise<ApiResponse<FormWithQuestions | null>> {
  try {
    const form = await db.query.forms.findFirst({
      where: eq(forms.slug, slug),
      with: {
        questions: { orderBy: (q, { asc }) => [asc(q.order)] },
      },
    })

    return { success: true, data: form ?? null }
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
 * Fetches a form by ID for the builder.
 * Includes all questions ordered by `order` asc.
 */
export async function getFormById(
  formId: string
): Promise<ApiResponse<FormWithQuestions | null>> {
  try {
    const form = await db.query.forms.findFirst({
      where: eq(forms.id, formId),
      with: {
        questions: { orderBy: (q, { asc }) => [asc(q.order)] },
      },
    })

    return { success: true, data: form ?? null }
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
 * Creates a new form with a generated slug. Returns the created form row.
 */
export async function createForm(
  input: CreateFormInput
): Promise<ApiResponse<FormRow>> {
  try {
    const title = input.title ?? "Formulário sem título"
    const slug = generateSlug(title)

    const [created] = await db
      .insert(forms)
      .values({
        workspaceId: input.workspaceId,
        createdById: input.createdById,
        title,
        description: input.description,
        slug,
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
 * Partially updates a form. Only the provided fields are changed.
 * `updatedAt` is always refreshed.
 */
export async function updateForm(
  formId: string,
  input: UpdateFormInput
): Promise<ApiResponse<FormRow>> {
  try {
    const [updated] = await db
      .update(forms)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(forms.id, formId))
      .returning()

    if (!updated) {
      return { success: false, error: { code: "NOT_FOUND", message: "Form not found" } }
    }

    return { success: true, data: updated }
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
 * Deletes a form and all its cascaded data (questions, responses, answers).
 */
export async function deleteForm(formId: string): Promise<ApiResponse<void>> {
  try {
    await db.delete(forms).where(eq(forms.id, formId))
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

/**
 * Publishes a form: sets status to "published" and records `publishedAt`.
 */
export async function publishForm(formId: string): Promise<ApiResponse<FormRow>> {
  try {
    const [updated] = await db
      .update(forms)
      .set({
        status: "published",
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(forms.id, formId))
      .returning()

    if (!updated) {
      return { success: false, error: { code: "NOT_FOUND", message: "Form not found" } }
    }

    return { success: true, data: updated }
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
 * Atomically increments the view count for a form identified by slug.
 * Fire-and-forget — errors are silently swallowed to avoid breaking page loads.
 */
export async function incrementViewCount(slug: string): Promise<void> {
  try {
    await db
      .update(forms)
      .set({ viewCount: sql`${forms.viewCount} + 1` })
      .where(eq(forms.slug, slug))
  } catch {
    // Non-critical — don't propagate
  }
}
