"use client"

import { useState, useTransition, useEffect } from "react"
import { Smartphone } from "lucide-react"
import type { AnalyticsPeriod, FormAnalytics } from "@/lib/types/form"
import { getAnalyticsForPeriodAction } from "@/app/actions/responses"
import { pct, formatDuration } from "./utils"
import type { QuestionSummary } from "./types"
import { PeriodSelector } from "./period-selector"
import { InsightCards } from "./insight-cards"
import { QuestionIntelligence } from "./question-intelligence"
import { MiniBarChart } from "./charts/mini-bar-chart"
import { DeviceBreakdown } from "./charts/device-breakdown"
import { HourHeatmap } from "./charts/hour-heatmap"
import { UTMComparison } from "./charts/utm-comparison"
import { AutoInsights } from "./auto-insights"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const PERIOD_LABEL: Record<AnalyticsPeriod, string> = {
  "7d": "últimos 7 dias",
  "30d": "últimos 30 dias",
  "90d": "últimos 90 dias",
  "all": "todo o período",
}

export function AnalyticsView({
  formId,
  initialAnalytics,
  initialPeriod = "30d",
  questions,
  answerFilter,
}: {
  formId: string
  initialAnalytics: FormAnalytics | null
  initialPeriod?: AnalyticsPeriod
  questions: QuestionSummary[]
  answerFilter?: { questionId: string; value: string } | null
}) {
  const [period, setPeriod] = useState<AnalyticsPeriod>(initialPeriod)
  const [analytics, setAnalytics] = useState<FormAnalytics | null>(initialAnalytics)
  const [isPending, startTransition] = useTransition()
  const [viewMode, setViewMode] = useState<"overview" | "questions">("questions")

  function handlePeriodChange(next: AnalyticsPeriod) {
    setPeriod(next)
    startTransition(async () => {
      const res = await getAnalyticsForPeriodAction(formId, next, answerFilter)
      if (res.success && res.data) setAnalytics(res.data)
    })
  }

  useEffect(() => {
    startTransition(async () => {
      const res = await getAnalyticsForPeriodAction(formId, period, answerFilter)
      if (res.success && res.data) setAnalytics(res.data)
    })
  }, [answerFilter, formId, period])

  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm rounded-xl border bg-card">
        Dados analíticos não disponíveis.
      </div>
    )
  }

  const completionRate = analytics.completionRate

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="w-full sm:w-auto">
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex h-auto p-1">
            <TabsTrigger value="questions" className="py-2">Resultados por Pergunta</TabsTrigger>
            <TabsTrigger value="overview" className="py-2">Análise de Performance</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <PeriodSelector value={period} onChange={handlePeriodChange} isPending={isPending} />
          <span className="text-xs text-muted-foreground hidden sm:block">
            {analytics.totalResponses} respostas · {PERIOD_LABEL[period]}
          </span>
        </div>
      </div>

      <div className={isPending ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
        {viewMode === "overview" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <InsightCards analytics={analytics} questions={questions} />
            
            <div className="mt-6">
              <AutoInsights analytics={analytics} />
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold mb-4">Respostas nos {PERIOD_LABEL[period]}</h3>
                <MiniBarChart data={analytics.responsesByDay} period={period} />
              </div>

              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold mb-4">Abandono por pergunta</h3>
                {analytics.dropoffByQuestion.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados suficientes.</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.dropoffByQuestion.slice(0, 8).map((d) => {
                      const q = questions.find((x) => x.id === d.questionId)
                      const answered = 1 - d.dropoffRate
                      return (
                        <div key={d.questionId}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={q?.title ?? d.questionId}>
                              {q?.title ?? d.questionId}
                            </span>
                            <span className={`text-xs font-semibold tabular-nums ${
                              answered < 0.6 ? "text-red-600" : answered < 0.8 ? "text-amber-600" : "text-green-600"
                            }`}>
                              {pct(answered)}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                answered < 0.6 ? "bg-red-400" : answered < 0.8 ? "bg-amber-400" : "bg-primary"
                              }`}
                              style={{ width: `${answered * 100}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold mb-4">Taxa de conclusão</h3>
                <div className="flex items-center gap-6">
                  <div className="relative h-24 w-24 shrink-0">
                    <svg viewBox="0 0 36 36" className="rotate-[-90deg]" width="96" height="96">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.9" fill="none"
                        stroke={completionRate >= 0.75 ? "#22c55e" : completionRate >= 0.5 ? "#f59e0b" : "#ef4444"}
                        strokeWidth="3"
                        strokeDasharray={`${completionRate * 100} 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                      {pct(completionRate)}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p>{analytics.totalResponses} respostas totais</p>
                    <p className="text-green-600">{Math.round(analytics.totalResponses * completionRate)} concluídas</p>
                    <p className="text-red-500">{Math.round(analytics.totalResponses * (1 - completionRate))} abandonadas</p>
                    {analytics.mobilePercentage > 0 && (
                      <p className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        {pct(analytics.mobilePercentage)} mobile
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold mb-4">Tempo médio de conclusão</h3>
                {analytics.averageCompletionTime > 0 ? (
                  <span className="text-5xl font-bold">{formatDuration(analytics.averageCompletionTime)}</span>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem dados suficientes para calcular.</p>
                )}
              </div>

              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold mb-4">Dispositivos</h3>
                <DeviceBreakdown data={analytics.deviceBreakdown} />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6 mt-6">
              <h3 className="font-semibold mb-1">Quando as pessoas respondem</h3>
              <p className="text-xs text-muted-foreground mb-5">Dia da semana × hora do dia (horário de Brasília)</p>
              <HourHeatmap data={analytics.responsesByHour} />
            </div>

            <div className="rounded-xl border bg-card p-6 mt-6">
              <h3 className="font-semibold mb-1">Performance por canal de origem</h3>
              <p className="text-xs text-muted-foreground mb-5">Taxa de conclusão e tempo médio por fonte de tráfego</p>
              <UTMComparison data={analytics.sourceBreakdown} />
            </div>
          </div>
        )}

        {viewMode === "questions" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <QuestionIntelligence
              formId={formId}
              period={period}
              questionStats={analytics.questionStats}
              questions={questions}
              dropoffByQuestion={analytics.dropoffByQuestion}
            />
          </div>
        )}
      </div>
    </div>
  )
}
