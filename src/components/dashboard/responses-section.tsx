"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft, Eye, Users, TrendingUp, Clock,
  CheckCircle2, Circle, Copy, ExternalLink, Download,
  Smartphone, Filter, X, ChevronLeft, ChevronRight, Monitor, Tablet, Printer, Share2,
  Sparkles, Zap, Trash2, AlertCircle, Loader2, MoreHorizontal, FileDown, FileUp, Link2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { FormAnalytics, QuestionType } from "@/lib/types/form"
import type { ResponseWithAnswers, ResponseFilters } from "@/lib/db/queries/responses"
import {
  exportResponsesAction,
  deleteResponsesAction,
  deleteResponsesByFilterAction,
} from "@/app/actions/responses"
import { ImportResponsesDialog } from "@/components/responses/import-responses-dialog"
import { PublicShareDialog } from "./public-share-dialog"
import { OnboardingBanner } from "@/components/shared/onboarding-banner"
import { ONBOARDING_KEYS, setFlag } from "@/lib/utils/onboarding"
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
  filters: ResponseFilters
  shareToken?: string | null
  isAnalyticsPublic?: boolean | null
  userPlan?: string
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
  userPlan,
  onClose,
  onNavigate,
}: {
  responses: ResponseWithAnswers[]
  questions: QuestionSummary[]
  index: number
  userPlan?: string
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

  // Find custom thank you page
  const thankYouPage = questions.find(q => q.type === "thank_you")
  
  // Conditionally hide watermark for paid plans
  const showWatermark = !userPlan || userPlan === "free"

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 print-hide" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-full max-w-[540px] bg-background border-l shadow-2xl z-50 flex flex-col print-full-width print-no-border print-shadow-none">
        <div className="flex items-center justify-between px-5 py-3.5 border-b print-hide">
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
              title="Imprimir / Salvar PDF"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
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
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground capitalize print-hide">
              <DeviceIcon className="h-3 w-3" />{meta?.deviceType}
            </span>
          )}
          {source && (
            <span className="text-xs text-muted-foreground print-hide">via {source}</span>
          )}
        </div>

        <ScrollArea className="flex-1 print:overflow-visible print:h-auto">
          <div className="px-5 py-6 space-y-7">
            {sortedAnswers.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-10">
                Nenhuma resposta registrada.
              </p>
            ) : (
              sortedAnswers.map((a) => {
                const q = questionMap.get(a.questionId)
                return (
                  <div key={a.questionId} className="space-y-1.5 print-break-inside-avoid">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide line-clamp-2 print:line-clamp-none">
                      {q?.title ?? "Pergunta"}
                    </p>
                    <AnswerDisplay value={a.value} type={q?.type} />
                  </div>
                )
              })
            )}

            {/* Custom Thank You Page Injection for PDF */}
            {thankYouPage && (
              <div className="hidden print:block print:mt-12 print:pt-8 print:border-t print-break-inside-avoid">
                <p className="text-sm font-medium text-muted-foreground uppercase mb-2">Mensagem Final</p>
                <h2 className="text-xl font-bold mb-2">{thankYouPage.title}</h2>
                {thankYouPage.description && (
                  <p className="text-sm text-muted-foreground">{thankYouPage.description}</p>
                )}
              </div>
            )}

            {/* Print Watermark */}
            {showWatermark && (
              <div className="hidden print:flex print:items-center print:justify-center print:mt-16 print:pt-8 print:opacity-50 print-break-inside-avoid">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  <span>Powered by <strong>Formulários IA</strong></span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-5 py-3.5 border-t flex items-center justify-between print-hide">
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

function ResponsesTable({
  responses,
  questions,
  onOpen,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  isAllSelected,
}: {
  responses: ResponseWithAnswers[]
  questions: QuestionSummary[]
  onOpen: (index: number) => void
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  isAllSelected: boolean
}) {
  if (responses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground rounded-2xl border bg-card/50">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Users className="h-6 w-6 opacity-40" />
        </div>
        <p className="font-semibold text-foreground">Nenhuma resposta ainda</p>
        <p className="text-sm mt-1 max-w-xs">Compartilhe o link do formulário para começar a receber respostas.</p>
      </div>
    )
  }

  const NON_INPUT: QuestionType[] = ["welcome", "thank_you", "statement"]
  const visibleQuestions = [...questions]
    .filter((q) => !NON_INPUT.includes(q.type))
    .sort((a, b) => a.order - b.order)

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-3 w-10 sticky left-0 bg-muted/30 z-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  className="h-4 w-4 rounded border-input bg-background accent-primary cursor-pointer"
                />
              </th>
              <th className="text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase w-10">#</th>
              <th className="text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase whitespace-nowrap">Data</th>
              {visibleQuestions.map((q) => (
                <th key={q.id} className="text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase min-w-[150px] max-w-[200px]">
                  <span className="block truncate" title={q.title}>{q.title}</span>
                </th>
              ))}
              <th className="text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase whitespace-nowrap">Status</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {responses.map((r, i) => (
              <tr
                key={r.id}
                className="hover:bg-muted/30 cursor-pointer transition-colors group"
                onClick={() => onOpen(i)}
              >
                <td className="px-4 py-3.5 sticky left-0 bg-card group-hover:bg-muted/30 transition-colors z-10" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(r.id)}
                    onChange={() => onToggleSelect(r.id)}
                    className="h-4 w-4 rounded border-input bg-background accent-primary cursor-pointer"
                  />
                </td>
                <td className="px-3 py-3.5 text-muted-foreground text-xs tabular-nums">{i + 1}</td>
                <td className="px-3 py-3.5 whitespace-nowrap text-xs text-muted-foreground">{formatDate(r.startedAt)}</td>
                {visibleQuestions.map((q) => {
                  const ans = r.answers.find((a) => a.questionId === q.id)
                  const val = ans ? formatAnswerValue(ans.value) : "—"
                  return (
                    <td key={q.id} className="px-3 py-3.5 max-w-[200px]">
                      <span className="block truncate text-sm" title={val !== "—" ? val : undefined}>{val}</span>
                    </td>
                  )
                })}
                <td className="px-3 py-3.5">
                  {r.completedAt ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 whitespace-nowrap">
                      <CheckCircle2 className="h-3 w-3" />Completa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground whitespace-nowrap">
                      <Circle className="h-3 w-3" />Parcial
                    </span>
                  )}
                </td>
                <td className="px-3 py-3.5 pr-3">
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Response Filters (server-side via URL params) ───────────────────────────
// Empty/undefined fields mean "no filter". See ResponseFilters in queries/responses.ts.

function FilterBar({
  filters,
  onChange,
  sources,
  crossFilters,
}: {
  filters: ResponseFilters
  onChange: (next: ResponseFilters) => void
  sources: string[]
  crossFilters: { questionId: string; title: string; options: string[] }[]
}) {
  const hasActive =
    !!filters.period || !!filters.status || !!filters.device || !!filters.source || !!filters.answerFilter

  function set<K extends keyof ResponseFilters>(key: K, value: ResponseFilters[K] | undefined) {
    const next = { ...filters }
    if (value === undefined) delete next[key]
    else next[key] = value as ResponseFilters[K]
    onChange(next)
  }

  const sel =
    "h-8 rounded-lg border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"

  return (
    <div data-filter-bar className="flex flex-wrap items-center gap-2 mb-4 scroll-mt-24">
      <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <select
        className={sel}
        value={filters.period ?? "all"}
        onChange={(e) => set("period", e.target.value === "all" ? undefined : (e.target.value as ResponseFilters["period"]))}
      >
        <option value="all">Todos os períodos</option>
        <option value="today">Hoje</option>
        <option value="7d">Últimos 7 dias</option>
        <option value="30d">Últimos 30 dias</option>
      </select>
      <select
        className={sel}
        value={filters.status ?? "all"}
        onChange={(e) => set("status", e.target.value === "all" ? undefined : (e.target.value as ResponseFilters["status"]))}
      >
        <option value="all">Todos os status</option>
        <option value="complete">Completas</option>
        <option value="partial">Parciais</option>
      </select>
      <select
        className={sel}
        value={filters.device ?? "all"}
        onChange={(e) => set("device", e.target.value === "all" ? undefined : (e.target.value as ResponseFilters["device"]))}
      >
        <option value="all">Todos os dispositivos</option>
        <option value="desktop">Desktop</option>
        <option value="mobile">Mobile</option>
        <option value="tablet">Tablet</option>
      </select>
      {sources.length > 1 && (
        <select
          className={sel}
          value={filters.source ?? "all"}
          onChange={(e) => set("source", e.target.value === "all" ? undefined : e.target.value)}
        >
          <option value="all">Todas as origens</option>
          {sources.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}
      {crossFilters.length > 0 && (
        <select
          className={`${sel} max-w-[200px] truncate`}
          value={filters.answerFilter ? `${filters.answerFilter.questionId}::${filters.answerFilter.value}` : "all"}
          onChange={(e) => {
            if (e.target.value === "all") set("answerFilter", undefined)
            else {
              const [q, v] = e.target.value.split("::")
              set("answerFilter", { questionId: q, value: v })
            }
          }}
        >
          <option value="all">Cruzamento de Dados...</option>
          {crossFilters.map((cf) => (
            <optgroup key={cf.questionId} label={cf.title}>
              {cf.options.map((opt) => (
                <option key={`${cf.questionId}::${opt}`} value={`${cf.questionId}::${opt}`}>
                  {opt}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      )}
      {hasActive && (
        <button
          onClick={() => onChange({})}
          className="flex items-center gap-1 h-8 rounded-lg border border-dashed px-2.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <X className="h-3 w-3" />Limpar
        </button>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ResponsesSection({
  formId, formTitle, formStatus, formSlug,
  questions, responses, analytics, pagination, filters,
  shareToken, isAnalyticsPublic, userPlan
}: ResponsesSectionProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<"responses" | "analytics">("responses")
  const [copied, setCopied] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [openResponseIndex, setOpenResponseIndex] = useState<number | null>(null)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteMode, setDeleteMode] = useState<"selected" | "filtered">("selected")

  // ── Filter URL helpers ─────────────────────────────────────────────────────
  function buildUrl(updates: Record<string, string | undefined>): string {
    const next = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined || v === "") next.delete(k)
      else next.set(k, v)
    }
    const qs = next.toString()
    return qs ? `/responses/${formId}?${qs}` : `/responses/${formId}`
  }

  function applyFilters(next: ResponseFilters) {
    router.push(
      buildUrl({
        period: next.period,
        status: next.status,
        device: next.device,
        source: next.source,
        answerQ: next.answerFilter?.questionId,
        answerV: next.answerFilter?.value,
        page: "1",
      }),
    )
  }

  const hasActiveFilters =
    !!filters.period || !!filters.status || !!filters.device || !!filters.source || !!filters.answerFilter

  // ── Source dropdown options (full universe, not just current page) ─────────
  const sources = useMemo(
    () => (analytics?.sourceBreakdown ?? []).map((s) => s.source).filter(Boolean).sort(),
    [analytics],
  )

  // ── Cross-filter options (full universe via analytics) ─────────────────────
  const crossFilters = useMemo(() => {
    const stats = analytics?.questionStats ?? []
    return stats
      .filter((qs) => Array.isArray(qs.optionCounts) && qs.optionCounts.length > 1)
      .map((qs) => ({
        questionId: qs.questionId,
        title: qs.questionTitle,
        options: qs.optionCounts!.map((o) => o.option).filter(Boolean).sort(),
      }))
      .filter((cf) => cf.options.length > 1)
  }, [analytics])

  // Server already applies all filters (including noise removal). Render as-is.
  const visibleResponses = responses

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/f/${formSlug}`
      : `/f/${formSlug}`

  function copyLink() {
    navigator.clipboard.writeText(publicUrl)
    setFlag(ONBOARDING_KEYS.SHARE_COMPLETED)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleToggleSelect(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  function handleToggleSelectAll() {
    if (selectedIds.size === visibleResponses.length && visibleResponses.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(visibleResponses.map(r => r.id)))
    }
  }

  async function handleDeleteResponses() {
    setIsDeleting(true)
    try {
      const res =
        deleteMode === "filtered"
          ? await deleteResponsesByFilterAction(formId, filters)
          : await deleteResponsesAction(formId, Array.from(selectedIds))
      if (res.success) {
        window.location.reload()
      } else {
        alert("Falha ao excluir respostas.")
      }
    } catch {
      alert("Falha ao excluir respostas.")
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const isAllSelected = visibleResponses.length > 0 && selectedIds.size === visibleResponses.length

  async function handleExport() {
    setIsExporting(true)
    try {
      const csv = await exportResponsesAction(formId)
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

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-8 print-hide">
        <Link href={`/builder/${formId}`}>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />Editor
          </Button>
        </Link>

        <div className="flex-1 min-w-0 flex items-center gap-3">
          <h1 className="text-xl font-bold font-heading truncate max-w-[320px]" title={formTitle}>{formTitle}</h1>
          <Badge
            variant={formStatus === "published" ? "default" : "secondary"}
            className={formStatus === "published"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 font-semibold"
              : ""}
          >
            {formStatus === "published" ? "Publicado" : formStatus === "draft" ? "Rascunho" : "Fechado"}
          </Badge>
        </div>

        {/* Primary actions */}
        <div className="flex items-center gap-2">
          {/* Share public link */}
          <Button variant="outline" size="sm" className="gap-2" onClick={copyLink}>
            <Link2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{copied ? "Copiado!" : "Copiar link"}</span>
          </Button>

          {/* View form */}
          {formStatus === "published" && (
            <a href={`/f/${formSlug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Ver formulário</span>
              </Button>
            </a>
          )}

          {/* Share analytics */}
          <PublicShareDialog
            formId={formId}
            initialIsPublic={isAnalyticsPublic ?? false}
            initialShareToken={shareToken ?? null}
          />

          {/* ··· More actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 px-2.5">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                onClick={handleExport}
                disabled={isExporting || responses.length === 0}
                className="gap-2"
              >
                <FileDown className="h-4 w-4" />
                {isExporting ? "Exportando..." : "Exportar CSV"}
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="gap-2">
                <span onClick={() => document.querySelector<HTMLButtonElement>("[data-import-trigger]")?.click()} className="cursor-pointer gap-2 flex items-center">
                  <FileUp className="h-4 w-4" />Importar CSV
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />Salvar como PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                disabled={!pagination || pagination.total === 0}
                onClick={() => {
                  if (!pagination || pagination.total === 0) return
                  setDeleteMode("filtered")
                  setShowDeleteConfirm(true)
                }}
              >
                <Trash2 className="h-4 w-4" />
                {hasActiveFilters
                  ? `Excluir ${pagination?.total ?? 0} respostas filtradas`
                  : "Excluir todas as respostas"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hidden import trigger */}
          <div className="hidden">
            <ImportResponsesDialog formId={formId} />
          </div>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        <StatCard icon={Eye} label="Visualizações"
          value={(analytics?.totalViews ?? 0).toLocaleString("pt-BR")}
          sub="visitas únicas" />
        <StatCard icon={Users} label="Respostas"
          value={(analytics?.totalResponses ?? responses.length).toLocaleString("pt-BR")}
          sub={`${completedCount} completas`} />
        <StatCard icon={TrendingUp} label="Taxa de conclusão"
          value={pct(completionRate)}
          sub={`${responses.length} iniciadas`}
          accent />
        <StatCard icon={Clock} label="Tempo médio"
          value={avgTime > 0 ? formatDuration(avgTime) : "—"}
          sub="para concluir" />
      </div>

      {/* Completion progress bar */}
      <div className="mb-8">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${Math.round(completionRate * 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5 tabular-nums">
          {Math.round(completionRate * 100)}% de conclusão — {completedCount} de {responses.length} respostas completas
        </p>
      </div>

      {responses.length >= 1 && (
        <OnboardingBanner
          storageKey={ONBOARDING_KEYS.FIRST_RESPONSE_SEEN}
          icon={Sparkles}
          title="Primeiras respostas chegaram"
          description="Aproveite ao máximo: filtre, exporte, compartilhe um dashboard público ou conecte com outras ferramentas."
          className="mb-6 print-hide"
          actions={[
            {
              label: "Filtrar respostas",
              icon: Filter,
              onClick: () => {
                setTab("responses")
                setTimeout(() => {
                  document
                    .querySelector("[data-filter-bar]")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }, 50)
              },
              hint: "cruzamento",
            },
            {
              label: "Exportar CSV",
              icon: Download,
              onClick: handleExport,
            },
            {
              label: "Dashboard público",
              icon: Share2,
              onClick: () => {
                document
                  .querySelector<HTMLButtonElement>("[data-public-share-trigger]")
                  ?.click()
              },
            },
            {
              label: "Conectar integrações",
              icon: Zap,
              variant: "outline",
              onClick: () => router.push(`/builder/${formId}?tab=webhooks`),
            },
          ]}
        />
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="mb-6 print-hide">
          <TabsTrigger value="responses">
            Respostas ({pagination?.total ?? responses.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">Visão Geral</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "responses" && (
        <>
          <FilterBar
            filters={filters}
            onChange={applyFilters}
            sources={sources}
            crossFilters={crossFilters}
          />

          {selectedIds.size > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 flex items-center justify-between mb-4 animate-in slide-in-from-top-2">
              <span className="text-sm font-medium text-destructive">
                {selectedIds.size} resposta(s) selecionada(s)
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="h-8">
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 gap-2"
                  onClick={() => {
                    setDeleteMode("selected")
                    setShowDeleteConfirm(true)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </Button>
              </div>
            </div>
          )}

          <ResponsesTable
            responses={visibleResponses}
            questions={questions}
            onOpen={setOpenResponseIndex}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            isAllSelected={isAllSelected}
          />
          {pagination && (pagination.totalPages > 1 || pagination.total > 50) && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-xs text-muted-foreground">
                Página {pagination.page} de {pagination.totalPages} · {pagination.total} respostas
              </p>
              <div className="flex items-center gap-2">
                <select
                  className="h-8 rounded-lg border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                  value={pagination.pageSize}
                  onChange={(e) =>
                    router.push(buildUrl({ page: "1", pageSize: e.target.value }))
                  }
                  aria-label="Respostas por página"
                >
                  <option value="50">50 por página</option>
                  <option value="100">100 por página</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    router.push(buildUrl({ page: String(pagination.page - 1) }))
                  }
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    router.push(buildUrl({ page: String(pagination.page + 1) }))
                  }
                >
                  Próxima<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Excluir Respostas
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {deleteMode === "filtered" ? (
                    <>
                      Você está prestes a excluir <strong>{pagination?.total ?? 0}</strong>{" "}
                      {hasActiveFilters ? "respostas que correspondem aos filtros atuais" : "respostas (todas do formulário)"}.
                      Esta ação é permanente e não poderá ser desfeita.
                    </>
                  ) : (
                    <>
                      Você está prestes a excluir <strong>{selectedIds.size}</strong> resposta(s). Esta ação é permanente e não poderá ser desfeita.
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                  onClick={(e) => {
                    e.preventDefault()
                    handleDeleteResponses()
                  }}
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Excluir permanentemente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {openResponseIndex !== null && (
        <ResponseDetailPanel
          responses={visibleResponses}
          questions={questions}
          index={openResponseIndex}
          userPlan={userPlan}
          onClose={() => setOpenResponseIndex(null)}
          onNavigate={setOpenResponseIndex}
        />
      )}

      {tab === "analytics" && (
        <AnalyticsView
          formId={formId}
          initialAnalytics={analytics}
          questions={questions}
          answerFilter={filters.answerFilter}
        />
      )}
    </div>
  )
}
