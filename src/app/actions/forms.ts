"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import {
  createForm,
  closeForm,
  deleteForm,
  duplicateForm,
  getFormById,
  publishForm,
  updateForm,
  type UpdateFormInput,
} from "@/lib/db/queries/forms"
import { db } from "@/lib/db/client"
import { forms, users } from "@/lib/db/schema"
import { eq, and, sql as drizzleSql } from "drizzle-orm"
import { upsertQuestions, type UpsertQuestionInput } from "@/lib/db/queries/questions"
import { FORM_TEMPLATES } from "@/config/templates"

// ─── Auth helpers ─────────────────────────────────────────────────────────────

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: userWithWorkspace, success } = await ensureUserExists({
    id: user.id,
    email: user.email!,
    user_metadata: user.user_metadata,
  })

  if (!success || !userWithWorkspace) {
    throw new Error("Falha ao obter dados do usuário.")
  }

  return userWithWorkspace
}

async function requireFormOwner(formId: string) {
  const user = await requireUser()
  const { data: form, success } = await getFormById(formId)
  if (!success || !form) throw new Error("Formulário não encontrado.")
  if (form.createdById !== user.id) throw new Error("Acesso negado.")
  return { user, form }
}

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
      columns: { formQuota: true },
    }),
    db.select({ total: drizzleSql<number>`count(*)::int` }).from(forms).where(
      and(eq(forms.createdById, user.id), eq(forms.status, "published"))
    ),
  ])

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
 * Updates form metadata (title, description, slug, settings, theme).
 */
export async function updateFormAction(formId: string, input: UpdateFormInput) {
  await requireFormOwner(formId)
  const result = await updateForm(formId, input)
  if (!result.success) throw new Error("Falha ao salvar formulário.")
  revalidatePath("/dashboard")
  revalidatePath(`/builder/${formId}`)
  return result.data
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

/**
 * Batch upsert questions from the builder (auto-save).
 * Does NOT revalidate the builder path to avoid resetting client state.
 */
export async function upsertQuestionsAction(
  formId: string,
  questionList: UpsertQuestionInput[]
) {
  await requireFormOwner(formId)
  if (questionList.length === 0) return
  const result = await upsertQuestions(formId, questionList)
  if (!result.success) throw new Error("Falha ao salvar perguntas.")
}
