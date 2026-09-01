"use client"

import { AutoInsights } from "./auto-insights"
import type { FormAnalytics } from "@/lib/types/form"
import type { QuestionSummary } from "./types"

export function InsightCards({ analytics, questions = [] }: {
  analytics: FormAnalytics
  questions?: QuestionSummary[]
}) {
  return <AutoInsights analytics={analytics} questions={questions} />
}
