import { z } from "zod"
import { QUESTION_TYPES, type QuestionProperties, type QuestionType } from "@/lib/types/form"
import type { ImportResult, ImportWarning, ImportedQuestion } from "./types"

// ─── Type resolution (direct + aliases) ─────────────────────────────────────

const TYPE_ALIASES: Record<string, QuestionType> = {
  text: "short_text",
  short: "short_text",
  shorttext: "short_text",
  textarea: "long_text",
  paragraph: "long_text",
  longtext: "long_text",
  radio: "multiple_choice",
  multiplechoice: "multiple_choice",
  mcq: "multiple_choice",
  select: "dropdown",
  checkboxes: "checkbox",
  multiselect: "checkbox",
  boolean: "yes_no",
  yesno: "yes_no",
  "yes-no": "yes_no",
  rate: "rating",
  stars: "rating",
  likert: "scale",
  tel: "phone",
  telephone: "phone",
  file: "file_upload",
  upload: "file_upload",
  sign: "signature",
  grid: "matrix",
  rank: "ranking",
}

const VALID_TYPES = Object.keys(QUESTION_TYPES) as QuestionType[]

function resolveType(raw: unknown): { type: QuestionType; alias?: string } | { error: string } {
  if (typeof raw !== "string") {
    return { error: "campo 'type' ausente ou inválido" }
  }
  const key = raw.toLowerCase().replace(/[\s-]+/g, "_").trim()
  if (VALID_TYPES.includes(key as QuestionType)) {
    return { type: key as QuestionType }
  }
  const keyFlat = key.replace(/_/g, "")
  if (TYPE_ALIASES[keyFlat]) {
    return { type: TYPE_ALIASES[keyFlat], alias: raw }
  }
  if (TYPE_ALIASES[key]) {
    return { type: TYPE_ALIASES[key], alias: raw }
  }
  return {
    error: `tipo "${raw}" desconhecido. Tipos válidos: ${VALID_TYPES.join(", ")}`,
  }
}

// ─── Coercions ──────────────────────────────────────────────────────────────

function coerceRequired(raw: unknown): boolean {
  if (typeof raw === "boolean") return raw
  if (typeof raw === "number") return raw !== 0
  if (typeof raw === "string") {
    const lower = raw.toLowerCase().trim()
    if (["true", "sim", "yes", "1", "required", "obrigatório", "obrigatoria"].includes(lower)) return true
    return false
  }
  return false
}

interface RawOption {
  id?: unknown
  label?: unknown
  value?: unknown
  text?: unknown
  name?: unknown
  imageUrl?: unknown
}

interface OptionNormalization {
  options: { id: string; label: string; imageUrl?: string }[] | undefined
  fromString: boolean
  injectedId: boolean
  renamedLabel: boolean
}

function normalizeOptions(raw: unknown): OptionNormalization {
  if (!Array.isArray(raw)) {
    return { options: undefined, fromString: false, injectedId: false, renamedLabel: false }
  }

  let fromString = false
  let injectedId = false
  let renamedLabel = false
  const usedIds = new Set<string>()

  const options = raw.map((opt, i) => {
    let id: string | null = null
    let label: string | null = null
    let imageUrl: string | undefined

    if (typeof opt === "string") {
      fromString = true
      label = opt
    } else if (opt && typeof opt === "object") {
      const o = opt as RawOption
      if (typeof o.id === "string" && o.id.length > 0) id = o.id
      if (typeof o.label === "string" && o.label.length > 0) {
        label = o.label
      } else if (typeof o.value === "string" && o.value.length > 0) {
        label = o.value
        renamedLabel = true
      } else if (typeof o.text === "string" && o.text.length > 0) {
        label = o.text
        renamedLabel = true
      } else if (typeof o.name === "string" && o.name.length > 0) {
        label = o.name
        renamedLabel = true
      }
      if (typeof o.imageUrl === "string") imageUrl = o.imageUrl
    }

    if (!label) label = `Opção ${i + 1}`
    if (!id) {
      injectedId = true
      id = crypto.randomUUID()
    }
    usedIds.add(id)

    return imageUrl ? { id, label, imageUrl } : { id, label }
  })

  return { options, fromString, injectedId, renamedLabel }
}

