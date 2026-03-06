"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import { getFormById } from "@/lib/db/queries/forms"
import {
  createIntegration,
  updateIntegration,
  deleteIntegration,
  getIntegrationsByForm,
} from "@/lib/db/queries/integrations"

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado.")

  const { data, success } = await ensureUserExists({
    id: user.id,
    email: user.email!,
    user_metadata: user.user_metadata,
  })
  if (!success || !data) throw new Error("Usuário não encontrado.")
  return data
}

async function requireFormOwner(formId: string) {
  const user = await requireUser()
  const { data: form, success } = await getFormById(formId)
  if (!success || !form) throw new Error("Formulário não encontrado.")
  if (form.createdById !== user.id) throw new Error("Acesso negado.")
  return user
}

export async function createWebhookAction(
  formId: string,
  name: string,
  url: string
) {
  await requireFormOwner(formId)
  const result = await createIntegration({
    formId,
    type: "webhook",
    name,
    enabled: true,
    config: { url },
  })
  if (!result.success) throw new Error("Falha ao criar webhook.")
  revalidatePath(`/builder/${formId}`)
  return result.data
}

export async function toggleIntegrationAction(id: string, enabled: boolean, formId: string) {
  await requireFormOwner(formId)
  await updateIntegration(id, { enabled })
  revalidatePath(`/builder/${formId}`)
}

export async function deleteIntegrationAction(id: string, formId: string) {
  await requireFormOwner(formId)
  await deleteIntegration(id)
  revalidatePath(`/builder/${formId}`)
}

export async function getFormIntegrationsAction(formId: string) {
  await requireFormOwner(formId)
  const result = await getIntegrationsByForm(formId)
  if (!result.success) return []
  return result.data ?? []
}
