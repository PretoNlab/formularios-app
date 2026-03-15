"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, Eye, Users, TrendingUp, Clock,
  CheckCircle2, Circle, Copy, ExternalLink, Download,
  Smartphone, AlertTriangle, BarChart2, Sparkles, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { FormAnalytics, QuestionAnalytics, QuestionType } from "@/lib/types/form"
import type { ResponseWithAnswers } from "@/lib/db/queries/responses"
import { exportResponsesAction } from "@/app/actions/responses"
import { analyzeTextResponsesAction, generateFormReportAction, type TextAnalysisResult, type FormReportResult } from "@/app/actions/ai-analysis"

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

function QuestionCard({ stat, order, formId }: { stat: QuestionAnalytics; order: number | string; formId: string }) {
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
            </p>
          </div>
        </div>
        {stat.skipRate > 0.1 && (
          <span className="text-xs text-muted-foreground shrink-0">{pct(stat.skipRate)} pularam</span>
        )}
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

function QuestionIntelligence({ questionStats, questions, formId }: {
  questionStats: QuestionAnalytics[]
  questions: QuestionSummary[]
  formId: string
}) {
  if (questionStats.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm rounded-xl border bg-card">
        Sem dados suficientes para análise por pergunta.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {questionStats.map((stat) => {
        const q = questions.find((x) => x.id === stat.questionId)
        const order = q?.order !== undefined ? q.order + 1 : "?"
        return <QuestionCard key={stat.questionId} stat={stat} order={order} formId={formId} />
      })}
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

// ─── AI Form Report ───────────────────────────────────────────────────────────

const PRIORITY_LABEL = { high: "Alta", medium: "Média", low: "Baixa" }
const PRIORITY_COLOR = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444"
  const label = score >= 80 ? "Excelente" : score >= 60 ? "Bom" : score >= 40 ? "Regular" : "Precisa melhorar"
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0">
        <svg viewBox="0 0 36 36" className="rotate-[-90deg]" width="80" height="80">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${score} 100`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">{score}</span>
      </div>
      <div>
        <p className="font-semibold text-lg">{label}</p>
        <p className="text-xs text-muted-foreground">nota geral do formulário</p>
      </div>
    </div>
  )
}

function AIReportView({ report }: { report: FormReportResult }) {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-6">
      <div className="flex items-center gap-2 text-violet-600 font-semibold text-sm">
        <Sparkles className="h-4 w-4" />
        Relatório gerado com IA
      </div>

      <ScoreRing score={report.score} />

      <p className="text-sm text-foreground/80 leading-relaxed border-l-2 border-violet-400 pl-4 italic">
        {report.summary}
      </p>

      {/* Highlights */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Destaques</p>
        <div className="space-y-2">
          {report.highlights.map((h, i) => (
            <div key={i} className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm ${
              h.type === "positive" ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300" :
              h.type === "negative" ? "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300" :
              "bg-muted/50 text-foreground/70"
            }`}>
              <span className="shrink-0 mt-0.5 text-base leading-none">
                {h.type === "positive" ? "↑" : h.type === "negative" ? "↓" : "→"}
              </span>
              {h.text}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recomendações</p>
        <div className="space-y-3">
          {report.recommendations.map((rec, i) => (
            <div key={i} className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-semibold">{rec.title}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${PRIORITY_COLOR[rec.priority]}`}>
                  {PRIORITY_LABEL[rec.priority]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AIReportButton({ analytics, formId, formTitle }: {
  analytics: FormAnalytics
  formId: string
  formTitle: string
}) {
  const [report, setReport] = useState<FormReportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    const res = await generateFormReportAction(formId, analytics, formTitle)
    if (res.success) setReport(res.data)
    else setError(res.error)
    setLoading(false)
  }

  if (report) return <AIReportView report={report} />

  return (
    <div className="rounded-xl border-2 border-dashed border-violet-200 dark:border-violet-900 bg-violet-50/50 dark:bg-violet-950/20 p-6 text-center">
      <div className="flex justify-center mb-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
          <Sparkles className="h-6 w-6 text-violet-600" />
        </div>
      </div>
      <h3 className="font-semibold mb-1">Relatório Inteligente</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
        O Claude analisa todos os dados do seu formulário e gera um diagnóstico completo com nota, destaques e recomendações acionáveis.
      </p>
      <Button
        onClick={handleGenerate}
        disabled={loading || analytics.totalResponses < 3}
        className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
      >
        {loading
          ? <><Loader2 className="h-4 w-4 animate-spin" />Analisando formulário...</>
          : <><Sparkles className="h-4 w-4" />Gerar Relatório com IA</>
        }
      </Button>
      {analytics.totalResponses < 3 && (
        <p className="text-xs text-muted-foreground mt-2">Mínimo de 3 respostas necessário.</p>
      )}
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
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
      <AIReportButton analytics={analytics} formId={formId} formTitle={formTitle} />
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

// ─── Responses Table ──────────────────────────────────────────────────────────

function ResponsesTable({ responses, questions }: {
  responses: ResponseWithAnswers[]
  questions: QuestionSummary[]
}) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (responses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground rounded-xl border bg-card">
        <Users className="h-10 w-10 mb-4 opacity-20" />
        <p className="font-medium">Nenhuma resposta ainda</p>
        <p className="text-sm mt-1">Compartilhe o link do formulário para começar a receber respostas.</p>
      </div>
    )
  }

  const questionMap = new Map(questions.map((q) => [q.id, q]))

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
          </tr>
        </thead>
        <tbody>
          {responses.map((r, i) => {
            const duration = r.completedAt
              ? Math.round((new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime()) / 1000)
              : null
            const isExpanded = expanded === r.id
            return (
              <>
                <tr
                  key={r.id}
                  className="border-b last:border-0 hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : r.id)}
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
                </tr>
                {isExpanded && (
                  <tr key={`${r.id}-detail`} className="bg-muted/10">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="space-y-3">
                        {r.answers.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">Nenhuma resposta registrada.</p>
                        ) : (
                          r.answers.map((a) => {
                            const q = questionMap.get(a.questionId)
                            return (
                              <div key={a.questionId} className="flex gap-4">
                                <p className="text-xs text-muted-foreground w-48 shrink-0 pt-0.5 line-clamp-2">
                                  {q?.title ?? a.questionId}
                                </p>
                                <p className="text-sm font-medium break-words flex-1">
                                  {formatAnswerValue(a.value)}
                                </p>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function ResponsesSection({
  formId, formTitle, formStatus, formSlug,
  questions, responses, analytics,
}: ResponsesSectionProps) {
  const [tab, setTab] = useState<"responses" | "questions" | "analytics">("responses")
  const [copied, setCopied] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

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
      const csv = await exportResponsesAction(formId)
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
          <TabsTrigger value="responses">Respostas ({responses.length})</TabsTrigger>
          <TabsTrigger value="questions" disabled={questionStats.length === 0}>
            Perguntas{questionStats.length > 0 ? ` (${questionStats.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="analytics">Visão geral</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "responses" && (
        <ResponsesTable responses={responses} questions={questions} />
      )}
      {tab === "questions" && (
        <QuestionIntelligence questionStats={questionStats} questions={questions} formId={formId} />
      )}
      {tab === "analytics" && (
        <AnalyticsView analytics={analytics} questions={questions} completionRate={completionRate} formId={formId} formTitle={formTitle} />
      )}
    </div>
  )
}
