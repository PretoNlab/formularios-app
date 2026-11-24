import { z } from "zod"
import { computeHiddenQuestions, resolveNextIndex } from "@/lib/logic-engine"
import type { AnswerValue, Question } from "@/lib/types/form"

export const SSR_ANCHOR_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "Rejeição forte",
  2: "Resistência",
  3: "Ambivalente",
  4: "Favorável",
  5: "Alta intenção",
} as const

const rawAnswerSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.record(z.string(), z.string()),
  z.null(),
])

export const syntheticPersonaRawSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(16).max(95),
  region: z.string().min(1),
  profile: z.string().min(1),
  archetype: z.enum(["entusiasta", "pragmatico", "cetico"]),
  innerThought: z.string().min(1),
  ssrAnchor: z.number().int().min(1).max(5),
  frictionPoint: z.string().optional(),
  durationSeconds: z.number().int().min(15).max(900).optional(),
  deviceType: z.enum(["mobile", "desktop", "tablet"]).optional(),
  answers: z.record(z.string(), rawAnswerSchema),
})

export const frictionAlertSchema = z.object({
  questionTitle: z.string().min(1),
  issue: z.string().min(1),
  suggestion: z.string().min(1),
})

export const syntheticSimulationRawSchema = z.object({
  executiveSummary: z.string().min(1),
  frictionAlerts: z.array(frictionAlertSchema).max(5),
  personas: z.array(syntheticPersonaRawSchema).min(1),
})

export const ssrDistributionItemSchema = z.object({
  anchor: z.number().int().min(1).max(5),
  count: z.number().int().min(0),
})

export const semanticInsightsSchema = z.object({
  summary: z.string().min(1),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  themes: z.array(
    z.object({
      theme: z.string().min(1),
      count: z.number().int().min(0),
      sentiment: z.enum(["positive", "neutral", "negative"]),
    })
  ),
  topQuotes: z.array(z.string()),
  ssrScore: z.number().min(1).max(5).optional(),
  ssrLabel: z.string().optional(),
  ssrDistribution: z.array(ssrDistributionItemSchema).optional(),
})

export interface SsrAnchorBucket {
  anchor: 1 | 2 | 3 | 4 | 5
  label: string
  count: number
  percentage: number
}

export interface AggregateSsrResult {
  score: number
  label: string
  dispersion: number
  highIntentPercentage: number
  distribution: SsrAnchorBucket[]
}

export function extractCleanJson(rawText: string): string {
  const withoutFences = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim()
  const firstBrace = withoutFences.indexOf("{")
  const lastBrace = withoutFences.lastIndexOf("}")
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return withoutFences.slice(firstBrace, lastBrace + 1)
  }
  return withoutFences
}

export function describeSsrScore(score: number): string {
  if (score >= 4.2) return "Intenção muito alta"
  if (score >= 3.5) return "Boa aceitação"
  if (score >= 2.7) return "Recepção dividida"
  if (score >= 2.0) return "Resistência moderada"
  return "Rejeição predominante"
}

function clampInt(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(val)))
}

function toAnchorKey(n: number): 1 | 2 | 3 | 4 | 5 {
  const clamped = clampInt(n, 1, 5)
  if (clamped === 1) return 1
  if (clamped === 2) return 2
  if (clamped === 3) return 3
  if (clamped === 4) return 4
  return 5
}

export function computeAggregateSsrScore(anchors: number[]): AggregateSsrResult {
  const counts: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  if (anchors.length === 0) {
    return {
      score: 3,
      label: describeSsrScore(3),
      dispersion: 0,
      highIntentPercentage: 0,
      distribution: ([1, 2, 3, 4, 5] as const).map((a) => ({
        anchor: a,
        label: SSR_ANCHOR_LABELS[a],
        count: 0,
        percentage: 0,
      })),
    }
  }

  const valid = anchors.map(toAnchorKey)
  for (const a of valid) {
    counts[a] += 1
  }

  const total = valid.length
  const mean = valid.reduce((acc, v) => acc + v, 0) / total
  const variance = valid.reduce((acc, v) => acc + (v - mean) ** 2, 0) / total
  const stdDev = Math.sqrt(variance)
  const highIntent = counts[4] + counts[5]

  const roundedScore = Math.round(mean * 10) / 10
  return {
    score: roundedScore,
    label: describeSsrScore(roundedScore),
    dispersion: Math.round(stdDev * 100) / 100,
    highIntentPercentage: Math.round((highIntent / total) * 100),
    distribution: ([1, 2, 3, 4, 5] as const).map((a) => ({
      anchor: a,
      label: SSR_ANCHOR_LABELS[a],
      count: counts[a],
      percentage: Math.round((counts[a] / total) * 100),
    })),
  }
}

const SKIPPED_SYNTHETIC_TYPES = new Set([
  "welcome",
  "statement",
  "thank_you",
  "download",
  "file_upload",
  "signature",
])

function isPlainRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function matchOptionLabel(raw: string, options: string[]): string | null {
  const trimmed = raw.trim()
  const exact = options.find((o) => o === trimmed)
  if (exact) return exact
  const lower = trimmed.toLowerCase()
  const caseInsensitive = options.find((o) => o.toLowerCase() === lower)
  if (caseInsensitive) return caseInsensitive
  const partial = options.find(
    (o) => o.toLowerCase().includes(lower) || lower.includes(o.toLowerCase())
  )
  return partial ?? null
}

