import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { ensureUserExists } from "@/lib/db/queries/users"

/**
 * Handles the Supabase Auth callback after OAuth or magic link sign-in.
 * Exchanges the code for a session, ensures the user exists in our DB,
 * then redirects to the dashboard (or the `next` param if provided).
 *
 * NOTE: We create the Supabase client inline here (not via createClient())
 * so we can capture the session cookies and apply them to the redirect
 * response. If we used createClient() and returned NextResponse.redirect(),
 * the cookies would be set on the implicit response but lost on the new
 * redirect response — causing the middleware to see no session.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const rawNext = searchParams.get("next") ?? "/dashboard"
  const next = rawNext.startsWith("/") ? rawNext : "/dashboard"

  if (code) {
    const cookieStore = await cookies()

    // Collect cookies that Supabase wants to set
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
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              newCookies.push({ name, value, options })
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Provision user + workspace in our DB on first login
      const { data: dbUser } = await ensureUserExists({
        id: data.user.id,
        email: data.user.email!,
        user_metadata: data.user.user_metadata,
      })

      // Build redirect and attach session cookies to it
      let finalNext = next
      if (dbUser?.isNewUser) {
        finalNext = finalNext.includes("?") ? `${finalNext}&welcome=true` : `${finalNext}?welcome=true`
      }

      const redirectResponse = NextResponse.redirect(`${origin}${finalNext}`)
      newCookies.forEach(({ name, value, options }) => {
        redirectResponse.cookies.set(name, value, options)
      })
      return redirectResponse
    }
  }

  // Auth failed — redirect to login with error flag
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
