import type { QuestionType } from "@/lib/types/form"

export interface QuestionSummary {
  id: string
  title: string
  description?: string | null
  type: QuestionType
  order: number
}
