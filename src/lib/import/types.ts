import type { QuestionType, QuestionProperties } from "@/lib/types/form"

export interface ImportedQuestion {
  type: QuestionType
  title: string
  description?: string
  required: boolean
  order: number
  properties: QuestionProperties
}

export interface ImportResult {
  title: string
  description?: string
  questions: ImportedQuestion[]
  warnings: ImportWarning[]
}

export interface ImportWarning {
  questionIndex: number
  originalType: string
  message: string
}
