import type { QuestionType } from "@/lib/types/form"

export interface QuestionSummary {
  id: string
  title: string
  type: QuestionType
  order: number
}
