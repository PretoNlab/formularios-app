import type { QuestionProperties } from "@/lib/types/form"
import type { ImportResult, ImportWarning, ImportedQuestion } from "./types"
import { mapGoogleQuestionType, getGoogleTypeName } from "./type-mapping"

const MAX_QUESTIONS = 200

// ─── URL Validation ─────────────────────────────────────────────────────────

const GOOGLE_FORMS_PATTERNS = [
  // https://docs.google.com/forms/d/e/{id}/viewform
  /^https:\/\/docs\.google\.com\/forms\/d\/e\/([^/]+)\/viewform/,
  // https://docs.google.com/forms/d/{id}/viewform
  /^https:\/\/docs\.google\.com\/forms\/d\/([^/]+)\/viewform/,
  // https://docs.google.com/forms/d/{id}/edit
  /^https:\/\/docs\.google\.com\/forms\/d\/([^/]+)\/edit/,
  // https://docs.google.com/forms/d/{id}
  /^https:\/\/docs\.google\.com\/forms\/d\/([^/]+)/,
]

function normalizeGoogleFormsUrl(url: string): string | null {
  const trimmed = url.trim()
  for (const pattern of GOOGLE_FORMS_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match) {
      // Check if it's an /e/ (published) URL or direct /d/ URL
      if (trimmed.includes("/forms/d/e/")) {
        return `https://docs.google.com/forms/d/e/${match[1]}/viewform`
      }
      return `https://docs.google.com/forms/d/${match[1]}/viewform`
    }
  }
  return null
}

// ─── HTML Fetching ──────────────────────────────────────────────────────────

async function fetchFormHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; FormImporter/1.0)",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    },
    redirect: "follow",
  })

  if (!res.ok) {
    if (res.status === 403 || res.status === 401) {
      throw new Error("Este formulário do Google não é público. Verifique se ele está aberto para respostas.")
    }
    throw new Error(`Erro ao acessar o Google Forms (HTTP ${res.status}).`)
  }

  const html = await res.text()

  // Check if we got redirected to a login page
  if (html.includes("accounts.google.com/ServiceLogin") || html.includes("accounts.google.com/v3/signin")) {
    throw new Error("Este formulário do Google não é público. Verifique se ele está aberto para respostas.")
  }

  return html
}

// ─── Data Extraction ────────────────────────────────────────────────────────

function extractFormData(html: string): unknown[] {
  const match = html.match(/var\s+FB_PUBLIC_LOAD_DATA_\s*=\s*([\s\S]+?)\s*;\s*<\/script>/)
  if (!match?.[1]) {
    throw new Error("Não foi possível ler este formulário. O Google pode ter alterado o formato da página.")
  }

  try {
    return JSON.parse(match[1]) as unknown[]
  } catch {
    throw new Error("Não foi possível interpretar os dados do formulário. O formato pode ter mudado.")
  }
}

// ─── Question Parsing ───────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

function extractOptions(fieldData: any[]): QuestionProperties["options"] {
  // Options are in field[4][0][1] — array of [label, ?, ?, ?]
  const choiceData = fieldData?.[0]?.[1]
  if (!Array.isArray(choiceData)) return []

  return choiceData.map((choice: any[], i: number) => ({
    id: `opt_${i + 1}`,
    label: String(choice?.[0] ?? `Opção ${i + 1}`),
  }))
}

function extractScaleProperties(fieldData: any[]): Partial<QuestionProperties> {
  // Scale: field[4][0][1] has the labels, field[4][0][3] has min, field[4][0][4] has max
  const scaleData = fieldData?.[0]
  if (!Array.isArray(scaleData)) {
    return { scaleMin: 1, scaleMax: 5 }
  }

  const labels = scaleData[1] as any[] | undefined
  const scaleMin = typeof scaleData[3] === "number" ? scaleData[3] : 1
  const scaleMax = typeof scaleData[4] === "number" ? scaleData[4] : 5

  return {
    scaleMin,
    scaleMax,
    scaleMinLabel: labels?.[0]?.[0] ? String(labels[0][0]) : undefined,
    scaleMaxLabel: labels?.[1]?.[0] ? String(labels[1][0]) : undefined,
  }
}

