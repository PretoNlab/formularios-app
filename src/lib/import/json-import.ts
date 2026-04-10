import { z } from "zod"
import { QUESTION_TYPES, type QuestionProperties, type QuestionType } from "@/lib/types/form"
import type { ImportResult } from "./types"

const questionTypeKeys = Object.keys(QUESTION_TYPES) as [string, ...string[]]

const importQuestionSchema = z.object({
  type: z.enum(questionTypeKeys),
  title: z.string().min(1, "Título da pergunta é obrigatório"),
  description: z.string().optional(),
  required: z.boolean().default(false),
  properties: z.record(z.string(), z.unknown()).default({}) as unknown as z.ZodType<QuestionProperties>,
})

const importFormSchema = z.object({
  title: z.string().min(1, "Título do formulário é obrigatório"),
  description: z.string().optional(),
  questions: z
    .array(importQuestionSchema)
    .min(1, "O formulário precisa ter pelo menos 1 pergunta")
    .max(200, "Máximo de 200 perguntas por formulário"),
})

export function parseJsonImport(jsonString: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    throw new Error("JSON inválido. Verifique a formatação e tente novamente.")
  }

  const result = importFormSchema.safeParse(parsed)
  if (!result.success) {
    const messages = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n")
    throw new Error(`Erros de validação:\n${messages}`)
  }

  const { title, description, questions } = result.data

  return {
    title,
    description,
    questions: questions.map((q, i) => ({
      type: q.type as QuestionType,
      title: q.title,
      description: q.description,
      required: q.required,
      order: i,
      properties: q.properties,
    })),
    warnings: [],
  }
}
