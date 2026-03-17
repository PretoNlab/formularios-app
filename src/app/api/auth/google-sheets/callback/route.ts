import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { exchangeCode } from "@/lib/google-sheets"
import { createIntegration, getIntegrationsByForm, deleteIntegration } from "@/lib/db/queries/integrations"
import { getFormById } from "@/lib/db/queries/forms"
import { ensureUserExists } from "@/lib/db/queries/users"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL("/login", req.url))

  const code = req.nextUrl.searchParams.get("code")
  const state = req.nextUrl.searchParams.get("state")

  if (!code || !state) {
    return NextResponse.redirect(new URL("/dashboard?error=oauth_failed", req.url))
  }

  // Validate CSRF state
  const cookieStore = await cookies()
  const storedState = cookieStore.get("gs_oauth_state")?.value
  if (storedState !== state) {
    return NextResponse.redirect(new URL("/dashboard?error=oauth_state_mismatch", req.url))
  }
  cookieStore.delete("gs_oauth_state")

  const [formId] = state.split(":")
  if (!formId) {
    return NextResponse.redirect(new URL("/dashboard?error=oauth_failed", req.url))
  }

  // Verify the authenticated user owns this form
  const { data: dbUser } = await ensureUserExists({
    id: user.id,
    email: user.email!,
    user_metadata: user.user_metadata,
  })
  const { data: form } = await getFormById(formId)
  if (!dbUser || !form || form.createdById !== dbUser.id) {
    return NextResponse.redirect(new URL("/dashboard?error=oauth_failed", req.url))
  }

  try {
    const { accessToken, refreshToken, tokenExpiry } = await exchangeCode(code)

    // Remove any existing google_sheets integration (reconnect flow)
    const { data: existing } = await getIntegrationsByForm(formId, "google_sheets")
    for (const integration of existing ?? []) {
      await deleteIntegration(integration.id)
    }

    await createIntegration({
      formId,
      type: "google_sheets",
      name: "Google Sheets",
      enabled: false, // becomes true after user configures spreadsheet + tab
      config: { accessToken, refreshToken, tokenExpiry },
    })

    return NextResponse.redirect(new URL(`/builder/${formId}?sheets=connected`, req.url))
  } catch (error) {
    console.error("Google Sheets OAuth callback error:", error)
    return NextResponse.redirect(new URL(`/builder/${formId}?sheets=error`, req.url))
  }
}
