import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * POST /api/auth/login
 *
 * Handles email+password login as a true HTTP form POST.
 * By using a Route Handler (not a Server Action), we have full control over
 * the response object and can explicitly set session cookies on the redirect —
 * the same pattern used in /auth/callback for OAuth.
 *
 * Server Actions called from Client Components go through React's internal
 * fetch mechanism, which may not propagate Set-Cookie headers from redirects
 * to the browser's cookie jar correctly.
 */
export async function POST(request: NextRequest) {
  const { origin } = new URL(request.url)

  const formData = await request.formData()
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const next = (formData.get("next") as string) || "/dashboard"

  const cookieStore = await cookies()

  // Capture cookies that Supabase wants to set (same as /auth/callback pattern)
  const newCookies: Array<{
    name: string
    value: string
    options: Parameters<typeof cookieStore.set>[2]
  }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            newCookies.push({ name, value, options })
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const msg =
      error.message === "Invalid login credentials"
        ? "E-mail ou senha incorretos."
        : error.message
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(msg)}&next=${encodeURIComponent(next)}`,
      { status: 303 }
    )
  }

  // Build redirect and attach session cookies to it
  const redirectResponse = NextResponse.redirect(`${origin}${next}`, {
    status: 303,
  })
  newCookies.forEach(({ name, value, options }) => {
    redirectResponse.cookies.set(name, value, options)
  })
  return redirectResponse
}
