"use server"

import { randomUUID } from "crypto"
import { db } from "@/lib/db/client"
import { answers, responses } from "@/lib/db/schema"
import { eq, and, inArray, sql } from "drizzle-orm"
import { requireUser, requireFormOwner } from "@/lib/auth"
import { getGeminiModel } from "@/lib/ai/google-ai"
import { AnalyticsPeriod, QuestionType } from "@/lib/types/form"
import { createForm } from "@/lib/db/queries/forms"
import { upsertQuestions, UpsertQuestionInput } from "@/lib/db/queries/questions"
import { revalidatePath } from "next/cache"

const PERIOD_DAYS: Record<Exclude<AnalyticsPeriod, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
}

export async function getSemanticInsightsAction(
  formId: string,
  questionId: string,
  period: AnalyticsPeriod = "30d"
) {
  try {
    await requireFormOwner(formId)

    // ... (rest of the existing getSemanticInsightsAction logic)
    const days = period === "all" ? null : PERIOD_DAYS[period]
    const periodFilter = days 
      ? sql`${responses.startedAt} >= now() - make_interval(days => ${days})`
      : null

    const rawAnswers = await db
      .select({ value: answers.value })
      .from(answers)
      .innerJoin(responses, eq(answers.responseId, responses.id))
      .where(
        and(
          eq(responses.formId, formId),
          eq(answers.questionId, questionId),
          periodFilter ? periodFilter : undefined
        )
      )

    const textList = rawAnswers
      .map(a => typeof a.value === 'string' ? a.value : JSON.stringify(a.value))
      .filter(t => t.trim().length > 0)

    if (textList.length < 3) {
      return { 
        success: false, 
        error: { code: "INSUFFICIENT_DATA", message: "Necessário pelo menos 3 respostas para gerar insights." } 
      }
    }

    const model = getGeminiModel("gemini-1.5-flash")
    
    const prompt = `
      Você é um analista de dados especialista em pesquisas e formulários.
      Analise as seguintes respostas textuais para uma única pergunta de um formulário.
      
      Respostas:
      ${textList.map((t, i) => `${i+1}. ${t}`).join('\n')}
      
      Seu objetivo é extrair inteligência qualitativa dessas respostas.
      Retorne APENAS um objeto JSON válido (sem markdown, sem blocos de código \`\`\`) com o seguinte formato:
      {
        "summary": "Um parágrafo curto resumindo o sentimento geral e principais pontos.",
        "sentiment": "positive" | "neutral" | "negative",
        "themes": [
          { "theme": "Nome do Tema", "count": 10, "sentiment": "positive" | "neutral" | "negative" }
        ],
        "topQuotes": ["Uma ou duas frases curtas que representam bem o grupo"]
      }
      
      Instruções:
      - "themes" deve ter no máximo 5 itens.
      - Responda em Português (PT-BR).
      - Seja objetivo e profissional.
    `

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
    const insights = JSON.parse(cleanJson)

    return { success: true, data: insights }
  } catch (error) {
    console.error("[getSemanticInsightsAction] Error:", error)
    return {
      success: false,
      error: { code: "AI_ERROR", message: "Falha ao processar insights com IA." }
    }
  }
}

/**
 * Generates a form structure from a text prompt using AI.
 */
export async function generateFormFromTextAction(promptText: string) {
  const user = await requireUser()
  
  if (!promptText || promptText.trim().length < 5) {
    throw new Error("O prompt deve ser mais descritivo.")
  }

  try {
    const model = getGeminiModel("gemini-1.5-flash")
    
    const systemPrompt = `
      Você é um especialista em UX e design de formulários.
      Sua tarefa é converter o desejo do usuário em um formulário estruturado em JSON.
      
      Instrução do Usuário: "${promptText}"
      
      Retorne APENAS um objeto JSON válido (sem markdown, sem blocos de código \`\`\`) com o seguinte formato:
      {
        "title": "Título estratégico do formulário",
        "description": "Uma breve descrição amigável",
        "questions": [
          {
            "type": "short_text" | "long_text" | "multiple_choice" | "checkbox" | "dropdown" | "rating" | "nps" | "yes_no",
            "title": "Texto da pergunta",
            "required": boolean,
            "options": ["Opção 1", "Opção 2"] (somente se type for multiple_choice, checkbox ou dropdown)
          }
        ]
      }
      
      Regras:
      - Crie no máximo 10 perguntas.
      - Use uma mistura inteligente de tipos de perguntas.
      - Responda sempre em Português (PT-BR).
    `

    const result = await model.generateContent(systemPrompt)
    const responseText = result.response.text()
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
    const formStructure = JSON.parse(cleanJson) as {
      title: string
      description: string
      questions: Array<{
        type: string
        title: string
        required: boolean
        options?: string[]
      }>
    }

    // 1. Create the form
    const formResult = await createForm({
      workspaceId: user.defaultWorkspace.id,
      createdById: user.id,
      title: formStructure.title || "Novo Formulário IA",
      description: formStructure.description
    })

    if (!formResult.success || !formResult.data) {
      throw new Error("Falha ao criar formulário.")
    }

    const formId = formResult.data.id

    // 2. Prepare and upsert questions
    const upsertInput: UpsertQuestionInput[] = formStructure.questions.map((q, i) => ({
      id: randomUUID(),
      formId,
      type: q.type as QuestionType,
      title: q.title,
      required: q.required ?? false,
      order: i,
      properties: q.options ? {
        options: q.options.map(opt => ({
          id: randomUUID(),
          label: opt
        }))
      } : {},
      logicRules: [],
    }))

    const upsertResult = await upsertQuestions(formId, upsertInput)
    if (!upsertResult.success) {
      throw new Error(`Falha ao salvar perguntas: ${upsertResult.error?.message}`)
    }

    revalidatePath("/dashboard")
    return { success: true, data: { formId } }

  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    console.error("[generateFormFromTextAction] Error:", message)
    return {
      success: false,
      error: { code: "AI_GENERATION_ERROR", message }
    }
  }
}
