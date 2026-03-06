"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import {
  createForm,
  deleteForm,
  getFormById,
  publishForm,
  updateForm,
  type UpdateFormInput,
} from "@/lib/db/queries/forms"
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
 */
export async function publishFormAction(formId: string) {
  await requireFormOwner(formId)
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
 * Batch upsert questions from the builder (auto-save).
 * Does NOT revalidate the builder path to avoid resetting client state.
 */
export async function upsertQuestionsAction(
  formId: string,
  questionList: UpsertQuestionInput[]
) {
  await requireFormOwner(formId)
  const result = await upsertQuestions(formId, questionList)
  if (!result.success) throw new Error("Falha ao salvar perguntas.")
}
