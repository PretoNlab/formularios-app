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
import { deductUserCredits } from "@/lib/db/queries/users"
import { AI_CREDIT_COSTS } from "@/lib/credits"
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
    const { user } = await requireFormOwner(formId)

    if (user.creditBalance < AI_CREDIT_COSTS.SEMANTIC_INSIGHTS) {
      return {
        success: false,
        error: {
          code: "INSUFFICIENT_CREDITS",
          message: `Você precisa de ${AI_CREDIT_COSTS.SEMANTIC_INSIGHTS} créditos para gerar insights com IA (seu saldo: ${user.creditBalance}).`,
        },
      }
    }

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

    const model = getGeminiModel("gemini-2.5-flash")
    
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

    // Deduct credits after successful AI generation
    const deduction = await deductUserCredits(
      user.id,
      AI_CREDIT_COSTS.SEMANTIC_INSIGHTS,
      "ai_semantic_insights",
      { formId, questionId }
    )

    if (!deduction.success) {
      return {
        success: false,
        error: {
          code: "INSUFFICIENT_CREDITS",
          message: deduction.error?.message || "Créditos insuficientes.",
        },
      }
    }

    revalidatePath(`/responses/${formId}`)

    return {
      success: true,
      data: insights,
      remainingCredits: deduction.newBalance,
    }
  } catch (error) {
    console.error("[getSemanticInsightsAction] Error:", error)
    return {
      success: false,
      error: { code: "AI_ERROR", message: error instanceof Error ? error.message : "Falha ao processar insights com IA." }
    }
  }
}

/**
 * Data structures for AI Form Generation & Draft Studio
 */
export interface AiQuestionDraft {
  tempId: string
  type: QuestionType
  title: string
  description?: string
  required: boolean
  options?: string[]
  logicJumpToTempId?: string // Jump to another question tempId if applicable
  logicConditionValue?: string // e.g. if answer matches this option
}

export interface AiFormDraft {
  title: string
  description?: string
  targetAudience?: string
  tone?: string
  estimatedTimeMinutes: number
  conversionTips: string[]
  questions: AiQuestionDraft[]
}

const SUPPORTED_AI_QUESTION_TYPES = [
  "short_text",
  "long_text",
  "email",
  "phone",
  "whatsapp",
  "cpf",
  "cnpj",
  "number",
  "date",
  "multiple_choice",
  "checkbox",
  "dropdown",
  "yes_no",
  "rating",
  "scale",
  "nps",
  "opinion_scale"
] as const

/**
 * Generates a form draft preview using AI without saving to the DB yet.
 */
