"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import { draftSchema, DRAFT_COOKIE, DRAFT_MAX_AGE } from "@/lib/onboarding/draft"
import { persistSignupForm } from "@/lib/db/queries/onboarding"
import { revalidatePath } from "next/cache"

export async function prepareSignupDraftAction(input: unknown) {
  const draft = draftSchema.parse(input)
  const jar = await cookies()
  jar.set(DRAFT_COOKIE, JSON.stringify(draft), {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: DRAFT_MAX_AGE,
  })
}

export async function completeSignupDraftAction(): Promise<{ formId?: string; creditBalance?: number; error?: string; requiresLogin?: boolean }> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return { error: "Sua sessão expirou. Entre novamente para recuperar seu formulário.", requiresLogin: true }
    // Email signup metadata survives confirmation on a different browser.
    // OAuth uses the HttpOnly cookie written before leaving this origin.
    let input: unknown = authUser.user_metadata?.signup_draft
    if (!draftSchema.safeParse(input).success) {
      const value = (await cookies()).get(DRAFT_COOKIE)?.value
      try { input = value ? JSON.parse(value) : null } catch { input = null }
    }
    const result = draftSchema.safeParse(input)
    if (!result.success) return { error: "Não encontramos seu rascunho. Você pode começar um formulário no painel." }
    const provisioned = await ensureUserExists({
      id: authUser.id,
      email: authUser.email,
      user_metadata: { ...authUser.user_metadata, signup_draft: result.data },
    })
    if (!provisioned.success || !provisioned.data?.defaultWorkspace) throw new Error("Account provisioning failed")
    const user = provisioned.data
    const formId = await persistSignupForm(user.id, user.defaultWorkspace.id, result.data)
    revalidatePath("/dashboard")
    // Keep draft references for retries/back navigation; persistence is idempotent.
    return { formId, creditBalance: user.creditBalance }
  } catch {
    return { error: "Não conseguimos concluir a preparação da sua conta e do formulário. Tente novamente; não é necessário criar outra conta." }
  }
}
