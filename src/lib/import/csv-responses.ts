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
  availableQuestions: QuestionInfo[]
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
  const lower = header.toLowerCase().trim()
  const norm = normalize(header)
  return TIMESTAMP_HEADERS.some((t) => t === lower || t === norm)
}

function isIgnoredHeader(header: string): boolean {
  const lower = header.toLowerCase().trim()
  const norm = normalize(header)
  return IGNORED_HEADERS.some((t) => t === lower || t === norm)
}

/**
 * Calculate similarity between two strings (0 to 1).
 * Uses longest common subsequence ratio.
 */
function similarity(a: string, b: string): number {
  if (a === b) return 1
  if (a.length === 0 || b.length === 0) return 0

  // LCS length
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  return (2 * dp[m][n]) / (m + n)
}

/**
 * Find the best matching question for a CSV header.
 * Strategy (in order of priority):
 * 1. Exact match (case-insensitive, trimmed)
 * 2. Normalized match (no accents, no punctuation)
 * 3. Contains match (header contains question title or vice-versa)
 * 4. Similarity score ≥ 0.6 (fuzzy match)
 */
function findBestMatch(
  header: string,
  questions: QuestionInfo[],
  usedIds: Set<string>,
): QuestionInfo | null {
  const headerLower = header.toLowerCase().trim()
  const headerNorm = normalize(header)

  // 1. Exact match
  for (const q of questions) {
    if (usedIds.has(q.id)) continue
    if (q.title.toLowerCase().trim() === headerLower) return q
  }

  // 2. Normalized match
  for (const q of questions) {
    if (usedIds.has(q.id)) continue
    if (normalize(q.title) === headerNorm) return q
  }

  // 3. Contains match (one contains the other)
  for (const q of questions) {
    if (usedIds.has(q.id)) continue
    const qNorm = normalize(q.title)
    if (qNorm.length >= 3 && headerNorm.length >= 3) {
      if (headerNorm.includes(qNorm) || qNorm.includes(headerNorm)) return q
    }
  }

  // 4. Fuzzy match — best similarity ≥ 0.6
  let bestScore = 0
  let bestMatch: QuestionInfo | null = null

  for (const q of questions) {
    if (usedIds.has(q.id)) continue
    const score = similarity(headerNorm, normalize(q.title))
    if (score > bestScore && score >= 0.6) {
      bestScore = score
      bestMatch = q
    }
  }

  return bestMatch
}

/**
 * Match CSV headers to form questions.
 * Uses multi-strategy matching: exact → normalized → contains → fuzzy.
 */
function matchColumns(
  headers: string[],
  questions: QuestionInfo[],
): { mappings: ColumnMapping[]; timestampCol: number | null; warnings: string[] } {
  const mappings: ColumnMapping[] = []
  const warnings: string[] = []
  let timestampCol: number | null = null
  const usedQuestionIds = new Set<string>()

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]

    // Skip empty headers
    if (!header.trim()) {
      mappings.push({
        csvIndex: i,
        csvHeader: header || "(vazia)",
        questionId: null,
        questionTitle: null,
        questionType: null,
      })
      continue
    }

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

    const match = findBestMatch(header, questions, usedQuestionIds)

    if (match) {
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
      warnings.push(`Coluna "${header}" não foi mapeada a nenhuma pergunta`)
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
    availableQuestions: questions,
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