export async function generateFormDraftWithAiAction(input: {
  prompt: string
  tone?: "casual" | "neutral" | "formal"
  depth?: "short" | "balanced" | "detailed"
}): Promise<{
  success: boolean
  data?: AiFormDraft
  error?: { code?: string; message: string }
  remainingCredits?: number
}> {
  const user = await requireUser()

  if (user.creditBalance < AI_CREDIT_COSTS.CREATE_FORM) {
    return {
      success: false,
      error: {
        code: "INSUFFICIENT_CREDITS",
        message: `Você precisa de ${AI_CREDIT_COSTS.CREATE_FORM} créditos para criar um formulário com IA (seu saldo: ${user.creditBalance}). Resgate recompensas ou recarregue créditos.`,
      },
    }
  }

  if (!input.prompt || input.prompt.trim().length < 5) {
    return { success: false, error: { message: "O prompt deve ter pelo menos 5 caracteres." } }
  }

  try {
    const model = getGeminiModel("gemini-2.5-flash")

    const toneInstruction = input.tone === "casual"
      ? "Tom de voz descontraído, humano e próximo."
      : input.tone === "formal"
      ? "Tom de voz executivo, corporativo e profissional."
      : "Tom de voz claro, amigável e direto."

    const depthInstruction = input.depth === "short"
      ? "Crie entre 3 e 5 perguntas essenciais para máxima taxa de resposta (menos de 2 minutos)."
      : input.depth === "detailed"
      ? "Crie entre 7 e 10 perguntas profundas para qualificação rigorosa."
      : "Crie entre 5 e 7 perguntas equilibradas (tempo ideal de preenchimento de 2 a 3 minutos)."

    const systemPrompt = `
      Você é um especialista em CRO (Conversion Rate Optimization), UX Research e design de formulários de alta conversão.
      Sua missão é criar a estrutura de um formulário altamente eficaz com base na necessidade do usuário.

      Instrução do Usuário: "${input.prompt}"
      ${toneInstruction}
      ${depthInstruction}

      Tipos de perguntas permitidos para o campo "type":
      ${SUPPORTED_AI_QUESTION_TYPES.join(", ")}

      Diretrizes de Especialista:
      - Use "whatsapp" quando fizer sentido contato rápido no Brasil.
      - Use "nps" ou "rating" quando for pesquisa de satisfação.
      - Use "multiple_choice" com 3 a 5 opções claras para reduzir fadiga de decisão.
      - Crie no máximo 1 ou 2 regras de lógica condicional ("logicJumpToTempId" e "logicConditionValue") se fizer sentido estratégico (ex: desqualificar ou aprofundar feedback).
      - Indique "estimatedTimeMinutes" realista (1, 2, 3, etc.).
      - Dê 2 a 3 "conversionTips" práticas sobre por que essa estrutura foi escolhida para converter bem.
      - Retorne APENAS um objeto JSON válido (sem markdown, sem blocos \`\`\`).

      Formato JSON estrito:
      {
        "title": "Título estratégico do formulário",
        "description": "Subtítulo engajador que incentiva o preenchimento",
        "targetAudience": "Público-alvo inferido",
        "tone": "${input.tone || "neutral"}",
        "estimatedTimeMinutes": 2,
        "conversionTips": [
          "Dica 1 de conversão",
          "Dica 2 de conversão"
        ],
        "questions": [
          {
            "tempId": "q1",
            "type": "short_text" | "whatsapp" | "multiple_choice" | "rating" | etc,
            "title": "Texto claro da pergunta",
            "description": "Texto auxiliar opcional",
            "required": true,
            "options": ["Opção A", "Opção B"],
            "logicJumpToTempId": "q3",
            "logicConditionValue": "Opção B"
          }
        ]
      }
    `

    const result = await model.generateContent(systemPrompt)
    const responseText = result.response.text()
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim()
    const draft = JSON.parse(cleanJson) as AiFormDraft

    // Deduct credits after successful AI generation
    const deduction = await deductUserCredits(
      user.id,
      AI_CREDIT_COSTS.CREATE_FORM,
      "ai_create_form_draft",
      { prompt: input.prompt.slice(0, 100) }
    )

    if (!deduction.success) {
      return {
        success: false,
        error: {
          code: "INSUFFICIENT_CREDITS",
          message: deduction.error?.message || "Créditos insuficientes.",
        },
      }
    }

    revalidatePath("/dashboard")

    return {
      success: true,
      data: draft,
      remainingCredits: deduction.newBalance,
    }
  } catch (error) {
    console.error("[generateFormDraftWithAiAction] Error:", error)
    return {
      success: false,
      error: { message: error instanceof Error ? error.message : "Falha ao gerar rascunho com IA." },
    }
  }
}

/**
 * Refines an existing AI draft with natural language tweaks (e.g. "make it shorter", "add WhatsApp").
 */
export async function refineFormDraftWithAiAction(input: {
  currentDraft: AiFormDraft
  instruction: string
}): Promise<{
  success: boolean
  data?: AiFormDraft
  error?: { code?: string; message: string }
  remainingCredits?: number
}> {
  const user = await requireUser()

  if (user.creditBalance < AI_CREDIT_COSTS.REFINE_FORM) {
    return {
      success: false,
      error: {
        code: "INSUFFICIENT_CREDITS",
        message: `Você precisa de ${AI_CREDIT_COSTS.REFINE_FORM} créditos para refinar o rascunho com IA (seu saldo: ${user.creditBalance}).`,
      },
    }
  }

  if (!input.instruction || input.instruction.trim().length < 3) {
    return { success: false, error: { message: "A instrução deve ter pelo menos 3 caracteres." } }
  }

  try {
    const model = getGeminiModel("gemini-2.5-flash")

    const systemPrompt = `
      Você é um especialista em CRO e UX de formulários.
      O usuário já tem um rascunho de formulário e solicitou um refinamento/ajuste.

      RASCUNHO ATUAL:
      ${JSON.stringify(input.currentDraft, null, 2)}

      INSTRUÇÃO DE AJUSTE DO USUÁRIO:
      "${input.instruction}"

      Retorne o rascunho completo atualizado aplicando a alteração solicitada de forma inteligente.
      Mantenha a coerência dos IDs ("tempId"), títulos, estimativas de tempo e tipos de pergunta válidos.
      Tipos permitidos: ${SUPPORTED_AI_QUESTION_TYPES.join(", ")}.

      Retorne APENAS o JSON válido sem markdown ou tags adicionais.
    `

    const result = await model.generateContent(systemPrompt)
    const responseText = result.response.text()
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim()
    const updatedDraft = JSON.parse(cleanJson) as AiFormDraft

    // Deduct credits after successful AI refinement
    const deduction = await deductUserCredits(
      user.id,
      AI_CREDIT_COSTS.REFINE_FORM,
      "ai_refine_form_draft",
      { instruction: input.instruction.slice(0, 100) }
    )

    if (!deduction.success) {
      return {
        success: false,
        error: {
          code: "INSUFFICIENT_CREDITS",
          message: deduction.error?.message || "Créditos insuficientes.",
        },
      }
    }

    revalidatePath("/dashboard")

    return {
      success: true,
      data: updatedDraft,
      remainingCredits: deduction.newBalance,
    }
  } catch (error) {
    console.error("[refineFormDraftWithAiAction] Error:", error)
    return {
      success: false,
      error: { message: error instanceof Error ? error.message : "Falha ao refinar rascunho com IA." },
    }
  }
}

