import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { eq, and, isNull } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { responses, questions } from "@/lib/db/schema"
import { saveAnswers } from "@/lib/db/queries/responses"
import { answerValueSchema } from "@/lib/submit-response-core"

const progressBodySchema = z.object({
  responseId: z.string().uuid(),
  questionId: z.string().uuid(),
  value: answerValueSchema,
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 })
  }

  const parsed = progressBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
  }

  const { responseId, questionId, value } = parsed.data

  // Validate: response exists, not already completed, question belongs to same form
  const response = await db.query.responses.findFirst({
    where: and(eq(responses.id, responseId), isNull(responses.completedAt)),
    columns: { id: true, formId: true },
  })

  if (!response) {
    return NextResponse.json({ error: "Sessão inválida ou já concluída." }, { status: 404 })
  }

  const question = await db.query.questions.findFirst({
    where: and(eq(questions.id, questionId), eq(questions.formId, response.formId)),
    columns: { id: true },
  })

  if (!question) {
    return NextResponse.json({ error: "Questão não pertence ao formulário." }, { status: 400 })
  }

  const result = await saveAnswers(responseId, [{ questionId, value }])

  if (!result.success) {
    return NextResponse.json({ error: "Falha ao salvar resposta." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
