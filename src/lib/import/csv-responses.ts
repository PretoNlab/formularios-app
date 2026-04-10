import type { QuestionType } from "@/lib/types/form"
import type { AnswerValue } from "@/lib/db/schema"

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ColumnMapping {
  csvIndex: number
  csvHeader: string
  questionId: string | null
  questionTitle: string | null
  questionType: QuestionType | null
}

export interface CsvPreviewResult {
  totalRows: number
  mappings: ColumnMapping[]
  previewRows: string[][]
  warnings: string[]
  detectedTimestampCol: number | null
}

export interface ParsedCsvRow {
  timestamp: Date | null
  answers: { questionId: string; value: AnswerValue }[]
}

export interface QuestionInfo {
  id: string
  title: string
  type: QuestionType
}

// ─── CSV Parsing ───────────────────────────────────────────────────────────

const MAX_ROWS = 10_000

/**
 * Detect delimiter by counting occurrences in the first line.
 * Brazilian Google Forms CSVs use `;`, international use `,`, TSV uses `\t`.
 */
function detectDelimiter(firstLine: string): string {
  const counts = {
    ";": (firstLine.match(/;/g) ?? []).length,
    ",": (firstLine.match(/,/g) ?? []).length,
    "\t": (firstLine.match(/\t/g) ?? []).length,
  }

  if (counts["\t"] > counts[";"] && counts["\t"] > counts[","]) return "\t"
  if (counts[";"] > counts[","]) return ";"
  return ","
}

/**
 * Strip UTF-8 BOM if present.
 */
function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

/**
 * Parse a single CSV line respecting quoted fields.
 */
function parseCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === delimiter) {
        fields.push(current.trim())
        current = ""
      } else {
        current += ch
      }
    }
  }
  fields.push(current.trim())
  return fields
}

/**
 * Split the CSV content into lines, handling \r\n and \n.
 */
function splitLines(content: string): string[] {
  return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")
}

// ─── Column Matching ───────────────────────────────────────────────────────

/**
 * Normalize a string for fuzzy matching: lowercase, remove accents and punctuation.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .trim()
}

/**
 * Known Google Forms timestamp column headers.
 */
const TIMESTAMP_HEADERS = [
  "carimbo de data/hora",
  "timestamp",
  "carimbo de data hora",
  "data/hora",
]

/**
 * Headers to ignore (not mappable to questions).
 */
const IGNORED_HEADERS = [
  "endereco de e-mail",
  "endereço de e-mail",
  "email address",
  "pontuacao",
  "pontuação",
  "score",
]

function isTimestampHeader(header: string): boolean {
  return TIMESTAMP_HEADERS.includes(normalize(header))
}

function isIgnoredHeader(header: string): boolean {
  return IGNORED_HEADERS.includes(normalize(header))
}

/**
 * Match CSV headers to form questions.
 * Strategy: exact match first, then normalized match.
 */
function matchColumns(
  headers: string[],
  questions: QuestionInfo[],
): { mappings: ColumnMapping[]; timestampCol: number | null; warnings: string[] } {
  const mappings: ColumnMapping[] = []
  const warnings: string[] = []
  let timestampCol: number | null = null

  // Build lookup maps
  const exactMap = new Map<string, QuestionInfo>()
  const normalizedMap = new Map<string, QuestionInfo>()
  const usedQuestionIds = new Set<string>()

  for (const q of questions) {
    exactMap.set(q.title.toLowerCase().trim(), q)
    normalizedMap.set(normalize(q.title), q)
  }

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]

    if (isTimestampHeader(header)) {
      timestampCol = i
      mappings.push({
        csvIndex: i,
        csvHeader: header,
        questionId: null,
        questionTitle: null,
        questionType: null,
      })
      continue
    }

    if (isIgnoredHeader(header)) {
      mappings.push({
        csvIndex: i,
        csvHeader: header,
        questionId: null,
        questionTitle: null,
        questionType: null,
      })
      warnings.push(`Coluna "${header}" ignorada (metadado do Google Forms)`)
      continue
    }

    // Try exact match
    const headerLower = header.toLowerCase().trim()
    let match = exactMap.get(headerLower)

    // Try normalized match
    if (!match) {
      match = normalizedMap.get(normalize(header))
    }

    if (match && !usedQuestionIds.has(match.id)) {
      usedQuestionIds.add(match.id)
      mappings.push({
        csvIndex: i,
        csvHeader: header,
        questionId: match.id,
        questionTitle: match.title,
        questionType: match.type,
      })
    } else {
      mappings.push({
        csvIndex: i,
        csvHeader: header,
        questionId: null,
        questionTitle: null,
        questionType: null,
      })
      if (!match) {
        warnings.push(`Coluna "${header}" não foi mapeada a nenhuma pergunta`)
      }
    }
  }

  const mappedCount = mappings.filter((m) => m.questionId !== null).length
  if (mappedCount === 0) {
    warnings.unshift("Nenhuma coluna foi mapeada. Verifique se os títulos das colunas correspondem aos títulos das perguntas.")
  }

  return { mappings, timestampCol, warnings }
}

// ─── Preview ───────────────────────────────────────────────────────────────

