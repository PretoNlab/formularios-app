import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { forms } from "@/lib/db/schema"
import { createResponse } from "@/lib/db/queries/responses"
import { hashIp } from "@/lib/submit-response-core"
import type { FormSettings } from "@/lib/db/schema"

const startBodySchema = z.object({
  formId: z.string().uuid(),
  clientMeta: z
    .object({
      utmSource: z.string().max(200).optional(),
      utmMedium: z.string().max(200).optional(),
      utmCampaign: z.string().max(200).optional(),
      referrer: z.string().max(500).optional(),
      deviceType: z.enum(["desktop", "mobile", "tablet"]).optional(),
    })
    .optional(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 })
  }

  const parsed = startBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
  }

  const { formId, clientMeta = {} } = parsed.data

  const form = await db.query.forms.findFirst({
    where: eq(forms.id, formId),
    columns: { id: true, status: true, settings: true },
  })

  if (!form || form.status !== "published") {
    return NextResponse.json({ error: "Formulário não encontrado." }, { status: 404 })
  }

  const settings = form.settings as FormSettings
  if (!settings.allowPartialResponses) {
    return NextResponse.json({ error: "Respostas parciais não habilitadas." }, { status: 403 })
  }

  const rawIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"

  const result = await createResponse(formId, {
    userAgent: req.headers.get("user-agent"),
    ipHash: hashIp(rawIp),
    utmSource: clientMeta.utmSource ?? null,
    utmMedium: clientMeta.utmMedium ?? null,
    utmCampaign: clientMeta.utmCampaign ?? null,
    referrer: clientMeta.referrer ?? null,
    deviceType: clientMeta.deviceType ?? null,
  })

  if (!result.success || !result.data) {
    return NextResponse.json({ error: "Falha ao iniciar sessão." }, { status: 500 })
  }

  return NextResponse.json({ responseId: result.data.id })
}
