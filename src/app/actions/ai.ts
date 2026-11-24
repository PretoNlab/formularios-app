"use server"

import { randomUUID } from "crypto"
import { db } from "@/lib/db/client"
import { answers, responses } from "@/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { requireUser, requireFormOwner } from "@/lib/auth"
import { getGeminiModel } from "@/lib/ai/google-ai"
import { AnalyticsPeriod, QuestionType } from "@/lib/types/form"
import { createForm } from "@/lib/db/queries/forms"
import { upsertQuestions, UpsertQuestionInput } from "@/lib/db/queries/questions"
import { insertSyntheticResponses } from "@/lib/db/queries/responses"
import { deductUserCredits } from "@/lib/db/queries/users"
import { AI_CREDIT_COSTS, SYNTHETIC_SOURCE_LABEL } from "@/lib/credits"
import { mapDbForm } from "@/lib/utils/map-db-form"
import {
  computeAggregateSsrScore,
  describeSsrScore,
  extractCleanJson,
  normalizeSyntheticAnswers,
  semanticInsightsSchema,
  SSR_ANCHOR_LABELS,
  syntheticSimulationRawSchema,
  type AggregateSsrResult,
} from "@/lib/ai/ssr-engine"
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
      Você é um analista de dados especialista em pesquisas e formulários usando o método Semantic Similarity Rating (SSR).
      Analise as seguintes respostas textuais para uma única pergunta de um formulário.
      
      Respostas (${textList.length} no total):
      ${textList.map((t, i) => `${i + 1}. ${t}`).join('\n')}
      
      Seu objetivo é extrair inteligência qualitativa dessas respostas e aplicar ancoragem semântica (SSR) de 1 a 5 para cada resposta antes de agregar:
      - Âncora 1 (${SSR_ANCHOR_LABELS[1]}): rejeição clara, frustração intensa ou recusa total.
      - Âncora 2 (${SSR_ANCHOR_LABELS[2]}): insatisfação moderada, dúvida relevante ou crítica predominante.
      - Âncora 3 (${SSR_ANCHOR_LABELS[3]}): posição neutra, mista ou puramente descritiva sem inclinação clara.
      - Âncora 4 (${SSR_ANCHOR_LABELS[4]}): boa aceitação, elogio moderado ou interesse com ressalva pontual.
      - Âncora 5 (${SSR_ANCHOR_LABELS[5]}): entusiasmo evidente, forte intenção ou aprovação sem reservas.

      Retorne APENAS um objeto JSON válido (sem markdown, sem blocos de código \`\`\`) com o seguinte formato:
      {
        "summary": "Um parágrafo curto e direto sintetizando os padrões e pontos centrais apontados pelos respondentes.",
        "sentiment": "positive" | "neutral" | "negative",
        "ssrScore": 3.8,
        "ssrDistribution": [
          { "anchor": 1, "count": 0 },
          { "anchor": 2, "count": 1 },
          { "anchor": 3, "count": 2 },
          { "anchor": 4, "count": 4 },
          { "anchor": 5, "count": 3 }
        ],
        "themes": [
          { "theme": "Nome do Tema", "count": 10, "sentiment": "positive" | "neutral" | "negative" }
        ],
        "topQuotes": ["Uma ou duas frases curtas que representam bem o grupo"]
      }
      
      Instruções de Escrita e Tom (Diretrizes Humanizer):
      - Responda em Português (PT-BR) natural e executivo.
      - Vá direto ao ponto no "summary": informe o que os respondentes disseram sem introduções prolixas ou encenação.
      - NUNCA use clichês de IA como: "não é apenas X, mas Y", "delve", "testamento/testemunho", "tapeçaria", "ecossistema", "panorama", "crucial", "momento decisivo" ou "o futuro parece brilhante".
      - "themes" deve ter no máximo 5 itens com nomes objetivos e concisos.
      - "topQuotes" devem ser fiéis às falas reais dos respondentes, sem embelezamento artificial.
    `

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    const cleanJson = extractCleanJson(responseText)
    const parsed = semanticInsightsSchema.parse(JSON.parse(cleanJson))

    let ssrScore = parsed.ssrScore
    if (parsed.ssrDistribution && parsed.ssrDistribution.length > 0) {
      const expanded: number[] = []
      for (const bucket of parsed.ssrDistribution) {
        for (let k = 0; k < bucket.count; k++) expanded.push(bucket.anchor)
      }
      if (expanded.length > 0) {
        ssrScore = computeAggregateSsrScore(expanded).score
      }
    }

    const insights = {
      ...parsed,
      ssrScore,
      ssrLabel: ssrScore !== undefined ? describeSsrScore(ssrScore) : undefined,
    }

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
      ? "Tom de voz descontraído, humano, próximo e coloquial (como uma conversa no WhatsApp ou café)."
      : input.tone === "formal"
      ? "Tom de voz executivo, polido e corporativo, porém direto e sem jargões inflados."
      : "Tom de voz claro, amigável, acolhedor e direto ao ponto."

    const depthInstruction = input.depth === "short"
      ? "Crie entre 3 e 5 perguntas essenciais para máxima taxa de resposta (menos de 2 minutos)."
      : input.depth === "detailed"
      ? "Crie entre 7 e 10 perguntas profundas para qualificação rigorosa."
      : "Crie entre 5 e 7 perguntas equilibradas (tempo ideal de preenchimento de 2 a 3 minutos)."

    const systemPrompt = `
      Você é um especialista em CRO (Conversion Rate Optimization), UX Research e design de formulários de alta conversão.
      Sua missão é criar a estrutura de um formulário altamente eficaz, com escrita humana e natural, com base na necessidade do usuário.

      Instrução do Usuário: "${input.prompt}"
      ${toneInstruction}
      ${depthInstruction}

      Tipos de perguntas permitidos para o campo "type":
      ${SUPPORTED_AI_QUESTION_TYPES.join(", ")}

      Diretrizes de Especialista & CRO:
      - Use "whatsapp" quando fizer sentido contato rápido no Brasil.
      - Use "nps" ou "rating" quando for pesquisa de satisfação.
      - Use "multiple_choice" com 3 a 5 opções claras para reduzir fadiga de decisão.
      - Crie no máximo 1 ou 2 regras de lógica condicional ("logicJumpToTempId" e "logicConditionValue") se fizer sentido estratégico (ex: desqualificar ou aprofundar feedback).
      - Indique "estimatedTimeMinutes" realista (1, 2, 3, etc.).
      - Dê 2 a 3 "conversionTips" práticas sobre por que essa estrutura foi escolhida para converter bem.

      Diretrizes Anti-Robô (Princípios Humanizer para Formulários):
      1. Título e Descrição:
         - NUNCA use emojis decorativos exagerados no título (ex: proibir "🚀 FASE 1: O Despertar...", "🌟 Pesquisa Incrível").
         - NUNCA use o clichê "Não X, mas Y" ou "Não se trata apenas de X, mas de Y" (ex: proibir "Sua opinião não é apenas bem-vinda, é fundamental").
         - Foque o título e a descrição no benefício claro para quem responde ou no propósito real da interação.
      2. Perguntas que soam humanas:
         - Formule perguntas como uma pessoa real conversando com outra (reduz fricção psicológica e aumenta taxas de conclusão).
         - Evite frieza burocrática e jargões inflados (ex: prefira "Como foi seu atendimento?" a "Qual sua percepção de conformidade dos serviços prestados?").
         - Evite palavras clichês de IA ("ecossistema", "panorama", "testamento", "crucial", "mergulhe", "robusto").
      3. Ritmo e Opções naturais:
         - Não force tríades artificiais de adjetivos ("rápido, fácil e seguro").
         - Nas opções de múltipla escolha, use opções realistas e linguagem coloquial autêntica que os respondentes realmente usariam.

      Retorne APENAS um objeto JSON válido (sem markdown, sem blocos \`\`\`).

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
      
      Diretrizes de Qualidade e Humanização:
      - Se o usuário pedir para humanizar, tornar mais amigável, direto ou informal, reescreva títulos, descrições e perguntas removendo termos burocráticos, prolixos e clichês de IA ("não apenas X mas Y", "ecossistema", emojis desnecessários), aproximando a linguagem do dia a dia do respondente.
      - Mantenha a coerência dos IDs ("tempId"), títulos, estimativas de tempo e tipos de pergunta válidos.
      - Tipos permitidos: ${SUPPORTED_AI_QUESTION_TYPES.join(", ")}.

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

// ─── Synthetic Respondents Simulator (Semantic Similarity Rating — SSR) ──────

export interface SimulatedPersonaView {
  name: string
  age: number
  region: string
  profile: string
  archetype: "entusiasta" | "pragmatico" | "cetico"
  innerThought: string
  ssrAnchor: number
  frictionPoint?: string
  answeredCount: number
}

export interface SyntheticSimulationResult {
  executiveSummary: string
  ssr: AggregateSsrResult
  frictionAlerts: {
    questionTitle: string
    issue: string
    suggestion: string
  }[]
  personas: SimulatedPersonaView[]
  savedCount: number
}

const NON_SIMULATED_TYPES = new Set([
  "welcome",
  "statement",
  "thank_you",
  "download",
  "file_upload",
  "signature",
])

export async function simulateSyntheticRespondentsAction(input: {
  formId: string
  audienceDescription?: string
  count: 10 | 20
  saveToDashboard: boolean
}): Promise<{
  success: boolean
  data?: SyntheticSimulationResult
  error?: { code?: string; message: string }
  remainingCredits?: number
}> {
  try {
    const { user, form: dbForm } = await requireFormOwner(input.formId)
    const sampleSize = input.count === 20 ? 20 : 10
    const creditCost =
      sampleSize === 20
        ? AI_CREDIT_COSTS.SYNTHETIC_PANEL_20
        : AI_CREDIT_COSTS.SYNTHETIC_PANEL_10

    if (user.creditBalance < creditCost) {
      return {
        success: false,
        error: {
          code: "INSUFFICIENT_CREDITS",
          message: `Você precisa de ${creditCost} créditos para simular ${sampleSize} consumidores sintéticos (seu saldo: ${user.creditBalance}).`,
        },
      }
    }

    const mappedForm = mapDbForm(dbForm)
    const answerableQuestions = [...mappedForm.questions]
      .sort((a, b) => a.order - b.order)
      .filter((q) => !NON_SIMULATED_TYPES.has(q.type))

    if (answerableQuestions.length === 0) {
      return {
        success: false,
        error: {
          code: "EMPTY_FORM",
          message: "Adicione pelo menos uma pergunta respondível ao formulário antes de rodar a simulação.",
        },
      }
    }

    const questionsSpec = answerableQuestions.map((q, idx) => {
      const options = (q.properties.options ?? []).map((o) => o.label)
      const spec: Record<string, unknown> = {
        id: q.id,
        order: idx + 1,
        type: q.type,
        title: q.title,
        required: q.required,
      }
      if (q.description) spec.description = q.description
      if (options.length > 0) spec.options = options
      if (q.type === "rating") spec.range = `inteiro de 1 a ${q.properties.ratingMax ?? 5}`
      if (q.type === "nps") spec.range = "inteiro de 0 a 10"
      if (q.type === "scale" || q.type === "opinion_scale") {
        spec.range = `inteiro de ${q.properties.scaleMin ?? 1} a ${q.properties.scaleMax ?? 5}`
        if (q.properties.scaleMinLabel) spec.minLabel = q.properties.scaleMinLabel
        if (q.properties.scaleMaxLabel) spec.maxLabel = q.properties.scaleMaxLabel
      }
      if (q.type === "matrix") {
        spec.matrixRows = q.properties.matrixRows ?? []
        spec.matrixColumns = q.properties.matrixColumns ?? []
      }
      return spec
    })

    const audienceContext = input.audienceDescription?.trim()
      ? `Público-alvo especificado pelo criador: "${input.audienceDescription.trim()}"`
      : "Público-alvo: infira um público brasileiro realista a partir do título e das perguntas do formulário."

    const prompt = `
      Você é um motor de pesquisa de mercado baseado no método científico Semantic Similarity Rating (SSR — arXiv:2510.08338).
      Sua tarefa é simular ${sampleSize} consumidores brasileiros distintos respondendo ao formulário abaixo para testar a aceitação da proposta e identificar falhas nas perguntas antes do lançamento com humanos reais.

      FORMULÁRIO:
      Título: "${mappedForm.title}"
      Descrição: "${mappedForm.description ?? ""}"
      ${audienceContext}

      PERGUNTAS DO FORMULÁRIO (use exatamente o "id" como chave em "answers"):
      ${JSON.stringify(questionsSpec, null, 2)}

      REGRAS OBRIGATÓRIAS DO MÉTODO SSR (EVITAR VIÉS DE CENTRALIDADE):
      1. Diversidade real de arquétipos: distribua as ${sampleSize} personas aproximadamente em:
         - ~25% "entusiasta" (têm a dor latente e veem alto valor)
         - ~45% "pragmatico" (comparam preço, têm dúvidas práticas, ponderam custo-benefício)
         - ~30% "cetico" (desconfiados, orçamento apertado, usam concorrente ou rejeitam perguntas confusas)
      2. Elicitação em texto livre ANTES de qualquer número:
         Para cada persona, preencha PRIMEIRO "innerThought" em 1ª pessoa (2 a 3 frases francas, coloquiais e sem filtro, como um consumidor real pensando alto ao ler o formulário e os preços/opções).
      3. Ancoragem Semântica ("ssrAnchor" de 1 a 5):
         Só DEPOIS de escrever "innerThought", classifique a reação da persona na escala semântica:
         - 1 = ${SSR_ANCHOR_LABELS[1]} (rejeita a proposta, acha caro/inútil ou desistiria)
         - 2 = ${SSR_ANCHOR_LABELS[2]} (vê mais problemas/atritos do que benefícios)
         - 3 = ${SSR_ANCHOR_LABELS[3]} (indeciso, depende de condições não explicadas)
         - 4 = ${SSR_ANCHOR_LABELS[4]} (inclinado a aceitar/comprar, com 1 ressalva pontual)
         - 5 = ${SSR_ANCHOR_LABELS[5]} (compraria/aderiria imediatamente)
      4. Coerência estrita nas respostas ("answers"):
         As notas de NPS/rating/escala, escolhas de múltipla escolha e textos abertos de cada persona DEVEM refletir fielmente seu "innerThought" e seu "ssrAnchor" (céticos dão notas baixas e críticas diretas; entusiastas dão notas altas).
         Formato exigido em "answers" por tipo:
         - multiple_choice / dropdown: string idêntica a uma das opções em "options"
         - checkbox: array de strings escolhidas de "options"
         - ranking: array com todas as opções de "options" na ordem preferida pela persona
         - yes_no: boolean (true ou false)
         - nps / rating / scale / opinion_scale / number: número inteiro dentro do range
         - matrix: objeto { "[linha]": "[coluna]" }
         - email / whatsapp / cpf / cnpj / short_text / long_text: dados fictícios brasileiros verossímeis e variados (ex: "(11) 98765-4321", textos naturais de tamanhos variados, sem linguagem robótica).
      5. Auditoria de Fricção ("frictionAlerts"):
         Liste de 2 a 4 problemas práticos nas perguntas atuais do formulário percebidos pelas personas (ex: falta opção "Outro/Nenhum", pergunta ambígua, ordem que gera abandono) com sugestão direta de melhoria.
      6. Diretrizes anti-clichê: escreva em PT-BR natural e direto. Proibido usar "ecossistema", "crucial", "panorama", "não apenas X mas Y".

      Retorne APENAS um JSON válido (sem blocos \`\`\`) neste formato exato:
      {
        "executiveSummary": "Síntese executiva direta de 2 a 3 frases sobre como o público reagiu e o principal gargalo encontrado.",
        "frictionAlerts": [
          {
            "questionTitle": "Título da pergunta com atrito",
            "issue": "O que confundiu ou travou os respondentes",
            "suggestion": "Como reescrever ou ajustar opções"
          }
        ],
        "personas": [
          {
            "name": " Mariana Costa",
            "age": 34,
            "region": "Belo Horizonte, MG",
            "profile": "Sócia de clínica odontológica, faturamento médio",
            "archetype": "pragmatico",
            "innerThought": "Gostei da proposta, mas fiquei na dúvida se integra com minha agenda atual e achei a pergunta de orçamento meio engessada.",
            "ssrAnchor": 4,
            "frictionPoint": "Sentiu falta de opção intermediária de orçamento",
            "durationSeconds": 95,
            "deviceType": "mobile",
            "answers": {
              "id-da-pergunta": "valor"
            }
          }
        ]
      }
    `

    const model = getGeminiModel("gemini-2.5-flash")
    const result = await model.generateContent(prompt)
    const cleanJson = extractCleanJson(result.response.text())
    const parsed = syntheticSimulationRawSchema.parse(JSON.parse(cleanJson))

    const ssr = computeAggregateSsrScore(parsed.personas.map((p) => p.ssrAnchor))

    const preparedInserts = parsed.personas.map((p) => {
      const normalizedAnswers = normalizeSyntheticAnswers(mappedForm.questions, p.answers)
      return {
        persona: p,
        normalizedAnswers,
      }
    })

    let savedCount = 0
    if (input.saveToDashboard) {
      const insertRes = await insertSyntheticResponses(
        input.formId,
        SYNTHETIC_SOURCE_LABEL,
        preparedInserts.map(({ persona, normalizedAnswers }) => ({
          personaSummary: `${persona.name.trim()}, ${persona.age}a (${persona.region}) — ${persona.profile}`,
          archetype: persona.archetype,
          deviceType: persona.deviceType ?? "mobile",
          durationSeconds: persona.durationSeconds ?? 75,
          answers: normalizedAnswers,
        }))
      )
      if (!insertRes.success) {
        throw new Error(insertRes.error?.message || "Erro ao salvar respostas sintéticas.")
      }
      savedCount = insertRes.data?.inserted ?? 0
    }

    const deduction = await deductUserCredits(
      user.id,
      creditCost,
      "ai_synthetic_panel",
      { formId: input.formId, sampleSize, savedCount }
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

    revalidatePath(`/responses/${input.formId}`)
    revalidatePath("/dashboard")

    return {
      success: true,
      remainingCredits: deduction.newBalance,
      data: {
        executiveSummary: parsed.executiveSummary,
        ssr,
        frictionAlerts: parsed.frictionAlerts,
        savedCount,
        personas: preparedInserts.map(({ persona, normalizedAnswers }) => ({
          name: persona.name.trim(),
          age: persona.age,
          region: persona.region,
          profile: persona.profile,
          archetype: persona.archetype,
          innerThought: persona.innerThought,
          ssrAnchor: persona.ssrAnchor,
          frictionPoint: persona.frictionPoint,
          answeredCount: normalizedAnswers.length,
        })),
      },
    }
  } catch (error) {
    console.error("[simulateSyntheticRespondentsAction] Error:", error)
    return {
      success: false,
      error: {
        code: "AI_SIMULATION_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível concluir a simulação com consumidores sintéticos.",
      },
    }
  }
}

