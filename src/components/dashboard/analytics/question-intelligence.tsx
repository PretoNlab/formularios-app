import type { FormAnalytics, QuestionAnalytics } from "@/lib/types/form"
import type { QuestionSummary } from "./types"
import { NPSHighlight } from "./nps-highlight"
import { QuestionCard } from "./question-viz/question-card"

export function QuestionIntelligence({ questionStats, questions, dropoffByQuestion }: {
  questionStats: QuestionAnalytics[]
  questions: QuestionSummary[]
  dropoffByQuestion: FormAnalytics["dropoffByQuestion"]
}) {
  if (questionStats.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm rounded-xl border bg-card">
        Sem dados suficientes para análise por pergunta.
      </div>
    )
  }

  const dropoffMap = new Map(dropoffByQuestion.map((d) => [d.questionId, d.dropoffRate]))

  const npsStats = questionStats.filter((s) => s.npsScore !== undefined)

  const sorted = [...questionStats].sort((a, b) => {
    const da = dropoffMap.get(a.questionId) ?? 0
    const db = dropoffMap.get(b.questionId) ?? 0
    return db - da
  })

  return (
    <div>
      {npsStats.length > 0 && <NPSHighlight npsStats={npsStats} />}
      <div className="space-y-4">
        {sorted.map((stat) => {
          const q = questions.find((x) => x.id === stat.questionId)
          const order = q?.order !== undefined ? q.order + 1 : "?"
          const dropoffRate = dropoffMap.get(stat.questionId) ?? 0
          const criticality: "high" | "medium" | "ok" =
            dropoffRate > 0.4 ? "high" : dropoffRate > 0.2 ? "medium" : "ok"
          return (
            <QuestionCard
              key={stat.questionId}
              stat={stat}
              order={order}
              criticality={criticality}
              dropoffRate={dropoffRate}
            />
          )
        })}
      </div>
    </div>
  )
}
