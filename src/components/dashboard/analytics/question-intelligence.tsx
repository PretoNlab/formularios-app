"use client"

import { useState, useMemo } from "react"
import { ListOrdered, TrendingDown, BarChart2 } from "lucide-react"
import type { FormAnalytics, QuestionAnalytics, AnalyticsPeriod } from "@/lib/types/form"
import type { QuestionSummary } from "./types"
import { NPSHighlight } from "./nps-highlight"
import { QuestionCard } from "./question-viz/question-card"
import { Button } from "@/components/ui/button"

type SortOption = "form_order" | "dropoff" | "answers"

export function QuestionIntelligence({
  formId,
  period,
  questionStats,
  questions,
  dropoffByQuestion,
  shareToken,
}: {
  formId: string
  period: AnalyticsPeriod
  questionStats: QuestionAnalytics[]
  questions: QuestionSummary[]
  dropoffByQuestion: FormAnalytics["dropoffByQuestion"]
  shareToken?: string | null
}) {
  const [sortBy, setSortBy] = useState<SortOption>("form_order")

  const dropoffMap = useMemo(() => {
    return new Map(dropoffByQuestion.map((d) => [d.questionId, d.dropoffRate]))
  }, [dropoffByQuestion])

  const orderMap = useMemo(() => {
    return new Map(questions.map((q) => [q.id, q.order]))
  }, [questions])

  const npsStats = useMemo(() => {
    return questionStats.filter((s) => s.npsScore !== undefined)
  }, [questionStats])

  const sortedStats = useMemo(() => {
    const list = [...questionStats]
    if (sortBy === "dropoff") {
      return list.sort((a, b) => {
        const da = dropoffMap.get(a.questionId) ?? 0
        const db = dropoffMap.get(b.questionId) ?? 0
        return db - da
      })
    }
    if (sortBy === "answers") {
      return list.sort((a, b) => b.totalAnswers - a.totalAnswers)
    }
    // "form_order" default
    return list.sort((a, b) => {
      const oa = orderMap.get(a.questionId) ?? 999
      const ob = orderMap.get(b.questionId) ?? 999
      return oa - ob
    })
  }, [questionStats, sortBy, dropoffMap, orderMap])

  if (questionStats.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm rounded-2xl border border-border/40 bg-card shadow-xs">
        Sem dados suficientes para análise por pergunta.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {npsStats.length > 0 && <NPSHighlight npsStats={npsStats} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="text-xs text-muted-foreground">
          Exibindo <span className="font-semibold text-foreground">{questionStats.length}</span> pergunta{questionStats.length !== 1 ? "s" : ""}
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/30 w-fit">
          <Button
            type="button"
            variant={sortBy === "form_order" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSortBy("form_order")}
            className="h-7 text-xs px-2.5 gap-1.5 rounded-lg"
          >
            <ListOrdered className="h-3.5 w-3.5 text-muted-foreground" />
            Ordem do formulário
          </Button>
          <Button
            type="button"
            variant={sortBy === "dropoff" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSortBy("dropoff")}
            className="h-7 text-xs px-2.5 gap-1.5 rounded-lg"
          >
            <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
            Maior abandono
          </Button>
          <Button
            type="button"
            variant={sortBy === "answers" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSortBy("answers")}
            className="h-7 text-xs px-2.5 gap-1.5 rounded-lg"
          >
            <BarChart2 className="h-3.5 w-3.5 text-muted-foreground" />
            Mais respondidas
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {sortedStats.map((stat) => {
          const q = questions.find((x) => x.id === stat.questionId)
          const order = q?.order !== undefined ? q.order + 1 : "?"
          const dropoffRate = dropoffMap.get(stat.questionId) ?? 0
          const criticality: "high" | "medium" | "ok" =
            dropoffRate > 0.4 ? "high" : dropoffRate > 0.2 ? "medium" : "ok"
          return (
            <QuestionCard
              key={stat.questionId}
              formId={formId}
              period={period}
              stat={stat}
              order={order}
              criticality={criticality}
              dropoffRate={dropoffRate}
              shareToken={shareToken}
            />
          )
        })}
      </div>
    </div>
  )
}
