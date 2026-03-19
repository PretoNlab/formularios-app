"use server"

import Anthropic from "@anthropic-ai/sdk"
import { redirect } from "next/navigation"
import { eq, and } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { questions, answers, responses, forms } from "@/lib/db/schema"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import { getFormAnalytics } from "@/lib/db/queries/responses"

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

// ─── Auth helpers ─────────────────────────────────────────────────────────────

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: userWithWorkspace, success } = await ensureUserExists({
    id: user.id,
    email: user.email!,
    user_metadata: user.user_metadata,
  })

  if (!success || !userWithWorkspace) {
    throw new Error("Falha ao obter dados do usuário.")
  }

  return userWithWorkspace
}

// ─── Action ───────────────────────────────────────────────────────────────────

export async function analyzeTextResponsesAction(
  formId: string,
  questionId: string
): Promise<{ success: true; data: TextAnalysisResult } | { success: false; error: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { success: false, error: "ANTHROPIC_API_KEY não configurada." }
  }

  // 0. Auth + ownership check
  const user = await requireUser()
  const form = await db.query.forms.findFirst({
    where: eq(forms.id, formId),
    columns: { id: true, createdById: true },
  })
  if (!form) return { success: false, error: "Formulário não encontrado." }
  if (form.createdById !== user.id) return { success: false, error: "Acesso negado." }

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

// ─── Form Report ──────────────────────────────────────────────────────────────

export interface FormReportResult {
  score: number                  // 0–100, nota geral do formulário
  summary: string                // 2–3 frases de diagnóstico
  highlights: {
    type: "positive" | "negative" | "neutral"
    text: string
  }[]
  recommendations: {
    title: string
    description: string
    priority: "high" | "medium" | "low"
  }[]
}

export async function generateFormReportAction(
  formId: string,
): Promise<{ success: true; data: FormReportResult } | { success: false; error: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { success: false, error: "ANTHROPIC_API_KEY não configurada." }
  }

  // 0. Auth + ownership check
  const user = await requireUser()

  // 1. Fetch form server-side (title + questions)
  const form = await db.query.forms.findFirst({
    where: eq(forms.id, formId),
    columns: { title: true, createdById: true },
    with: { questions: { columns: { title: true, type: true, order: true }, orderBy: (q, { asc }) => [asc(q.order)] } },
  })

  if (!form) return { success: false, error: "Formulário não encontrado." }
  if (form.createdById !== user.id) return { success: false, error: "Acesso negado." }

  // 2. Fetch analytics server-side (never trust client-supplied data for AI prompts)
  const analyticsResult = await getFormAnalytics(formId)
  if (!analyticsResult.success || !analyticsResult.data) {
    return { success: false, error: "Não foi possível carregar os dados de analytics." }
  }
  const analytics = analyticsResult.data

  if (analytics.totalResponses < 3) {
    return { success: false, error: "São necessárias pelo menos 3 respostas para gerar o relatório." }
  }

  // 3. Build question stats summary for the prompt
  const questionSummary = form.questions
    .filter((q) => !["welcome", "statement", "thank_you"].includes(q.type))
    .map((q, i) => {
      const stat = analytics.questionStats.find((s) => s.questionTitle === q.title)
      if (!stat) return `${i + 1}. "${q.title}" (${q.type})`
      const parts: string[] = [`${i + 1}. "${q.title}" (${q.type}) — ${stat.totalAnswers} respostas`]
      if (stat.skipRate > 0.1) parts.push(`${Math.round(stat.skipRate * 100)}% pularam`)
      if (stat.npsScore !== undefined) parts.push(`NPS: ${stat.npsScore} (${stat.npsPromoters}% promotores, ${stat.npsDetractors}% detratores)`)
      if (stat.average !== undefined) parts.push(`média: ${stat.average} (min ${stat.min}, max ${stat.max})`)
      if (stat.optionCounts?.length) {
        const top = stat.optionCounts.slice(0, 3).map((o) => `"${o.option}" ${Math.round(o.percentage * 100)}%`).join(", ")
        parts.push(`top opções: ${top}`)
      }
      return parts.join(" | ")
    })
    .join("\n")

  const worstDropoff = [...analytics.dropoffByQuestion]
    .sort((a, b) => b.dropoffRate - a.dropoffRate)[0]

  const topSource = analytics.sourceBreakdown[0]
  const mobileStr = analytics.mobilePercentage > 0
    ? `${Math.round(analytics.mobilePercentage * 100)}% dos respondentes são mobile`
    : null

  const prompt = `Você é um especialista em UX de formulários e análise de dados. Analise os dados abaixo de um formulário e gere um relatório diagnóstico em português brasileiro.

FORMULÁRIO: "${form.title}"

MÉTRICAS GERAIS:
- Total de respostas: ${analytics.totalResponses}
- Taxa de conclusão: ${Math.round(analytics.completionRate * 100)}%
- Tempo médio de conclusão: ${analytics.averageCompletionTime > 0 ? `${analytics.averageCompletionTime}s` : "não disponível"}
${mobileStr ? `- ${mobileStr}` : ""}
${topSource ? `- Principal origem de tráfego: ${topSource.source} (${Math.round(topSource.percentage * 100)}%)` : ""}
${worstDropoff ? `- Maior abandono: pergunta com ${Math.round(worstDropoff.dropoffRate * 100)}% de desistência` : ""}

PERGUNTAS E RESPOSTAS:
${questionSummary}

Retorne APENAS um JSON com este formato exato (sem markdown):
{
  "score": número de 0 a 100 representando a saúde geral do formulário,
  "summary": "2-3 frases diretas de diagnóstico sobre o formulário e seus resultados",
  "highlights": [
    { "type": "positive", "text": "ponto positivo observado nos dados" },
    { "type": "negative", "text": "ponto de atenção observado nos dados" }
  ],
  "recommendations": [
    {
      "title": "Título curto da recomendação (máx 50 chars)",
      "description": "Explicação prática e acionável em 1-2 frases",
      "priority": "high"
    }
  ]
}

Regras:
- score: 90-100 excelente, 70-89 bom, 50-69 regular, abaixo de 50 precisa melhorar
- highlights: 3 a 5 itens, misturando positivos e negativos baseados nos dados reais
- recommendations: exatamente 3, ordenadas por prioridade (high > medium > low)
- Seja específico e use os números dos dados — evite generalidades
- Responda APENAS com o JSON`

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : ""
    const jsonStr = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim()
    const parsed = JSON.parse(jsonStr) as FormReportResult

    return { success: true, data: parsed }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao gerar relatório.",
    }
  }
}
