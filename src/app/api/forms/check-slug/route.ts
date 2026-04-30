import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db/client"
import { forms } from "@/lib/db/schema"
import { eq, and, ne } from "drizzle-orm"

/**
 * GET /api/forms/check-slug?slug=meu-slug&formId=xyz
 * Checks whether a slug is available (not used by another form).
 * Requires authentication.
 */
export async function GET(req: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const slug = searchParams.get("slug")?.trim()
  const formId = searchParams.get("formId")?.trim()

  // Basic validation
  if (!slug || slug.length < 3) {
    return NextResponse.json({ available: false, reason: "too_short" })
  }
  if (slug.length > 60) {
    return NextResponse.json({ available: false, reason: "too_long" })
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ available: false, reason: "invalid_chars" })
  }

  try {
    // Build the where clause — exclude the current form if formId is provided
    const whereClause = formId
      ? and(eq(forms.slug, slug), ne(forms.id, formId))
      : eq(forms.slug, slug)

    const existing = await db
      .select({ id: forms.id })
      .from(forms)
      .where(whereClause)
      .limit(1)

    return NextResponse.json({ available: existing.length === 0 })
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }
}
