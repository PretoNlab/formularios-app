import type { QuestionType } from "@/lib/types/form"

interface TypeMappingResult {
  type: QuestionType
  warning?: string
}

// Google Forms question type IDs → our QuestionType
const GOOGLE_TYPE_MAP: Record<number, QuestionType> = {
  0: "short_text",      // SHORT_ANSWER
  1: "long_text",        // PARAGRAPH
  2: "multiple_choice",  // RADIO
  3: "dropdown",         // DROPDOWN
  4: "checkbox",         // CHECKBOX
  5: "scale",            // LINEAR_SCALE
  7: "matrix",           // GRID
  9: "date",             // DATE
  10: "short_text",      // TIME (no native time field)
  13: "file_upload",     // FILE_UPLOAD
}

const GOOGLE_TYPES_WITH_WARNINGS: Record<number, string> = {
  7: "Tipo 'Grade' importado como matriz. Revise as linhas e colunas no builder.",
  10: "Tipo 'Hora' não é suportado nativamente. Importado como texto curto.",
  11: "Tipo 'Imagem' importado como declaração.",
}

// Readable names for warning messages
const GOOGLE_TYPE_NAMES: Record<number, string> = {
  0: "SHORT_ANSWER",
  1: "PARAGRAPH",
  2: "RADIO",
  3: "DROPDOWN",
  4: "CHECKBOX",
  5: "LINEAR_SCALE",
  7: "GRID",
  8: "SECTION",
  9: "DATE",
  10: "TIME",
  11: "IMAGE",
  13: "FILE_UPLOAD",
}

export function mapGoogleQuestionType(googleTypeId: number): TypeMappingResult {
  // Section headers → statement
  if (googleTypeId === 8) {
    return { type: "statement" }
  }

  const type = GOOGLE_TYPE_MAP[googleTypeId]
  if (!type) {
    return {
      type: "statement",
      warning: `Tipo Google Forms "${GOOGLE_TYPE_NAMES[googleTypeId] ?? `#${googleTypeId}`}" não reconhecido. Importado como declaração.`,
    }
  }

  return {
    type,
    warning: GOOGLE_TYPES_WITH_WARNINGS[googleTypeId],
  }
}

export function getGoogleTypeName(googleTypeId: number): string {
  return GOOGLE_TYPE_NAMES[googleTypeId] ?? `UNKNOWN_${googleTypeId}`
}