function coerceSingleQuestionValue(
  question: Question,
  raw: unknown
): AnswerValue {
  if (raw === null || raw === undefined) return null

  const optionLabels = (question.properties.options ?? []).map((o) => o.label)

  switch (question.type) {
    case "nps": {
      const n = typeof raw === "number" ? raw : Number(raw)
      return Number.isFinite(n) ? clampInt(n, 0, 10) : null
    }
    case "rating": {
      const max = question.properties.ratingMax ?? 5
      const n = typeof raw === "number" ? raw : Number(raw)
      return Number.isFinite(n) ? clampInt(n, 1, max) : null
    }
    case "scale":
    case "opinion_scale": {
      const min = question.properties.scaleMin ?? 1
      const max = question.properties.scaleMax ?? 5
      const n = typeof raw === "number" ? raw : Number(raw)
      return Number.isFinite(n) ? clampInt(n, min, max) : null
    }
    case "number": {
      const n = typeof raw === "number" ? raw : Number(raw)
      return Number.isFinite(n) ? n : null
    }
    case "yes_no": {
      if (typeof raw === "boolean") return raw
      if (typeof raw === "string") {
        const lower = raw.trim().toLowerCase()
        if (lower === "sim" || lower === "true" || lower === "yes" || lower === "1") return true
        if (lower === "não" || lower === "nao" || lower === "false" || lower === "no" || lower === "0") return false
      }
      return null
    }
    case "multiple_choice":
    case "dropdown": {
      if (optionLabels.length === 0) return typeof raw === "string" ? raw : null
      const candidate = Array.isArray(raw) ? String(raw[0] ?? "") : String(raw)
      return matchOptionLabel(candidate, optionLabels) ?? optionLabels[0] ?? null
    }
    case "checkbox": {
      if (optionLabels.length === 0) return []
      const rawArr = Array.isArray(raw) ? raw.map(String) : [String(raw)]
      const matched = Array.from(
        new Set(
          rawArr
            .map((item) => matchOptionLabel(item, optionLabels))
            .filter((x): x is string => x !== null)
        )
      )
      const maxSel = question.properties.maxSelections
      const sliced = maxSel && maxSel > 0 ? matched.slice(0, maxSel) : matched
      return sliced.length > 0 ? sliced : [optionLabels[0]]
    }
    case "ranking": {
      if (optionLabels.length === 0) return []
      const rawArr = Array.isArray(raw) ? raw.map(String) : []
      const matched = rawArr
        .map((item) => matchOptionLabel(item, optionLabels))
        .filter((x): x is string => x !== null)
      const remaining = optionLabels.filter((o) => !matched.includes(o))
      return Array.from(new Set([...matched, ...remaining]))
    }
    case "matrix": {
      const rows = question.properties.matrixRows ?? []
      const cols = question.properties.matrixColumns ?? []
      if (rows.length === 0 || cols.length === 0) return null
      const rawObj: Record<string, unknown> = isPlainRecord(raw) ? raw : {}
      const result: Record<string, string> = {}
      for (const row of rows) {
        const rawCol = rawObj[row]
        const matchedCol =
          typeof rawCol === "string" ? matchOptionLabel(rawCol, cols) : null
        result[row] = matchedCol ?? cols[Math.floor(cols.length / 2)]
      }
      return result
    }
    default: {
      if (typeof raw === "string") return raw.trim() || null
      if (typeof raw === "number" || typeof raw === "boolean") return String(raw)
      return null
    }
  }
}

/**
 * Normalizes a synthetic respondent's raw answer map and walks the form's
 * conditional logic (`logicRules`) so skipped/hidden questions are never saved.
 */
export function normalizeSyntheticAnswers(
  questions: Question[],
  rawAnswers: Record<string, unknown>
): { questionId: string; value: AnswerValue }[] {
  const sorted = [...questions].sort((a, b) => a.order - b.order)
  if (sorted.length === 0) return []

  const coercedByQuestion: Record<string, AnswerValue> = {}
  for (const q of sorted) {
    if (SKIPPED_SYNTHETIC_TYPES.has(q.type)) continue
    const val = coerceSingleQuestionValue(q, rawAnswers[q.id])
    if (val !== null) {
      coercedByQuestion[q.id] = val
    }
  }

  // Walk question flow respecting hide_question, jump_to, and end_form
  const visitedAnswerList: { questionId: string; value: AnswerValue }[] = []
  const visitedIndices = new Set<number>()
  let idx = 0

  while (idx >= 0 && idx < sorted.length && !visitedIndices.has(idx)) {
    visitedIndices.add(idx)
    const currentQ = sorted[idx]
    const hidden = computeHiddenQuestions(sorted, coercedByQuestion)

    if (!hidden.has(currentQ.id) && !SKIPPED_SYNTHETIC_TYPES.has(currentQ.type)) {
      const val = coercedByQuestion[currentQ.id]
      if (val !== undefined && val !== null) {
        visitedAnswerList.push({ questionId: currentQ.id, value: val })
      }
    }

    idx = resolveNextIndex(idx, sorted, coercedByQuestion, hidden)
  }

  return visitedAnswerList
}
