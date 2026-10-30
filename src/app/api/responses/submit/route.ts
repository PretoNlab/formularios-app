import { NextRequest, NextResponse } from "next/server"
import { submitResponseCore, submitBodySchema, hashIp } from "@/lib/submit-response-core"
import { getClientIp } from "@/lib/utils/ip"
import type { AnswerValue } from "@/lib/db/schema"

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 })
  }

  const parsed = submitBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados de envio inválidos." }, { status: 400 })
  }

  const userAgent = req.headers.get("user-agent")
  const rawIp = getClientIp(req.headers)

  try {
    await submitResponseCore({
      formId: parsed.data.formId,
      answers: parsed.data.answers as Record<string, AnswerValue>,
      clientMeta: parsed.data.clientMeta,
      ipHash: hashIp(rawIp),
      userAgent,
      responseId: parsed.data.responseId,
      honeypot: parsed.data.honeypot,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao enviar resposta."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