// ─── Per-type property schemas ───────────────────────────────────────────────

const optionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  imageUrl: z.string().optional(),
})

const choicePropsSchema = z.object({
  options: z
    .array(optionSchema)
    .default([])
    .refine((arr) => arr.length >= 1, { message: "precisa de pelo menos 1 opção" }),
  allowOther: z.boolean().default(false),
  randomizeOptions: z.boolean().default(false),
})

const matrixPropsSchema = z.object({
  matrixRows: z.array(z.string().min(1)).min(1, "precisa de pelo menos 1 linha (matrixRows)"),
  matrixColumns: z.array(z.string().min(1)).min(1, "precisa de pelo menos 1 coluna (matrixColumns)"),
})

const scalePropsSchema = z.object({
  scaleMin: z.number().int().default(1),
  scaleMax: z.number().int().default(5),
  scaleMinLabel: z.string().optional(),
  scaleMaxLabel: z.string().optional(),
})

const ratingPropsSchema = z.object({
  ratingMax: z.number().int().min(1).max(10).default(5),
  ratingStyle: z.enum(["stars", "hearts", "thumbs", "numbers"]).default("stars"),
})

const textPropsSchema = z.object({
  placeholder: z.string().optional(),
  maxLength: z.number().int().positive().optional(),
  minLength: z.number().int().nonnegative().optional(),
})

const numberPropsSchema = z.object({
  placeholder: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
})

const simpleInputSchema = z.object({
  placeholder: z.string().optional(),
})

const phonePropsSchema = z.object({
  placeholder: z.string().optional(),
  defaultCountry: z.string().default("BR"),
})

const filePropsSchema = z.object({
  allowedFileTypes: z.array(z.string()).optional(),
  maxFileSize: z.number().int().positive().optional(),
})

const layoutPropsSchema = z.object({
  buttonText: z.string().optional(),
  contentAlign: z.enum(["left", "center", "right"]).optional(),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
})

const downloadPropsSchema = z.object({
  downloadUrl: z.string().min(1, "downloadUrl é obrigatório"),
  buttonText: z.string().optional(),
  downloadButtonSize: z.enum(["sm", "default", "lg"]).default("default"),
  downloadButtonAlign: z.enum(["left", "center", "right", "full"]).default("center"),
})

const emptyPropsSchema = z.object({}).default({})

function parseProperties(type: QuestionType, raw: unknown): QuestionProperties {
  switch (type) {
    case "multiple_choice":
    case "checkbox":
    case "dropdown":
    case "ranking":
      return choicePropsSchema.parse(raw)
    case "matrix":
      return matrixPropsSchema.parse(raw)
    case "scale":
    case "opinion_scale":
      return scalePropsSchema.parse(raw)
    case "rating":
      return ratingPropsSchema.parse(raw)
    case "short_text":
    case "long_text":
      return textPropsSchema.parse(raw)
    case "number":
      return numberPropsSchema.parse(raw)
    case "phone":
      return phonePropsSchema.parse(raw)
    case "file_upload":
      return filePropsSchema.parse(raw)
    case "welcome":
    case "statement":
    case "thank_you":
      return layoutPropsSchema.parse(raw)
    case "download":
      return downloadPropsSchema.parse(raw)
    case "email":
    case "url":
    case "cpf":
    case "cnpj":
    case "date":
    case "whatsapp":
      return simpleInputSchema.parse(raw)
    case "yes_no":
    case "nps":
    case "signature":
      return emptyPropsSchema.parse(raw)
  }
}

// ─── Normalization (pre-validation) ──────────────────────────────────────────

