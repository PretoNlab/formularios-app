"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, Eye, Users, TrendingUp, Clock,
  CheckCircle2, Circle, Copy, ExternalLink, Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { FormAnalytics, QuestionType } from "@/lib/types/form"
import type { ResponseWithAnswers } from "@/lib/db/queries/responses"
import { exportResponsesAction } from "@/app/actions/responses"

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
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}

// ─── Stats Card ───────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
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

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Sem dados no período.
      </div>
    )
  }

  const max = Math.max(...data.map((d) => d.count), 1)

  // Show last 30 days, fill gaps with 0
  const today = new Date()
  const days: { date: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const found = data.find((x) => x.date === key)
    days.push({ date: key, count: found?.count ?? 0 })
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
              backgroundColor:
                d.count === 0
                  ? "hsl(var(--muted))"
                  : "hsl(var(--primary))",
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function ResponsesSection({
  formId,
  formTitle,
  formStatus,
  formSlug,
  questions,
  responses,
  analytics,
}: ResponsesSectionProps) {
  const [tab, setTab] = useState<"responses" | "analytics">("responses")
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
  const completionRate = analytics?.completionRate ?? (responses.length > 0 ? completedCount / responses.length : 0)
  const avgTime = analytics?.averageCompletionTime ?? 0

  return (
    <div className="container py-8 max-w-6xl">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <Link href={`/builder/${formId}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Editor
          </Button>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-heading truncate">{formTitle}</h1>
            <Badge
              variant={formStatus === "published" ? "default" : "secondary"}
              className={
                formStatus === "published"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : ""
              }
            >
              {formStatus === "published" ? "Publicado" : formStatus === "draft" ? "Rascunho" : "Fechado"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport} disabled={isExporting || responses.length === 0}>
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
                <ExternalLink className="h-3.5 w-3.5" />
                Ver formulário
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Eye}
          label="Visualizações"
          value={(analytics?.totalViews ?? 0).toLocaleString("pt-BR")}
        />
        <StatCard
          icon={Users}
          label="Respostas"
          value={(analytics?.totalResponses ?? responses.length).toLocaleString("pt-BR")}
          sub={`${completedCount} completas`}
        />
        <StatCard
          icon={TrendingUp}
          label="Taxa de conclusão"
          value={pct(completionRate)}
          sub={`${responses.length} iniciadas`}
        />
        <StatCard
          icon={Clock}
          label="Tempo médio"
          value={avgTime > 0 ? formatDuration(avgTime) : "—"}
          sub="para concluir"
        />
      </div>

      {/* ── Tabs ── */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "responses" | "analytics")}>
        <TabsList className="mb-6">
          <TabsTrigger value="responses">
            Respostas ({responses.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">Visão geral</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ── Responses Table ── */}
      {tab === "responses" && (
        <ResponsesTable responses={responses} questions={questions} />
      )}

      {/* ── Analytics ── */}
      {tab === "analytics" && (
        <AnalyticsView
          analytics={analytics}
          questions={questions}
          completionRate={completionRate}
        />
      )}
    </div>
  )
}

// ─── Responses Table ──────────────────────────────────────────────────────────

function ResponsesTable({
  responses,
  questions,
}: {
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
            const duration =
              r.completedAt
                ? Math.round(
                    (new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime()) / 1000
                  )
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
                      <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Circle className="h-3.5 w-3.5" />
                        Parcial
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

// ─── Analytics View ───────────────────────────────────────────────────────────

function AnalyticsView({
  analytics,
  questions,
  completionRate,
}: {
  analytics: FormAnalytics | null
  questions: QuestionSummary[]
  completionRate: number
}) {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm rounded-xl border bg-card">
        Dados analíticos não disponíveis.
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Respostas por dia */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="font-semibold mb-4">Respostas nos últimos 30 dias</h3>
        <MiniBarChart data={analytics.responsesByDay} />
      </div>

      {/* Dropoff por pergunta */}
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
                    <span className="text-xs font-semibold tabular-nums">
                      {pct(answered)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${answered * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Completion rate gauge */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="font-semibold mb-4">Taxa de conclusão</h3>
        <div className="flex items-center gap-6">
          <div className="relative h-24 w-24 shrink-0">
            <svg viewBox="0 0 36 36" className="rotate-[-90deg]" width="96" height="96">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="hsl(var(--primary))"
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
            <p>{Math.round(analytics.totalResponses * completionRate)} concluídas</p>
            <p>{Math.round(analytics.totalResponses * (1 - completionRate))} abandonadas</p>
          </div>
        </div>
      </div>

      {/* Avg completion time */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="font-semibold mb-4">Tempo médio de conclusão</h3>
        {analytics.averageCompletionTime > 0 ? (
          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold">
              {formatDuration(analytics.averageCompletionTime)}
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Sem dados suficientes para calcular.
          </p>
        )}
      </div>
    </div>
  )
}