/**
 * Parse CSV and produce a preview with auto-detected mappings.
 */
export function parseCsvPreview(
  csvContent: string,
  questions: QuestionInfo[],
): CsvPreviewResult {
  const clean = stripBom(csvContent)
  const lines = splitLines(clean).filter((l) => l.trim().length > 0)

  if (lines.length < 2) {
    throw new Error("O arquivo CSV precisa ter pelo menos um cabeçalho e uma linha de dados.")
  }

  const delimiter = detectDelimiter(lines[0])
  const headers = parseCsvLine(lines[0], delimiter)

  const totalRows = lines.length - 1
  if (totalRows > MAX_ROWS) {
    throw new Error(`O arquivo tem ${totalRows.toLocaleString("pt-BR")} linhas (máximo: ${MAX_ROWS.toLocaleString("pt-BR")}).`)
  }

  const { mappings, timestampCol, warnings } = matchColumns(headers, questions)

  // Preview first 5 rows
  const previewRows: string[][] = []
  for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
    previewRows.push(parseCsvLine(lines[i], delimiter))
  }

  return {
    totalRows,
    mappings,
    previewRows,
    warnings,
    detectedTimestampCol: timestampCol,
  }
}

// ─── Value Parsing ─────────────────────────────────────────────────────────

/**
 * Parse a date string in multiple formats.
 */
function parseDate(raw: string): Date | null {
  // Try ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
  const isoDate = new Date(raw)
  if (!isNaN(isoDate.getTime())) return isoDate

  // Try DD/MM/YYYY HH:mm:ss (Brazilian format from Google Forms)
  const brMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(\d{1,2}):(\d{2}):?(\d{2})?/)
  if (brMatch) {
    const [, day, month, year, hour, min, sec] = brMatch
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(min),
      parseInt(sec ?? "0"),
    )
  }

  // Try MM/DD/YYYY
  const usMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (usMatch) {
    const [, month, day, year] = usMatch
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }

  return null
}

/**
 * Parse a raw CSV cell value into an AnswerValue based on the question type.
 */
function parseAnswerValue(raw: string, type: QuestionType): AnswerValue {
  const trimmed = raw.trim()
  if (trimmed === "") return null

  switch (type) {
    case "number":
    case "nps": {
      // Handle Brazilian decimal (1.234,56 → 1234.56)
      const cleaned = trimmed.replace(/\./g, "").replace(",", ".")
      const num = parseFloat(cleaned)
      return isNaN(num) ? trimmed : num
    }

    case "rating":
    case "scale":
    case "opinion_scale": {
      const num = parseInt(trimmed, 10)
      return isNaN(num) ? trimmed : num
    }

    case "yes_no": {
      const lower = trimmed.toLowerCase()
      if (["sim", "yes", "1", "true", "verdadeiro"].includes(lower)) return true
      if (["não", "nao", "no", "0", "false", "falso"].includes(lower)) return false
      return trimmed
    }

    case "checkbox": {
      // Google Forms exports checkboxes as "Option A; Option B"
      // Also handle comma-separated
      if (trimmed.includes(";")) {
        return trimmed.split(";").map((s) => s.trim()).filter(Boolean)
      }
      return [trimmed]
    }

    case "date": {
      const date = parseDate(trimmed)
      return date ? date.toISOString().split("T")[0] : trimmed
    }

    case "matrix": {
      // Matrix responses from Google Forms are typically in a single cell
      // Keep as string — the format varies too much
      return trimmed
    }

    case "file_upload": {
      // Skip file upload values — can't import external URLs meaningfully
      return null
    }

    default:
      return trimmed
  }
}

// ─── Full Parse ────────────────────────────────────────────────────────────

/**
 * Parse all CSV rows using confirmed mappings.
 */
export function parseCsvRows(
  csvContent: string,
  mappings: ColumnMapping[],
  timestampColIndex: number | null,
): { rows: ParsedCsvRow[]; errors: { row: number; message: string }[] } {
  const clean = stripBom(csvContent)
  const lines = splitLines(clean).filter((l) => l.trim().length > 0)
  const delimiter = detectDelimiter(lines[0])

  const rows: ParsedCsvRow[] = []
  const errors: { row: number; message: string }[] = []

  const activeMappings = mappings.filter((m) => m.questionId !== null)

  for (let i = 1; i < lines.length; i++) {
    try {
      const cells = parseCsvLine(lines[i], delimiter)

      let timestamp: Date | null = null
      if (timestampColIndex !== null && cells[timestampColIndex]) {
        timestamp = parseDate(cells[timestampColIndex])
      }

      const answers: { questionId: string; value: AnswerValue }[] = []

      for (const mapping of activeMappings) {
        const raw = cells[mapping.csvIndex] ?? ""
        if (raw.trim() === "") continue

        const value = parseAnswerValue(raw, mapping.questionType!)
        if (value !== null) {
          answers.push({ questionId: mapping.questionId!, value })
        }
      }

      // Skip rows with no answers at all
      if (answers.length > 0) {
        rows.push({ timestamp, answers })
      }
    } catch {
      errors.push({ row: i + 1, message: `Erro ao processar linha ${i + 1}` })
    }
  }

  return { rows, errors }
}