interface NormalizedQuestion {
  type: QuestionType
  title: string
  description?: string
  required: boolean
  properties: Record<string, unknown>
  logicRules?: unknown[]
}

const KEYS_AT_PROPERTIES_LEVEL = [
  "options",
  "matrixRows", "matrixColumns",
  "scaleMin", "scaleMax", "scaleMinLabel", "scaleMaxLabel",
  "ratingMax", "ratingStyle",
  "placeholder", "maxLength", "minLength",
  "min", "max", "step",
  "allowOther", "randomizeOptions",
  "allowedFileTypes", "maxFileSize",
  "defaultCountry",
  "buttonText", "contentAlign", "imageUrl", "videoUrl",
  "downloadUrl", "downloadButtonSize", "downloadButtonAlign",
] as const

const TOP_LEVEL_TO_PROPERTIES_ALIASES: Record<string, string> = {
  choices: "options",
  rows: "matrixRows",
  columns: "matrixColumns",
}

function normalizeQuestion(
  raw: unknown,
  index: number,
  warnings: ImportWarning[],
): { question: NormalizedQuestion } | { error: string } {
  if (!raw || typeof raw !== "object") {
    return { error: `pergunta ${index + 1}: formato inválido (esperado objeto)` }
  }
  const q = raw as Record<string, unknown>

  const typeResult = resolveType(q.type)
  if ("error" in typeResult) {
    return { error: `pergunta ${index + 1}: ${typeResult.error}` }
  }
  if (typeResult.alias) {
    warnings.push({
      questionIndex: index,
      originalType: typeResult.alias,
      message: `tipo "${typeResult.alias}" mapeado para "${typeResult.type}"`,
    })
  }

  const titleRaw = typeof q.title === "string"
    ? q.title
    : typeof q.question === "string"
      ? q.question
      : typeof q.label === "string"
        ? q.label
        : ""
  const title = titleRaw.trim()
  if (!title) {
    return { error: `pergunta ${index + 1}: título ausente ou vazio (campo 'title')` }
  }

  const description = typeof q.description === "string"
    ? q.description
    : typeof q.help === "string"
      ? q.help
      : undefined

  const required = coerceRequired(q.required)

  // Build properties: merge existing q.properties with top-level shortcut keys.
  const rawProps: Record<string, unknown> = q.properties && typeof q.properties === "object" && !Array.isArray(q.properties)
    ? { ...(q.properties as Record<string, unknown>) }
    : {}

  // Normalize aliases inside properties itself (e.g. properties.choices -> properties.options)
  for (const [alias, canonical] of Object.entries(TOP_LEVEL_TO_PROPERTIES_ALIASES)) {
    if (alias in rawProps && !(canonical in rawProps)) {
      rawProps[canonical] = rawProps[alias]
      delete rawProps[alias]
    }
  }

  const movedKeys: string[] = []

  // Move known top-level keys into properties
  for (const key of KEYS_AT_PROPERTIES_LEVEL) {
    if (key in q && !(key in rawProps)) {
      rawProps[key] = q[key]
      movedKeys.push(key)
    }
  }
  // Move top-level aliases into canonical property names
  for (const [alias, canonical] of Object.entries(TOP_LEVEL_TO_PROPERTIES_ALIASES)) {
    if (alias in q && !(canonical in rawProps)) {
      rawProps[canonical] = q[alias]
      movedKeys.push(alias)
    }
  }

  if (movedKeys.length > 0) {
    warnings.push({
      questionIndex: index,
      originalType: typeResult.type,
      message: `campo(s) "${movedKeys.join(", ")}" movido(s) do topo da pergunta para "properties"`,
    })
  }

  // Normalize options array if present (regardless of type — Zod enforces per-type later)
  if ("options" in rawProps) {
    const norm = normalizeOptions(rawProps.options)
    if (norm.options) {
      rawProps.options = norm.options
      const notes: string[] = []
      if (norm.fromString) notes.push("strings convertidas para objetos")
      if (norm.injectedId) notes.push("id gerado automaticamente")
      if (norm.renamedLabel) notes.push("label inferido a partir de 'value'/'text'/'name'")
      if (notes.length > 0) {
        warnings.push({
          questionIndex: index,
          originalType: typeResult.type,
          message: `options normalizadas: ${notes.join("; ")}`,
        })
      }
    }
  }

  // Normalize matrixRows / matrixColumns if they arrived as [{label: "X"}]
  for (const key of ["matrixRows", "matrixColumns"] as const) {
    if (Array.isArray(rawProps[key])) {
      const arr = rawProps[key] as unknown[]
      if (arr.length > 0 && arr.some((v) => typeof v !== "string")) {
        rawProps[key] = arr.map((v) => {
          if (typeof v === "string") return v
          if (v && typeof v === "object") {
            const o = v as { label?: unknown; text?: unknown; name?: unknown; value?: unknown }
            for (const k of ["label", "text", "name", "value"] as const) {
              if (typeof o[k] === "string" && o[k].length > 0) return o[k]
            }
          }
          return ""
        }).filter((s) => s.length > 0)
        warnings.push({
          questionIndex: index,
          originalType: typeResult.type,
          message: `${key}: objetos convertidos para strings`,
        })
      }
    }
  }

  // Preserve logicRules if present at the top level
  const logicRules = Array.isArray(q.logicRules) ? q.logicRules : undefined

  return {
    question: {
      type: typeResult.type,
      title,
      description,
      required,
      properties: rawProps,
      logicRules,
    },
  }
}

