"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"
import { isSafeNextPath } from "@/lib/utils/safe-url"
import { draftSchema } from "@/lib/onboarding/draft"
import { prepareSignupDraftAction } from "@/app/actions/onboarding"

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const rawNext = (formData.get("next") as string) || "/dashboard"
  const next = isSafeNextPath(rawNext) ? rawNext : "/dashboard"

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const msg =
      error.message === "Invalid login credentials"
        ? "E-mail ou senha incorretos."
        : error.message
    redirect(`/login?error=${encodeURIComponent(msg)}&next=${encodeURIComponent(next)}`)
  }

  redirect(next)
}

export async function signupAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const name = (formData.get("name") as string)?.trim() || ""
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const password = formData.get("password") as string
  const plan = formData.get("plan") as string | null

  let signupDraft
  const rawDraft = formData.get("signupDraft")
  if (typeof rawDraft === "string" && rawDraft) {
    try { signupDraft = draftSchema.parse(JSON.parse(rawDraft)) }
    catch { return { success: false, error: "Seu rascunho não é válido. Volte e revise suas escolhas." } }
  }
  if (!password || password.length < 8 || !name || name.length > 100 || !email || email.length > 254) {
    return { success: false, error: "Preencha seu nome, e-mail e uma senha de pelo menos 8 caracteres." }
  }
  if (signupDraft) await prepareSignupDraftAction(signupDraft)
  const signupNext = signupDraft ? "/onboarding/complete" : plan === "founder" ? "/billing" : "/dashboard?welcome=true"
  const userMetadata = { full_name: name, ...(signupDraft ? { signup_draft: signupDraft } : {}) }

  if (!email || !password) {
    return { success: false, error: "E-mail e senha são obrigatórios." }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabase = await createClient()

  // 1. Instant access via Supabase Admin (auto-confirm email)
  if (serviceKey) {
    const admin = createSupabaseAdminClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { error: adminError } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: userMetadata,
      email_confirm: true,
    })

    if (adminError) {
      if (
        adminError.message.toLowerCase().includes("already registered") ||
        adminError.message.toLowerCase().includes("already been registered")
      ) {
        return { success: false, error: "Este e-mail já está cadastrado. Faça login para entrar." }
      }
      return { success: false, error: adminError.message }
    }

    // Sign in to establish browser session cookies
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      return { success: false, error: signInError.message }
    }

    // The destination provisions the workspace; onboarding can retry without recreating Auth.
    redirect(signupNext)
  }

  // 2. Standard Fallback
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userMetadata,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback?next=${encodeURIComponent(signupNext)}`,
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // If confirm email was disabled on Supabase, sign in immediately
  const { data: sessionData } = await supabase.auth.signInWithPassword({ email, password })
  if (sessionData?.session) {
    redirect(signupNext)
  }

  return { success: true }
}

