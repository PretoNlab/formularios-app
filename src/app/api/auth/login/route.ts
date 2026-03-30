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

// In-memory rate limiter (per serverless instance).
// Provides meaningful protection on warm instances; cold starts reset counts.
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function isLoginRateLimited(ip: string): boolean {
  const now = Date.now()
  const rec = loginAttempts.get(ip)
  if (!rec || rec.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  rec.count++
  return rec.count > RATE_LIMIT_MAX
}

export async function POST(request: NextRequest) {
  const { origin } = new URL(request.url)

  // Rate limiting by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (isLoginRateLimited(ip)) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Muitas tentativas. Aguarde 15 minutos.")}`,
      { status: 303 }
    )
  }

  const formData = await request.formData()
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // Validate next param — only allow same-origin relative paths (not //)
  const rawNext = (formData.get("next") as string) || "/dashboard"
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/dashboard"

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
    // Normalize all auth errors to a single message to prevent email enumeration
    const msg = "E-mail ou senha incorretos."
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
