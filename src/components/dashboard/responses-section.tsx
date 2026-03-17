"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Link from "next/link"
import {
  ArrowLeft, Eye, Users, TrendingUp, Clock,
  CheckCircle2, Circle, Copy, ExternalLink, Download,
  Smartphone, AlertTriangle, BarChart2, Sparkles, Loader2,
  Filter, X, ChevronLeft, ChevronRight, Monitor, Tablet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { FormAnalytics, QuestionAnalytics, QuestionType } from "@/lib/types/form"
import type { ResponseWithAnswers } from "@/lib/db/queries/responses"
import { exportResponsesAction } from "@/app/actions/responses"
import { analyzeTextResponsesAction, type TextAnalysisResult } from "@/app/actions/ai-analysis"

// ─── Props ────────────────────────────────────────────────────────────────────

interface QuestionSummary {
  id: string
  title: string
  type: QuestionType
  order: number
}

interface ResponsesSectionProps {
  formId: string
  formTitle: string
  formStatus: string
  formSlug: string
  questions: QuestionSummary[]
  responses: ResponseWithAnswers[]
  analytics: FormAnalytics | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(date))
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType; label: string; value: string; sub?: string
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

// ─── Insight Cards ────────────────────────────────────────────────────────────

function InsightCards({ analytics, questions }: {
  analytics: FormAnalytics
  questions: QuestionSummary[]
}) {
  const insights: { icon: React.ElementType; color: string; bg: string; text: string }[] = []

  if (analytics.completionRate >= 0.75) {
    insights.push({
      icon: TrendingUp, color: "text-green-700", bg: "bg-green-50 border-green-100",
      text: `Taxa de conclusão excelente: ${pct(analytics.completionRate)} dos respondentes completam o formulário.`,
    })
  } else if (analytics.completionRate < 0.5 && analytics.totalResponses > 5) {
    insights.push({
      icon: AlertTriangle, color: "text-amber-700", bg: "bg-amber-50 border-amber-100",
      text: `Menos da metade conclui o formulário (${pct(analytics.completionRate)}). Considere simplificar ou encurtar.`,
    })
  }

  const worstDropoff = analytics.dropoffByQuestion
    .filter((d) => d.dropoffRate > 0.3)
    .sort((a, b) => b.dropoffRate - a.dropoffRate)[0]
  if (worstDropoff) {
    const q = questions.find((x) => x.id === worstDropoff.questionId)
    if (q) {
      insights.push({
        icon: AlertTriangle, color: "text-red-700", bg: "bg-red-50 border-red-100",
        text: `${pct(worstDropoff.dropoffRate)} abandonam na pergunta "${q.title}". Pode estar confusa ou longa.`,
      })
    }
  }

  if (analytics.mobilePercentage > 0.55) {
    insights.push({
      icon: Smartphone, color: "text-blue-700", bg: "bg-blue-50 border-blue-100",
      text: `${pct(analytics.mobilePercentage)} dos respondentes usam celular. Prefira campos de seleção a texto livre.`,
    })
  }

  const npsQuestion = analytics.questionStats.find(
    (q) => q.questionType === "nps" && q.npsScore !== undefined
  )
  if (npsQuestion && npsQuestion.npsScore !== undefined) {
    const score = npsQuestion.npsScore
    const sentiment = score >= 50 ? "excelente" : score >= 0 ? "razoável" : "precisa de atenção"
    const color = score >= 50 ? "text-green-700" : score >= 0 ? "text-amber-700" : "text-red-700"
    const bg = score >= 50 ? "bg-green-50 border-green-100" : score >= 0 ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100"
    insights.push({
      icon: BarChart2, color, bg,
      text: `Seu NPS é ${score} — ${sentiment}. ${npsQuestion.npsPromoters}% promotores, ${npsQuestion.npsDetractors}% detratores.`,
    })
  }

  if (analytics.totalResponses < 3) {
    insights.push({
      icon: Users, color: "text-muted-foreground", bg: "bg-muted/30 border-muted",
      text: "Ainda há poucas respostas para gerar insights. Compartilhe o link do formulário para coletar mais dados.",
    })
  }

  if (insights.length === 0) return null

  return (
    <div className="space-y-2 mb-6">
      {insights.map((ins, i) => (
        <div key={i} className={`flex items-start gap-3 rounded-xl border p-4 ${ins.bg}`}>
          <ins.icon className={`h-4 w-4 mt-0.5 shrink-0 ${ins.color}`} />
          <p className={`text-sm leading-relaxed ${ins.color}`}>{ins.text}</p>
        </div>
      ))}
    </div>
  )
}

// ─── NPS Visualization ────────────────────────────────────────────────────────

function NpsViz({ stat }: { stat: QuestionAnalytics }) {
  const score = stat.npsScore ?? 0
  const promoters = stat.npsPromoters ?? 0
  const passives = stat.npsPassives ?? 0
  const detractors = stat.npsDetractors ?? 0
  const scoreColor = score >= 50 ? "text-green-600" : score >= 0 ? "text-amber-600" : "text-red-600"

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <span className={`text-5xl font-bold tabular-nums ${scoreColor}`}>{score}</span>
        <span className="text-sm text-muted-foreground mb-1.5">NPS Score</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        <div className="bg-red-400 transition-all" style={{ width: `${detractors}%` }} title={`Detratores: ${detractors}%`} />
        <div className="bg-yellow-400 transition-all" style={{ width: `${passives}%` }} title={`Passivos: ${passives}%`} />
        <div className="bg-green-500 transition-all" style={{ width: `${promoters}%` }} title={`Promotores: ${promoters}%`} />
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-400 inline-block" />Detratores {detractors}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-yellow-400 inline-block" />Passivos {passives}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />Promotores {promoters}%
        </span>
      </div>
      {stat.distribution && (
        <div className="flex gap-1 flex-wrap pt-1">
          {stat.distribution.map((d) => (
            <div key={d.value} className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-muted-foreground tabular-nums">{d.count}</span>
              <div className={`h-6 w-6 rounded flex items-center justify-center text-[10px] font-semibold ${
                d.value >= 9 ? "bg-green-100 text-green-700" :
                d.value >= 7 ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }`}>
                {d.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Numeric Visualization ────────────────────────────────────────────────────

function NumericViz({ stat }: { stat: QuestionAnalytics }) {
  const dist = stat.distribution ?? []
  const max = Math.max(...dist.map((d) => d.count), 1)

  return (
    <div className="space-y-4">
      <div className="flex gap-6 text-sm">
        <div>
          <p className="text-2xl font-bold tabular-nums">{stat.average}</p>
          <p className="text-xs text-muted-foreground">média</p>
        </div>
        <div className="text-muted-foreground text-xs flex flex-col justify-end pb-0.5 gap-1">
          <span>mín: {stat.min}</span>
          <span>máx: {stat.max}</span>
        </div>
      </div>
      {dist.length > 0 && (
        <div className="flex items-end gap-1.5 h-16">
          {dist.map((d) => (
            <div key={d.value} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
              <div
                className="w-full rounded-t bg-primary/70 transition-all"
                style={{ height: `${(d.count / max) * 52}px`, minHeight: d.count > 0 ? "4px" : "0" }}
                title={`${d.value}: ${d.count}`}
              />
              <span className="text-[10px] text-muted-foreground tabular-nums">{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Choice Visualization ─────────────────────────────────────────────────────

function ChoiceViz({ stat }: { stat: QuestionAnalytics }) {
  const options = stat.optionCounts ?? []
  const maxCount = Math.max(...options.map((o) => o.count), 1)

  return (
    <div className="space-y-2.5">
      {options.slice(0, 8).map((opt) => (
        <div key={opt.option}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm truncate max-w-[70%]">{opt.option || "—"}</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums shrink-0">
              <span className="font-medium text-foreground">{pct(opt.percentage)}</span>
              <span>{opt.count}</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(opt.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Text Visualization with AI ───────────────────────────────────────────────

const AI_TEXT_TYPES = new Set(["short_text", "long_text", "email", "url", "phone", "whatsapp", "cpf", "cnpj"])

function TextViz({ stat, formId }: { stat: QuestionAnalytics; formId: string }) {
  const [aiResult, setAiResult] = useState<TextAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const canAnalyze = AI_TEXT_TYPES.has(stat.questionType) && stat.totalAnswers >= 3

  async function handleAnalyze() {
    setIsAnalyzing(true)
    setAiError(null)
    const res = await analyzeTextResponsesAction(formId, stat.questionId)
    if (res.success) {
      setAiResult(res.data)
    } else {
      setAiError(res.error)
    }
    setIsAnalyzing(false)
  }

  return (
    <div className="space-y-3">
      {/* Sample responses */}
      <div className="space-y-2">
        {(stat.textSamples ?? []).map((text, i) => (
          <div key={i} className="rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-sm text-foreground/80 line-clamp-2">{text}</p>
          </div>
        ))}
        {stat.totalAnswers > 5 && (
          <p className="text-xs text-muted-foreground text-right">
            +{stat.totalAnswers - 5} respostas adicionais
          </p>
        )}
      </div>

      {/* AI Analysis */}
      {!aiResult && canAnalyze && (
        <div className="pt-1">
          <Button
            size="sm"
            variant="outline"
            className="gap-2 w-full text-xs border-dashed"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />Analisando com IA...</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5 text-violet-500" />Analisar respostas com IA</>
            )}
          </Button>
          {aiError && <p className="text-xs text-red-500 mt-2">{aiError}</p>}
        </div>
      )}

      {aiResult && <AIAnalysisView result={aiResult} />}
    </div>
  )
}

// ─── AI Analysis Result View ──────────────────────────────────────────────────

function AIAnalysisView({ result }: { result: TextAnalysisResult }) {
  const { positive, neutral, negative } = result.sentiment

  return (
    <div className="space-y-4 pt-2 border-t mt-2">
      {/* Header */}
      <div className="flex items-center gap-1.5 text-xs text-violet-600 font-medium">
        <Sparkles className="h-3.5 w-3.5" />
        Análise com IA · {result.totalAnswers} respostas
      </div>

      {/* Summary */}
      <p className="text-sm text-foreground/80 leading-relaxed italic">"{result.summary}"</p>

      {/* Sentiment bar */}
      <div>
        <p className="text-xs text-muted-foreground mb-1.5 font-medium">Sentimento</p>
        <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
          {positive > 0 && <div className="bg-green-500 transition-all" style={{ width: `${positive * 100}%` }} title={`Positivo: ${pct(positive)}`} />}
          {neutral > 0 && <div className="bg-slate-300 transition-all" style={{ width: `${neutral * 100}%` }} title={`Neutro: ${pct(neutral)}`} />}
          {negative > 0 && <div className="bg-red-400 transition-all" style={{ width: `${negative * 100}%` }} title={`Negativo: ${pct(negative)}`} />}
        </div>
        <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
          {positive > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500 inline-block" />Positivo {pct(positive)}</span>}
          {neutral > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300 inline-block" />Neutro {pct(neutral)}</span>}
          {negative > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400 inline-block" />Negativo {pct(negative)}</span>}
        </div>
      </div>

      {/* Themes */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 font-medium">Temas identificados</p>
        <div className="space-y-2.5">
          {result.themes.map((theme) => (
            <div key={theme.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium truncate max-w-[65%]">{theme.label}</span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <span className="font-medium text-foreground">{pct(theme.percentage)}</span>
                  <span>{theme.count}</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-500/70 transition-all duration-500"
                  style={{ width: `${theme.percentage * 100}%` }}
                />
              </div>
              {theme.examples.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                  ex: "{theme.examples[0]}"
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Keywords */}
      {result.keywords.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">Palavras-chave</p>
          <div className="flex flex-wrap gap-1.5">
            {result.keywords.map((kw, i) => (
              <span
                key={kw}
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ opacity: 1 - i * 0.08, backgroundColor: "hsl(var(--muted))" }}
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Question Card ────────────────────────────────────────────────────────────

const CRITICALITY_BADGE = {
  high: { label: "Alta atenção", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  medium: { label: "Observar", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  ok: { label: "OK", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
}

function QuestionCard({ stat, order, formId, criticality, dropoffRate }: {
  stat: QuestionAnalytics
  order: number | string
  formId: string
  criticality?: "high" | "medium" | "ok"
  dropoffRate?: number
}) {
  const badge = criticality ? CRITICALITY_BADGE[criticality] : null

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-xs font-semibold text-muted-foreground bg-muted rounded-md px-2 py-1 shrink-0 tabular-nums">
            {order}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight line-clamp-2">{stat.questionTitle || "Sem título"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stat.totalAnswers} resposta{stat.totalAnswers !== 1 ? "s" : ""}
              {dropoffRate && dropoffRate > 0.1
                ? <span className="text-red-500"> · {pct(dropoffRate)} abandonaram aqui</span>
                : null}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
              {badge.label}
            </span>
          )}
          {stat.skipRate > 0.1 && (
            <span className="text-xs text-muted-foreground">{pct(stat.skipRate)} pularam</span>
          )}
        </div>
      </div>

      {stat.npsScore !== undefined ? (
        <NpsViz stat={stat} />
      ) : stat.distribution && stat.average !== undefined ? (
        <NumericViz stat={stat} />
      ) : stat.optionCounts && stat.optionCounts.length > 0 ? (
        <ChoiceViz stat={stat} />
      ) : (
        <TextViz stat={stat} formId={formId} />
      )}
    </div>
  )
}

// ─── Question Intelligence Tab ────────────────────────────────────────────────

function QuestionIntelligence({ questionStats, questions, formId, dropoffByQuestion, totalResponses }: {
  questionStats: QuestionAnalytics[]
  questions: QuestionSummary[]
  formId: string
  dropoffByQuestion: FormAnalytics["dropoffByQuestion"]
  totalResponses: number
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
      <DropoffFunnel dropoff={dropoffByQuestion} questions={questions} totalResponses={totalResponses} />
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
            formId={formId}
            criticality={criticality}
            dropoffRate={dropoffRate}
          />
        )
      })}
      </div>
    </div>
  )
}

// ─── Source Breakdown ─────────────────────────────────────────────────────────

function SourceBreakdown({ data }: { data: FormAnalytics["sourceBreakdown"] }) {
  const max = Math.max(...data.map((d) => d.count), 1)

  function trimSource(source: string): string {
    try {
      const url = new URL(source.startsWith("http") ? source : `https://${source}`)
      return url.hostname.replace(/^www\./, "")
    } catch {
      return source.length > 32 ? source.slice(0, 32) + "…" : source
    }
  }

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem dados de origem ainda.</p>
  }

  return (
    <div className="space-y-2.5">
      {data.slice(0, 6).map((row) => (
        <div key={row.source}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm truncate max-w-[60%]">{trimSource(row.source)}</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums shrink-0">
              <span className="font-medium text-foreground">{pct(row.percentage)}</span>
              <span>{row.count}</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/70 transition-all duration-500"
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Device Breakdown ─────────────────────────────────────────────────────────

const DEVICE_LABELS: Record<string, string> = {
  desktop: "Desktop",
  mobile: "Mobile",
  tablet: "Tablet",
  unknown: "Desconhecido",
}

const DEVICE_COLORS: Record<string, string> = {
  desktop: "bg-blue-500",
  mobile: "bg-emerald-500",
  tablet: "bg-violet-500",
  unknown: "bg-muted-foreground/40",
}

function DeviceBreakdown({ data }: { data: FormAnalytics["deviceBreakdown"] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem dados de dispositivo ainda.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {data.map((row) => (
          <div
            key={row.device}
            className={`transition-all ${DEVICE_COLORS[row.device] ?? "bg-muted"}`}
            style={{ width: `${row.percentage * 100}%` }}
            title={`${DEVICE_LABELS[row.device] ?? row.device}: ${pct(row.percentage)}`}
          />
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        {data.map((row) => (
          <div key={row.device} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full inline-block ${DEVICE_COLORS[row.device] ?? "bg-muted"}`} />
              {DEVICE_LABELS[row.device] ?? row.device}
            </span>
            <span className="text-muted-foreground tabular-nums text-xs">
              {pct(row.percentage)} · {row.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────

function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Sem dados no período.
      </div>
    )
  }

  const max = Math.max(...data.map((d) => d.count), 1)
  const today = new Date()
  const days: { date: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.push({ date: key, count: data.find((x) => x.date === key)?.count ?? 0 })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-0.5 h-24">
        {days.map((d) => (
          <div
            key={d.date}
            title={`${d.date}: ${d.count} resposta${d.count !== 1 ? "s" : ""}`}
            className="flex-1 rounded-sm transition-all cursor-default"
            style={{
              height: d.count === 0 ? "4px" : `${(d.count / max) * 100}%`,
              backgroundColor: d.count === 0 ? "hsl(var(--muted))" : "hsl(var(--primary))",
              opacity: d.count === 0 ? 0.3 : 0.85,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{days[0].date.slice(5).replace("-", "/")}</span>
        <span>hoje</span>
      </div>
    </div>
  )
}

// ─── Dropoff Funnel ───────────────────────────────────────────────────────────

function DropoffFunnel({ dropoff, questions, totalResponses }: {
  dropoff: FormAnalytics["dropoffByQuestion"]
  questions: QuestionSummary[]
  totalResponses: number
}) {
  if (dropoff.length === 0 || totalResponses === 0) return null

  const dropoffMap = new Map(dropoff.map((d) => [d.questionId, d.dropoffRate]))

  const ordered = [...questions]
    .filter((q) => dropoffMap.has(q.id))
    .sort((a, b) => a.order - b.order)

  if (ordered.length === 0) return null

  return (
    <div className="rounded-xl border bg-card p-6 mb-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold">Funil de conclusão</h3>
        <span className="text-xs text-muted-foreground">{totalResponses} respondentes</span>
      </div>
      <p className="text-xs text-muted-foreground mb-5">% que chegou a cada pergunta</p>

      <div className="space-y-3">
        {ordered.map((q, i) => {
          const dropoffRate = dropoffMap.get(q.id) ?? 0
          const answeredRate = 1 - dropoffRate
          const count = Math.round(answeredRate * totalResponses)
          const isBottleneck = i > 0 && dropoffRate > 0.15
          const barColor =
            answeredRate >= 0.8 ? "bg-emerald-500" :
            answeredRate >= 0.6 ? "bg-amber-400" : "bg-red-400"
          const textColor =
            answeredRate >= 0.8 ? "text-emerald-600" :
            answeredRate >= 0.6 ? "text-amber-600" : "text-red-600"

          // Cascade: indent bar slightly per step to give funnel shape
          const indent = Math.round(i * 1.2)

          return (
            <div key={q.id}>
              <div className="flex items-center justify-between mb-1 gap-2">
                <span className="text-xs text-muted-foreground truncate flex-1">
                  {i + 1}. {q.title || "Pergunta sem título"}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {isBottleneck && (
                    <span className="text-[10px] font-medium text-red-500 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded-full">
                      −{pct(dropoffRate)} aqui
                    </span>
                  )}
                  <span className={`text-xs font-semibold tabular-nums ${textColor}`}>
                    {pct(answeredRate)}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
                    {count}
                  </span>
                </div>
              </div>
              <div
                className="h-7 bg-muted rounded-lg overflow-hidden"
                style={{ marginLeft: `${indent}px` }}
              >
                <div
                  className={`h-full ${barColor} rounded-lg transition-all duration-700`}
                  style={{ width: `${Math.max(answeredRate * 100, 1)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── NPS Highlight Card ───────────────────────────────────────────────────────

function NPSHighlight({ npsStats }: { npsStats: QuestionAnalytics[] }) {
  if (npsStats.length === 0) return null
  const main = npsStats[0]
  const score = main.npsScore ?? 0
  const promoters = main.npsPromoters ?? 0
  const passives = main.npsPassives ?? 0
  const detractors = main.npsDetractors ?? 0

  const scoreColor = score >= 50 ? "text-emerald-600" : score >= 0 ? "text-amber-600" : "text-red-600"
  const ringColor = score >= 50 ? "#22c55e" : score >= 0 ? "#f59e0b" : "#ef4444"
  const scoreLabel = score >= 50 ? "Excelente" : score >= 0 ? "Bom" : score < 0 ? "Precisa atenção" : "Regular"

  return (
    <div className="rounded-xl border bg-card p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold">NPS Score</h3>
        {npsStats.length > 0 && (
          <span className="text-xs text-muted-foreground ml-1 truncate max-w-[200px]">
            · {main.questionTitle}
          </span>
        )}
      </div>

      <div className="flex items-center gap-8">
        {/* Ring */}
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 36 36" className="rotate-[-90deg]" width="96" height="96">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={ringColor} strokeWidth="3"
              strokeDasharray={`${Math.abs(score)} 100`}
              strokeLinecap="round"
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-2xl font-bold tabular-nums ${scoreColor}`}>
            {score > 0 ? `+${score}` : score}
          </span>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-3">
          <p className={`text-sm font-semibold ${scoreColor}`}>{scoreLabel}</p>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
            <div className="bg-red-400" style={{ width: `${detractors}%` }} title={`Detratores: ${detractors}%`} />
            <div className="bg-yellow-400" style={{ width: `${passives}%` }} title={`Passivos: ${passives}%`} />
            <div className="bg-emerald-500" style={{ width: `${promoters}%` }} title={`Promotores: ${promoters}%`} />
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400 inline-block" />Detratores {detractors}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-yellow-400 inline-block" />Passivos {passives}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />Promotores {promoters}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Analytics Overview Tab ───────────────────────────────────────────────────

function AnalyticsView({ analytics, questions, completionRate, formId, formTitle }: {
  analytics: FormAnalytics | null
  questions: QuestionSummary[]
  completionRate: number
  formId: string
  formTitle: string
}) {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm rounded-xl border bg-card">
        Dados analíticos não disponíveis.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <InsightCards analytics={analytics} questions={questions} />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Respostas por dia */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">Respostas nos últimos 30 dias</h3>
          <MiniBarChart data={analytics.responsesByDay} />
        </div>

        {/* Dropoff */}
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
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
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

        {/* Completion gauge */}
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

        {/* Avg time */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">Tempo médio de conclusão</h3>
          {analytics.averageCompletionTime > 0 ? (
            <span className="text-5xl font-bold">{formatDuration(analytics.averageCompletionTime)}</span>
          ) : (
            <p className="text-sm text-muted-foreground">Sem dados suficientes para calcular.</p>
          )}
        </div>

        {/* Source breakdown */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">Origem dos respondentes</h3>
          <SourceBreakdown data={analytics.sourceBreakdown} />
        </div>

        {/* Device breakdown */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">Dispositivos</h3>
          <DeviceBreakdown data={analytics.deviceBreakdown} />
        </div>
      </div>
    </div>
  )
}

// ─── Individual Response View ─────────────────────────────────────────────────

function AnswerDisplay({ value, type }: { value: unknown; type?: string }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground italic text-sm">Sem resposta</span>
  }
  if (typeof value === "boolean") {
    return (
      <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${value ? "text-green-600" : "text-red-500"}`}>
        {value ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
        {value ? "Sim" : "Não"}
      </span>
    )
  }
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {(value as unknown[]).map((item, i) => (
          <span key={i} className="rounded-full bg-primary/10 text-primary text-xs font-medium px-3 py-1">
            {String(item)}
          </span>
        ))}
      </div>
    )
  }
  if (typeof value === "number" || (type && ["rating", "scale", "nps", "number"].includes(type))) {
    return <span className="text-3xl font-bold tabular-nums">{String(value)}</span>
  }
  if (typeof value === "object" && "fileName" in (value as object)) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        📎 {(value as { fileName: string }).fileName}
      </span>
    )
  }
  const text = String(value)
  return (
    <p className={`text-sm leading-relaxed ${text.length > 80 ? "whitespace-pre-wrap" : ""}`}>
      {text}
    </p>
  )
}

const DEVICE_ICON: Record<string, React.ElementType> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
}

function ResponseDetailPanel({
  responses,
  questions,
  index,
  onClose,
  onNavigate,
}: {
  responses: ResponseWithAnswers[]
  questions: QuestionSummary[]
  index: number
  onClose: () => void
  onNavigate: (i: number) => void
}) {
  const r = responses[index]
  const total = responses.length
  const hasPrev = index > 0
  const hasNext = index < total - 1

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft" && hasPrev) onNavigate(index - 1)
      if (e.key === "ArrowRight" && hasNext) onNavigate(index + 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [index, hasPrev, hasNext, onClose, onNavigate])

  const duration = r.completedAt
    ? Math.round((new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime()) / 1000)
    : null

  const meta = r.metadata as {
    deviceType?: string; utmSource?: string; referrer?: string
  } | null

  const questionMap = new Map(questions.map((q) => [q.id, q]))
  const DeviceIcon = DEVICE_ICON[meta?.deviceType ?? ""] ?? null

  const source = meta?.utmSource
    ?? (meta?.referrer ? (() => { try { return new URL(meta.referrer!).hostname.replace(/^www\./, "") } catch { return meta.referrer! } })() : null)

  // Sort answers by question order
  const sortedAnswers = [...r.answers].sort((a, b) => {
    const qa = questionMap.get(a.questionId)
    const qb = questionMap.get(b.questionId)
    return (qa?.order ?? 0) - (qb?.order ?? 0)
  })

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[540px] bg-background border-l shadow-2xl z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onNavigate(index - 1)}
              disabled={!hasPrev}
              className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Resposta anterior (←)"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium tabular-nums px-2">
              {index + 1} <span className="text-muted-foreground font-normal">de {total}</span>
            </span>
            <button
              onClick={() => onNavigate(index + 1)}
              disabled={!hasNext}
              className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Próxima resposta (→)"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Meta strip */}
        <div className="px-5 py-3 border-b bg-muted/20 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="text-xs text-muted-foreground">{formatDate(r.startedAt)}</span>
          {duration != null && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />{formatDuration(duration)}
            </span>
          )}
          {r.completedAt ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
              <CheckCircle2 className="h-3 w-3" />Completa
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Circle className="h-3 w-3" />Parcial
            </span>
          )}
          {DeviceIcon && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground capitalize">
              <DeviceIcon className="h-3 w-3" />{meta?.deviceType}
            </span>
          )}
          {source && (
            <span className="text-xs text-muted-foreground">via {source}</span>
          )}
        </div>

        {/* Q&A list */}
        <ScrollArea className="flex-1">
          <div className="px-5 py-6 space-y-7">
            {sortedAnswers.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-10">
                Nenhuma resposta registrada.
              </p>
            ) : (
              sortedAnswers.map((a) => {
                const q = questionMap.get(a.questionId)
                return (
                  <div key={a.questionId} className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide line-clamp-2">
                      {q?.title ?? "Pergunta"}
                    </p>
                    <AnswerDisplay value={a.value} type={q?.type} />
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        {/* Footer navigation */}
        <div className="px-5 py-3.5 border-t flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasPrev}
            onClick={() => onNavigate(index - 1)}
            className="gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            ← → para navegar · Esc para fechar
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasNext}
            onClick={() => onNavigate(index + 1)}
            className="gap-1.5"
          >
            Próxima<ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  )
}

// ─── Responses Table ──────────────────────────────────────────────────────────

function ResponsesTable({ responses, questions, onOpen }: {
  responses: ResponseWithAnswers[]
  questions: QuestionSummary[]
  onOpen: (index: number) => void
}) {
  if (responses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground rounded-xl border bg-card">
        <Users className="h-10 w-10 mb-4 opacity-20" />
        <p className="font-medium">Nenhuma resposta ainda</p>
        <p className="text-sm mt-1">Compartilhe o link do formulário para começar a receber respostas.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="text-left p-4 font-semibold text-muted-foreground w-12">#</th>
            <th className="text-left p-4 font-semibold text-muted-foreground">Data</th>
            <th className="text-left p-4 font-semibold text-muted-foreground">Respostas</th>
            <th className="text-left p-4 font-semibold text-muted-foreground">Tempo</th>
            <th className="text-left p-4 font-semibold text-muted-foreground">Status</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {responses.map((r, i) => {
            const duration = r.completedAt
              ? Math.round((new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime()) / 1000)
              : null
            return (
              <tr
                key={r.id}
                className="border-b last:border-0 hover:bg-muted/20 cursor-pointer transition-colors group"
                onClick={() => onOpen(i)}
              >
                <td className="p-4 text-muted-foreground">{i + 1}</td>
                <td className="p-4">{formatDate(r.startedAt)}</td>
                <td className="p-4">
                  <span className="tabular-nums">{r.answers.length}</span>
                  <span className="text-muted-foreground"> / {questions.length}</span>
                </td>
                <td className="p-4 text-muted-foreground tabular-nums">
                  {duration != null ? formatDuration(duration) : "—"}
                </td>
                <td className="p-4">
                  {r.completedAt ? (
                    <span className="inline-flex items-center gap-1.5 text-green-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />Completa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Circle className="h-3.5 w-3.5" />Parcial
                    </span>
                  )}
                </td>
                <td className="p-4 pr-3">
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function formatAnswerValue(value: unknown): string {
  if (value === null || value === undefined) return "—"
  if (typeof value === "boolean") return value ? "Sim" : "Não"
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "object" && "fileName" in (value as object)) {
    return `📎 ${(value as { fileName: string }).fileName}`
  }
  return String(value)
}

// ─── Response Filters ─────────────────────────────────────────────────────────

type FilterPeriod = "all" | "today" | "7d" | "30d"
type FilterStatus = "all" | "complete" | "partial"
type FilterDevice = "all" | "desktop" | "mobile" | "tablet"

interface ResponseFilters {
  period: FilterPeriod
  status: FilterStatus
  device: FilterDevice
  source: string
}

const DEFAULT_FILTERS: ResponseFilters = { period: "all", status: "all", device: "all", source: "all" }

function getResponseSource(meta: { utmSource?: string | null; referrer?: string | null } | null | undefined): string {
  if (!meta) return "Direto"
  if (meta.utmSource) return meta.utmSource
  if (meta.referrer) {
    try {
      return new URL(meta.referrer).hostname.replace(/^www\./, "")
    } catch {
      return meta.referrer.slice(0, 32)
    }
  }
  return "Direto"
}

function FilterBar({
  filters,
  onChange,
  sources,
  filteredCount,
  totalCount,
}: {
  filters: ResponseFilters
  onChange: (f: ResponseFilters) => void
  sources: string[]
  filteredCount: number
  totalCount: number
}) {
  const hasActive =
    filters.period !== "all" || filters.status !== "all" || filters.device !== "all" || filters.source !== "all"

  function set<K extends keyof ResponseFilters>(key: K, value: ResponseFilters[K]) {
    onChange({ ...filters, [key]: value })
  }

  const sel =
    "h-8 rounded-lg border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <select className={sel} value={filters.period} onChange={(e) => set("period", e.target.value as FilterPeriod)}>
        <option value="all">Todos os períodos</option>
        <option value="today">Hoje</option>
        <option value="7d">Últimos 7 dias</option>
        <option value="30d">Últimos 30 dias</option>
      </select>
      <select className={sel} value={filters.status} onChange={(e) => set("status", e.target.value as FilterStatus)}>
        <option value="all">Todos os status</option>
        <option value="complete">Completas</option>
        <option value="partial">Parciais</option>
      </select>
      <select className={sel} value={filters.device} onChange={(e) => set("device", e.target.value as FilterDevice)}>
        <option value="all">Todos os dispositivos</option>
        <option value="desktop">Desktop</option>
        <option value="mobile">Mobile</option>
        <option value="tablet">Tablet</option>
      </select>
      {sources.length > 1 && (
        <select className={sel} value={filters.source} onChange={(e) => set("source", e.target.value)}>
          <option value="all">Todas as origens</option>
          {sources.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}
      {hasActive && (
        <>
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="flex items-center gap-1 h-8 rounded-lg border border-dashed px-2.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <X className="h-3 w-3" />Limpar
          </button>
          {filteredCount !== totalCount && (
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
              {filteredCount} de {totalCount}
            </span>
          )}
        </>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ResponsesSection({
  formId, formTitle, formStatus, formSlug,
  questions, responses, analytics,
}: ResponsesSectionProps) {
  const [tab, setTab] = useState<"responses" | "questions" | "analytics">("questions")
  const [copied, setCopied] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [filters, setFilters] = useState<ResponseFilters>(DEFAULT_FILTERS)
  const [openResponseIndex, setOpenResponseIndex] = useState<number | null>(null)

  const sources = useMemo(() => {
    const set = new Set<string>()
    for (const r of responses) set.add(getResponseSource(r.metadata))
    return Array.from(set).sort()
  }, [responses])

  const filteredResponses = useMemo(() => {
    return responses.filter((r) => {
      if (filters.period !== "all") {
        const now = new Date()
        const cutoff = new Date()
        if (filters.period === "today") cutoff.setHours(0, 0, 0, 0)
        else if (filters.period === "7d") cutoff.setDate(now.getDate() - 7)
        else if (filters.period === "30d") cutoff.setDate(now.getDate() - 30)
        if (new Date(r.startedAt) < cutoff) return false
      }
      if (filters.status === "complete" && !r.completedAt) return false
      if (filters.status === "partial" && r.completedAt) return false
      if (filters.device !== "all" && r.metadata?.deviceType !== filters.device) return false
      if (filters.source !== "all" && getResponseSource(r.metadata) !== filters.source) return false
      return true
    })
  }, [responses, filters])

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/f/${formSlug}`
      : `/f/${formSlug}`

  function copyLink() {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleExport() {
    setIsExporting(true)
    try {
      const ids =
        filteredResponses.length !== responses.length ? filteredResponses.map((r) => r.id) : undefined
      const csv = await exportResponsesAction(formId, ids)
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${formTitle.replace(/[^a-z0-9]/gi, "_")}_respostas.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  const completedCount = responses.filter((r) => r.completedAt).length
  const completionRate = analytics?.completionRate ??
    (responses.length > 0 ? completedCount / responses.length : 0)
  const avgTime = analytics?.averageCompletionTime ?? 0
  const questionStats = analytics?.questionStats ?? []

  return (
    <div className="container py-8 max-w-6xl">

      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <Link href={`/builder/${formId}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />Editor
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-heading truncate">{formTitle}</h1>
            <Badge
              variant={formStatus === "published" ? "default" : "secondary"}
              className={formStatus === "published" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : ""}
            >
              {formStatus === "published" ? "Publicado" : formStatus === "draft" ? "Rascunho" : "Fechado"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}
            disabled={isExporting || responses.length === 0}>
            <Download className="h-3.5 w-3.5" />
            {isExporting ? "Exportando..." : "Exportar CSV"}
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={copyLink}>
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Copiado!" : "Copiar link"}
          </Button>
          {formStatus === "published" && (
            <a href={`/f/${formSlug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-3.5 w-3.5" />Ver formulário
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Eye} label="Visualizações"
          value={(analytics?.totalViews ?? 0).toLocaleString("pt-BR")} />
        <StatCard icon={Users} label="Respostas"
          value={(analytics?.totalResponses ?? responses.length).toLocaleString("pt-BR")}
          sub={`${completedCount} completas`} />
        <StatCard icon={TrendingUp} label="Taxa de conclusão"
          value={pct(completionRate)} sub={`${responses.length} iniciadas`} />
        <StatCard icon={Clock} label="Tempo médio"
          value={avgTime > 0 ? formatDuration(avgTime) : "—"} sub="para concluir" />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="mb-6">
          <TabsTrigger value="questions" disabled={questionStats.length === 0}>
            Perguntas{questionStats.length > 0 ? ` (${questionStats.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="responses">
            Respostas ({filteredResponses.length !== responses.length ? `${filteredResponses.length}/${responses.length}` : responses.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">Visão Geral</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "responses" && (
        <>
          <FilterBar
            filters={filters}
            onChange={setFilters}
            sources={sources}
            filteredCount={filteredResponses.length}
            totalCount={responses.length}
          />
          <ResponsesTable
            responses={filteredResponses}
            questions={questions}
            onOpen={setOpenResponseIndex}
          />
        </>
      )}

      {openResponseIndex !== null && (
        <ResponseDetailPanel
          responses={filteredResponses}
          questions={questions}
          index={openResponseIndex}
          onClose={() => setOpenResponseIndex(null)}
          onNavigate={setOpenResponseIndex}
        />
      )}
      {tab === "questions" && (
        <QuestionIntelligence
          questionStats={questionStats}
          questions={questions}
          formId={formId}
          dropoffByQuestion={analytics?.dropoffByQuestion ?? []}
          totalResponses={analytics?.totalResponses ?? responses.length}
        />
      )}
      {tab === "analytics" && (
        <AnalyticsView analytics={analytics} questions={questions} completionRate={completionRate} formId={formId} formTitle={formTitle} />
      )}
    </div>
  )
}