/**
 * Persists an approved AI Form Draft into the database and prepares questions and logic rules.
 */
export async function saveAiGeneratedFormAction(draft: AiFormDraft): Promise<{
  success: boolean
  data?: { formId: string }
  error?: { message: string }
}> {
  const user = await requireUser()

  try {
    // 1. Create the form
    const formResult = await createForm({
      workspaceId: user.defaultWorkspace.id,
      createdById: user.id,
      title: draft.title || "Novo Formulário Inteligente",
      description: draft.description,
    })

    if (!formResult.success || !formResult.data) {
      throw new Error("Falha ao criar o formulário no banco de dados.")
    }

    const formId = formResult.data.id

    // Map temporary IDs (e.g. "q1", "q2") to real database UUIDs
    const idMap = new Map<string, string>()
    draft.questions.forEach((q) => {
      idMap.set(q.tempId, randomUUID())
    })

    // 2. Prepare questions with options and logicRules
    const upsertInput: UpsertQuestionInput[] = draft.questions.map((q, i) => {
      const realId = idMap.get(q.tempId) || randomUUID()
      
      const properties: Record<string, unknown> = {}
      if (q.options && q.options.length > 0) {
        properties.options = q.options.map((opt) => ({
          id: randomUUID(),
          label: opt,
        }))
      }

      // Configure rating / scale specifics if generated
      if (q.type === "rating") {
        properties.ratingStyle = "stars"
        properties.ratingMax = 5
      } else if (q.type === "nps") {
        properties.scaleMin = 0
        properties.scaleMax = 10
        properties.scaleMinLabel = "Pouco provável"
        properties.scaleMaxLabel = "Muito provável"
      }

      // Logic rules if AI suggested a jump
      const logicRules = []
      if (q.logicJumpToTempId && idMap.has(q.logicJumpToTempId)) {
        const targetRealId = idMap.get(q.logicJumpToTempId)!
        logicRules.push({
          id: randomUUID(),
          condition: {
            questionId: realId,
            operator: "equals" as const,
            value: q.logicConditionValue || (q.options ? q.options[0] : ""),
          },
          action: {
            type: "jump_to" as const,
            targetQuestionId: targetRealId,
          },
        })
      }

      return {
        id: realId,
        formId,
        type: q.type,
        title: q.title,
        description: q.description || undefined,
        required: q.required ?? false,
        order: i,
        properties,
        logicRules,
      }
    })

    const upsertResult = await upsertQuestions(formId, upsertInput)
    if (!upsertResult.success) {
      throw new Error(`Falha ao salvar perguntas: ${upsertResult.error?.message}`)
    }

    revalidatePath("/dashboard")
    return { success: true, data: { formId } }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar formulário"
    console.error("[saveAiGeneratedFormAction] Error:", message)
    return {
      success: false,
      error: { message },
    }
  }
}

/**
 * Legacy wrapper to keep 100% backward compatibility
 */
export async function generateFormFromTextAction(promptText: string) {
  const draftResult = await generateFormDraftWithAiAction({ prompt: promptText })
  if (!draftResult.success || !draftResult.data) {
    return { success: false, error: { code: "AI_GENERATION_ERROR", message: draftResult.error?.message || "Erro desconhecido" } }
  }
  const saveResult = await saveAiGeneratedFormAction(draftResult.data)
  if (!saveResult.success || !saveResult.data) {
    return { success: false, error: { code: "AI_GENERATION_ERROR", message: saveResult.error?.message || "Erro desconhecido" } }
  }
  return { success: true, data: saveResult.data }
}