// ─── Top-level parser ────────────────────────────────────────────────────────

const MAX_QUESTIONS = 200

export function parseJsonImport(jsonString: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    throw new Error("JSON inválido. Verifique a formatação e tente novamente.")
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("JSON deve ser um objeto no topo (com 'title' e 'questions').")
  }

  const obj = parsed as Record<string, unknown>

  const formTitle = (typeof obj.title === "string" ? obj.title : typeof obj.name === "string" ? obj.name : "").trim()
  if (!formTitle) {
    throw new Error("Título do formulário ausente (campo 'title').")
  }

  const formDescription = typeof obj.description === "string" ? obj.description : undefined

  const rawQuestions = obj.questions ?? obj.fields ?? obj.items
  if (!Array.isArray(rawQuestions)) {
    throw new Error("Campo 'questions' ausente ou não é um array.")
  }
  if (rawQuestions.length === 0) {
    throw new Error("O formulário precisa ter pelo menos 1 pergunta.")
  }
  if (rawQuestions.length > MAX_QUESTIONS) {
    throw new Error(`Máximo de ${MAX_QUESTIONS} perguntas (recebido ${rawQuestions.length}).`)
  }

  const warnings: ImportWarning[] = []
  const questions: ImportedQuestion[] = []
  const errors: string[] = []

  for (let i = 0; i < rawQuestions.length; i++) {
    const normResult = normalizeQuestion(rawQuestions[i], i, warnings)
    if ("error" in normResult) {
      errors.push(normResult.error)
      continue
    }

    const n = normResult.question
    try {
      const properties = parseProperties(n.type, n.properties)
      questions.push({
        type: n.type,
        title: n.title,
        description: n.description,
        required: n.required,
        order: i,
        properties,
        // Carry logicRules through if provided (cast to any to satisfy ImportedQuestion)
        ...(n.logicRules ? { logicRules: n.logicRules as never } : {}),
      })
    } catch (err) {
      if (err instanceof z.ZodError) {
        const msg = err.issues
          .map((iss) => `${iss.path.join(".") || "properties"}: ${iss.message}`)
          .join("; ")
        errors.push(`pergunta ${i + 1} (${n.type}): ${msg}`)
      } else {
        throw err
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Erros de validação:\n${errors.join("\n")}`)
  }

  return {
    title: formTitle,
    description: formDescription,
    questions,
    warnings,
  }
}
