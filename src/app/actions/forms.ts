"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import {
  createForm,
  closeForm,
  deleteForm,
  duplicateForm,
  publishForm,
  updateForm,
  type UpdateFormInput,
} from "@/lib/db/queries/forms"
import { db } from "@/lib/db/client"
import { forms, users } from "@/lib/db/schema"
import { eq, and, sql as drizzleSql } from "drizzle-orm"
import { upsertQuestions, type UpsertQuestionInput } from "@/lib/db/queries/questions"
import { FORM_TEMPLATES } from "@/config/templates"
import { type ApiResponse } from "@/lib/types/form"
import { requireUser, requireFormOwner } from "@/lib/auth"

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Creates a new blank form and redirects to the builder.
 */
export async function createFormAction() {
  const user = await requireUser()

  const result = await createForm({
    workspaceId: user.defaultWorkspace.id,
    createdById: user.id,
    title: "Formulário sem título",
  })

  if (!result.success || !result.data) {
    throw new Error("Falha ao criar formulário.")
  }

  revalidatePath("/dashboard")
  redirect(`/builder/${result.data.id}`)
}

/**
 * Deletes a form and revalidates the dashboard.
 */
export async function deleteFormAction(formId: string) {
  await requireFormOwner(formId)
  await deleteForm(formId)
  revalidatePath("/dashboard")
}

/**
 * Publishes a form (draft → published).
 * Enforces the user's published form quota.
 */
export async function publishFormAction(formId: string) {
  const { user } = await requireFormOwner(formId)

  const [owner, publishedResult] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { formQuota: true, planExpiresAt: true },
    }),
    db.select({ total: drizzleSql<number>`count(*)::int` }).from(forms).where(
      and(eq(forms.createdById, user.id), eq(forms.status, "published"))
    ),
  ])

  if (owner?.planExpiresAt && owner.planExpiresAt <= new Date()) {
    throw new Error("Seu plano expirou. Renove em /billing para publicar formulários.")
  }

  const publishedCount = publishedResult[0]?.total ?? 0
  const quota = owner?.formQuota ?? 3

  if (publishedCount >= quota) {
    throw new Error(`Limite de ${quota} formulário${quota !== 1 ? "s" : ""} publicado${quota !== 1 ? "s" : ""} atingido. Faça uma recarga para publicar mais.`)
  }

  const result = await publishForm(formId)
  if (!result.success) throw new Error("Falha ao publicar formulário.")
  revalidatePath("/dashboard")
}

/**
 * Combined action to save all form data and optionally publish it.
 * This is now the primary way to persist changes from the builder.
 */
export async function saveAndPublishFormAction(
  formId: string,
  input: UpdateFormInput,
  questions: UpsertQuestionInput[],
  shouldPublish: boolean = false
): Promise<ApiResponse<void>> {
  try {
    const { form, user } = await requireFormOwner(formId)

    // 1. If publishing, check quota first
    if (shouldPublish && form.status === "draft") {
      const [owner, publishedResult] = await Promise.all([
        db.query.users.findFirst({
          where: eq(users.id, user.id),
          columns: { formQuota: true, planExpiresAt: true },
        }),
        db.select({ total: drizzleSql<number>`count(*)::int` }).from(forms).where(
          and(eq(forms.createdById, user.id), eq(forms.status, "published"))
        ),
      ])

      if (owner?.planExpiresAt && owner.planExpiresAt <= new Date()) {
        throw new Error("Seu plano expirou. Renove em /billing para publicar formulários.")
      }

      const publishedCount = publishedResult[0]?.total ?? 0
      const quota = owner?.formQuota ?? 3

      if (publishedCount >= quota) {
        throw new Error(`Limite de ${quota} formulário${quota !== 1 ? "s" : ""} publicado${quota !== 1 ? "s" : ""} atingido. Faça uma recarga para publicar mais.`)
      }
    }

    // 2. Perform updates
    const promises: Promise<any>[] = [
      updateForm(formId, input),
    ]

    if (questions.length > 0) {
      promises.push(upsertQuestions(formId, questions))
    }

    if (shouldPublish && form.status === "draft") {
      promises.push(publishForm(formId))
    }

    await Promise.all(promises)

    revalidatePath("/dashboard")
    revalidatePath(`/builder/${formId}`)
    revalidatePath(`/f/${input.slug || form.slug}`)
    
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: {
        code: "SAVE_ERROR",
        message: error instanceof Error ? error.message : "Erro ao salvar formulário",
      },
    }
  }
}

/**
 * Creates a new form pre-populated with a template's questions,
 * then redirects to the builder.
 */
export async function createFormFromTemplateAction(templateId: string) {
  const user = await requireUser()

  const template = FORM_TEMPLATES.find((t) => t.id === templateId)
  if (!template) throw new Error("Template não encontrado.")

  const formResult = await createForm({
    workspaceId: user.defaultWorkspace.id,
    createdById: user.id,
    title: template.title,
  })

  if (!formResult.success || !formResult.data) {
    throw new Error("Falha ao criar formulário.")
  }

  const questions: UpsertQuestionInput[] = template.questions.map((q) => ({
    formId: formResult.data!.id,
    type: q.type,
    title: q.title,
    description: q.description,
    required: q.required,
    order: q.order,
    properties: q.properties ?? {},
    logicRules: [],
  }))

  await upsertQuestions(formResult.data.id, questions)

  revalidatePath("/dashboard")
  redirect(`/builder/${formResult.data.id}`)
}

/**
 * Duplicates a form as a new draft and revalidates the dashboard.
 */
export async function duplicateFormAction(formId: string) {
  const { user } = await requireFormOwner(formId)
  const result = await duplicateForm(formId, user.defaultWorkspace.id, user.id)
  if (!result.success) throw new Error("Falha ao duplicar formulário.")
  revalidatePath("/dashboard")
}

/**
 * Closes a published form (stops accepting responses).
 */
export async function closeFormAction(formId: string) {
  await requireFormOwner(formId)
  const result = await closeForm(formId)
  if (!result.success) throw new Error("Falha ao encerrar formulário.")
  revalidatePath("/dashboard")
}