function extractGridProperties(fieldData: any[]): Partial<QuestionProperties> {
  // Grid rows are in field[4] — each sub-array is a row
  // Grid columns are in field[4][0][1] — same as options
  const rows: string[] = []
  const columns: string[] = []

  if (Array.isArray(fieldData)) {
    // Each entry in fieldData is a row
    for (const row of fieldData) {
      if (Array.isArray(row) && typeof row[0] === "string") {
        rows.push(row[0])
      }
      // Columns come from the first row's options
      if (columns.length === 0 && Array.isArray(row?.[1])) {
        for (const col of row[1]) {
          if (Array.isArray(col) && typeof col[0] === "string") {
            columns.push(col[0])
          }
        }
      }
    }
  }

  return {
    matrixRows: rows.length > 0 ? rows : ["Linha 1"],
    matrixColumns: columns.length > 0 ? columns : ["Coluna 1"],
  }
}

function isRequired(fieldData: any[]): boolean {
  // Required flag is at field[4][0][2] (1 = required, 0 = optional)
  return fieldData?.[0]?.[2] === 1
}

function parseQuestion(
  field: any[],
  index: number,
): { question: ImportedQuestion; warning?: ImportWarning } | null {
  // field structure: [id, title, description, typeId, fieldData, ...]
  const title = field[1] as string | undefined
  const description = field[2] as string | undefined
  const googleTypeId = field[3] as number
  const fieldData = field[4] as any[]

  // Section headers (type 8) don't have fieldData the same way
  if (googleTypeId === 8) {
    return {
      question: {
        type: "statement",
        title: title ?? "Seção",
        description: description,
        required: false,
        order: index,
        properties: { buttonText: "Continuar" },
      },
    }
  }

  const { type, warning } = mapGoogleQuestionType(googleTypeId)

  let properties: QuestionProperties = {}

  // Build properties based on mapped type
  switch (type) {
    case "multiple_choice":
    case "checkbox":
    case "dropdown":
      properties = {
        options: extractOptions(fieldData),
        allowOther: false,
        randomizeOptions: false,
      }
      break
    case "scale":
      properties = extractScaleProperties(fieldData)
      break
    case "matrix":
      properties = extractGridProperties(fieldData)
      break
    case "short_text":
      properties = { placeholder: "Digite sua resposta..." }
      break
    case "long_text":
      properties = { placeholder: "Digite sua resposta..." }
      break
  }

  const question: ImportedQuestion = {
    type,
    title: title ?? "Pergunta importada",
    description: description || undefined,
    required: Array.isArray(fieldData) ? isRequired(fieldData) : false,
    order: index,
    properties,
  }

  const importWarning: ImportWarning | undefined = warning
    ? {
        questionIndex: index,
        originalType: getGoogleTypeName(googleTypeId),
        message: warning,
      }
    : undefined

  return { question, warning: importWarning }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Main Parser ────────────────────────────────────────────────────────────

export async function parseGoogleFormsUrl(url: string): Promise<ImportResult> {
  const normalizedUrl = normalizeGoogleFormsUrl(url)
  if (!normalizedUrl) {
    throw new Error("URL do Google Forms inválida. Use o formato: https://docs.google.com/forms/d/e/.../viewform")
  }

  const html = await fetchFormHtml(normalizedUrl)
  const data = extractFormData(html)

  // data[1][1] = form title, data[1][0] = form description
  // data[1][1] is also the fields array in some structures
  // The actual structure: data[1][8] or similar holds the title
  // Let's be defensive about the structure

  const formInfo = data[1] as unknown[]
  if (!Array.isArray(formInfo)) {
    throw new Error("Estrutura do formulário não reconhecida.")
  }

  const formTitle = (formInfo[8] as string) ?? "Formulário importado"
  const formDescription = (formInfo[0] as string) ?? undefined

  // Fields are in formInfo[1] — array of field arrays
  const fields = formInfo[1]
  if (!Array.isArray(fields)) {
    throw new Error("Nenhuma pergunta encontrada no formulário.")
  }

  if (fields.length > MAX_QUESTIONS) {
    throw new Error(`Este formulário tem ${fields.length} perguntas (máximo: ${MAX_QUESTIONS}).`)
  }

  const questions: ImportedQuestion[] = []
  const warnings: ImportWarning[] = []

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]
    if (!Array.isArray(field)) continue

    const result = parseQuestion(field, questions.length)
    if (result) {
      questions.push(result.question)
      if (result.warning) {
        warnings.push(result.warning)
      }
    }
  }

  if (questions.length === 0) {
    throw new Error("Nenhuma pergunta foi encontrada neste formulário.")
  }

  return {
    title: formTitle,
    description: formDescription,
    questions,
    warnings,
  }
}
