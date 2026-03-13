"use server"

import Anthropic from "@anthropic-ai/sdk"
import { eq, and, inArray } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { questions, answers, responses } from "@/lib/db/schema"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TextAnalysisResult {
  questionId: string
  questionTitle: string
  totalAnswers: number
  themes: {
    label: string
    count: number
    percentage: number
    examples: string[]
  }[]
  sentiment: {
    positive: number
    neutral: number
    negative: number
  }
  keywords: string[]
  summary: string
}

// ─── Action ───────────────────────────────────────────────────────────────────

export async function analyzeTextResponsesAction(
  formId: string,
  questionId: string
): Promise<{ success: true; data: TextAnalysisResult } | { success: false; error: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { success: false, error: "ANTHROPIC_API_KEY não configurada." }
  }

  // 1. Fetch question metadata
  const question = await db.query.questions.findFirst({
    where: and(eq(questions.id, questionId), eq(questions.formId, formId)),
    columns: { id: true, title: true, type: true },
  })

  if (!question) return { success: false, error: "Pergunta não encontrada." }

  const TEXT_TYPES = new Set(["short_text", "long_text", "email", "url", "phone", "whatsapp", "cpf", "cnpj"])
  if (!TEXT_TYPES.has(question.type)) {
    return { success: false, error: "Análise disponível apenas para perguntas de texto." }
  }

  // 2. Fetch all text answers for this question
  const rows = await db
    .select({ value: answers.value })
    .from(answers)
    .innerJoin(responses, eq(answers.responseId, responses.id))
    .where(and(eq(responses.formId, formId), eq(answers.questionId, questionId)))

  const texts = rows
    .map((r) => (typeof r.value === "string" ? r.value.trim() : null))
    .filter((v): v is string => v !== null && v.length > 0)

  if (texts.length === 0) {
    return { success: false, error: "Nenhuma resposta de texto disponível para análise." }
  }

  // 3. Cap at 200 responses to keep prompt size manageable
  const sample = texts.length > 200 ? texts.slice(-200) : texts

  // 4. Call Claude
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `Você é um analista de pesquisas especializado em analisar respostas abertas de formulários.

Pergunta do formulário: "${question.title}"

Respostas coletadas (${sample.length} respostas):
${sample.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Analise essas respostas e retorne um JSON com EXATAMENTE este formato (sem markdown, sem texto extra):
{
  "themes": [
    {
      "label": "Nome do tema (máx 40 chars)",
      "count": número de respostas neste tema,
      "percentage": percentual como decimal (ex: 0.35),
      "examples": ["exemplo 1", "exemplo 2"]
    }
  ],
  "sentiment": {
    "positive": percentual decimal,
    "neutral": percentual decimal,
    "negative": percentual decimal
  },
  "keywords": ["palavra1", "palavra2", "palavra3", "palavra4", "palavra5"],
  "summary": "Resumo de 1-2 frases sobre o que os respondentes pensam/dizem sobre este tema."
}

Regras:
- Identifique de 2 a 5 temas principais
- Os percentuais de sentiment devem somar 1.0
- keywords: máximo 8, ordenadas por frequência
- Responda APENAS com o JSON, sem formatação adicional`

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : ""

    // Strip markdown code blocks if present
    const jsonStr = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim()
    const parsed = JSON.parse(jsonStr) as {
      themes: { label: string; count: number; percentage: number; examples: string[] }[]
      sentiment: { positive: number; neutral: number; negative: number }
      keywords: string[]
      summary: string
    }

    return {
      success: true,
      data: {
        questionId,
        questionTitle: question.title,
        totalAnswers: texts.length,
        themes: parsed.themes,
        sentiment: parsed.sentiment,
        keywords: parsed.keywords,
        summary: parsed.summary,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro na análise com IA.",
    }
  }
}
