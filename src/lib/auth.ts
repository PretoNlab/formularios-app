import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import { getFormById } from "@/lib/db/queries/forms"

export async function requireUser() {
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

export async function requireFormOwner(formId: string) {
  const user = await requireUser()
  const { data: form, success } = await getFormById(formId)
  if (!success || !form) throw new Error("Formulário não encontrado.")
  if (form.createdById !== user.id) throw new Error("Acesso negado.")
  return { user, form }
}
