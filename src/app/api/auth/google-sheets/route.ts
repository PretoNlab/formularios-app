import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getAuthUrl } from "@/lib/google-sheets"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL("/login", req.url))

  const formId = req.nextUrl.searchParams.get("formId")
  if (!formId) return NextResponse.json({ error: "formId is required" }, { status: 400 })

  const token = randomBytes(16).toString("hex")
  const state = `${formId}:${token}`

  const cookieStore = await cookies()
  cookieStore.set("gs_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  })

  return NextResponse.redirect(getAuthUrl(state))
}
