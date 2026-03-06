"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const next = (formData.get("next") as string) || "/dashboard"

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
