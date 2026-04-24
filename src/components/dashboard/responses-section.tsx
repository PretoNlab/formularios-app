"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Eye, Users, TrendingUp, Clock,
  CheckCircle2, Circle, Copy, ExternalLink, Download,
  Smartphone, Filter, X, ChevronLeft, ChevronRight, Monitor, Tablet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { FormAnalytics, QuestionType } from "@/lib/types/form"
import type { ResponseWithAnswers } from "@/lib/db/queries/responses"
import { exportResponsesAction } from "@/app/actions/responses"
import { ImportResponsesDialog } from "@/components/responses/import-responses-dialog"
import { StatCard } from "./analytics/stat-card"
import { AnalyticsView } from "./analytics/analytics-view"
import { pct, formatDuration } from "./analytics/utils"
import type { QuestionSummary } from "./analytics/types"

// ─── Props ────────────────────────────────────────────────────────────────────

interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface ResponsesSectionProps {
  formId: string
  formTitle: string
  formStatus: string
  formSlug: string
  questions: QuestionSummary[]
  responses: ResponseWithAnswers[]
  analytics: FormAnalytics | null
  pagination?: PaginationMeta
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(date))
}

function stripOther(s: unknown): string {
  const str = String(s)
  return str.startsWith("__other__") ? `Outro: ${str.slice(9)}` : str
}

function formatAnswerValue(value: unknown): string {
  if (value === null || value === undefined) return "—"
  if (typeof value === "boolean") return value ? "Sim" : "Não"
  if (Array.isArray(value)) return value.map(stripOther).join(", ")
  if (typeof value === "object" && value !== null && !("fileName" in (value as object)) && !Array.isArray(value)) {
    return Object.entries(value as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(", ")
  }
  if (typeof value === "object" && "fileName" in (value as object)) {
    return `📎 ${(value as { fileName: string }).fileName}`
  }
  return stripOther(value)
}

// ─── Answer Display (Response Detail Panel) ──────────────────────────────────

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
        {(value as unknown[]).map((item, i) => {
          const label = typeof item === "string" && item.startsWith("__other__")
            ? `Outro: ${item.slice(9)}`
            : String(item)
          return (
            <span key={i} className="rounded-full bg-primary/10 text-primary text-xs font-medium px-3 py-1">
              {label}
            </span>
          )
        })}
      </div>
    )
  }
  if (typeof value === "number" || (type && ["rating", "scale", "nps", "number", "opinion_scale"].includes(type))) {
    return <span className="text-3xl font-bold tabular-nums">{String(value)}</span>
  }
  if (typeof value === "object" && value !== null && !("fileName" in (value as object)) && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, string>)
    return (
      <div className="space-y-1.5">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-center gap-2 text-sm">
            <span className="font-medium text-foreground">{k}:</span>
            <span className="rounded-full bg-primary/10 text-primary text-xs font-medium px-3 py-1">{v}</span>
          </div>
        ))}
      </div>
    )
  }
  if (typeof value === "object" && "fileName" in (value as object)) {
    const file = value as { fileName: string; fileUrl?: string }
    return (
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        📎{" "}
        {file.fileUrl ? (
          <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            {file.fileName}
          </a>
        ) : (
          file.fileName
        )}
      </span>
    )
  }
  if (type === "signature" && typeof value === "string") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={value} alt="Assinatura" className="max-h-20 border rounded bg-white" />
  }
  const raw = String(value)
  const text = raw.startsWith("__other__") ? `Outro: ${raw.slice(9)}` : raw
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

  const sortedAnswers = [...r.answers].sort((a, b) => {
    const qa = questionMap.get(a.questionId)
    const qb = questionMap.get(b.questionId)
    return (qa?.order ?? 0) - (qb?.order ?? 0)
  })

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-full max-w-[540px] bg-background border-l shadow-2xl z-50 flex flex-col">
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

  const NON_INPUT: QuestionType[] = ["welcome", "thank_you", "statement"]
  const visibleQuestions = [...questions]
    .filter((q) => !NON_INPUT.includes(q.type))
    .sort((a, b) => a.order - b.order)

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-10 sticky left-0 bg-muted/30">#</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Data</th>
              {visibleQuestions.map((q) => (
                <th key={q.id} className="text-left px-4 py-3 font-semibold text-muted-foreground min-w-[160px] max-w-[220px]">
                  <span className="block truncate" title={q.title}>{q.title}</span>
                </th>
              ))}
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Status</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {responses.map((r, i) => (
              <tr
                key={r.id}
                className="border-b last:border-0 hover:bg-muted/40 cursor-pointer transition-colors group"
                onClick={() => onOpen(i)}
              >
                <td className="px-4 py-3 text-muted-foreground sticky left-0 bg-card group-hover:bg-muted/40 transition-colors">{i + 1}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(r.startedAt)}</td>
                {visibleQuestions.map((q) => {
                  const ans = r.answers.find((a) => a.questionId === q.id)
                  const val = ans ? formatAnswerValue(ans.value) : "—"
                  return (
                    <td key={q.id} className="px-4 py-3 max-w-[220px]">
                      <span className="block truncate" title={val !== "—" ? val : undefined}>{val}</span>
                    </td>
                  )
                })}
                <td className="px-4 py-3">
                  {r.completedAt ? (
                    <span className="inline-flex items-center gap-1.5 text-green-600 whitespace-nowrap">
                      <CheckCircle2 className="h-3.5 w-3.5" />Completa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground whitespace-nowrap">
                      <Circle className="h-3.5 w-3.5" />Parcial
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 pr-3">
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
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
  questions, responses, analytics, pagination,
}: ResponsesSectionProps) {
  const router = useRouter()
  const [tab, setTab] = useState<"responses" | "analytics">("responses")
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
      // Never show partial responses with zero answers (e.g. opened form and left immediately)
      if (!r.completedAt && r.answers.length === 0) return false
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
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
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
          <ImportResponsesDialog formId={formId} />
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
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-xs text-muted-foreground">
                Página {pagination.page} de {pagination.totalPages} · {pagination.total} respostas
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => router.push(`/responses/${formId}?page=${pagination.page - 1}`)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => router.push(`/responses/${formId}?page=${pagination.page + 1}`)}
                >
                  Próxima<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
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

      {tab === "analytics" && (
        <AnalyticsView
          formId={formId}
          initialAnalytics={analytics}
          questions={questions}
        />
      )}
    </div>
  )
}
