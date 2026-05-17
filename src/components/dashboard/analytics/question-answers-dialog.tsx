"use client"

import { useEffect, useState, useMemo } from "react"
import { Search, Loader2, MessageSquare } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  getQuestionAnswersAction,
  type QuestionAnswerRow,
} from "@/app/actions/responses"

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso))
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (Array.isArray(value)) return value.map((v) => String(v)).join(", ")
  if (typeof value === "object") {
    try { return JSON.stringify(value) } catch { return "" }
  }
  return String(value)
}

export function QuestionAnswersDialog({
  open,
  onOpenChange,
  formId,
  questionId,
  questionTitle,
  totalAnswers,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  formId: string
  questionId: string
  questionTitle: string
  totalAnswers: number
}) {
  const [rows, setRows] = useState<QuestionAnswerRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError(null)
    getQuestionAnswersAction(formId, questionId).then((res) => {
      if (cancelled) return
      if (res.success) setRows(res.data ?? [])
      else setError(res.error?.message ?? "Erro ao carregar respostas.")
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [open, formId, questionId])

  // Reset query when opening
  useEffect(() => {
    if (open) setQuery("")
  }, [open])

  const filtered = useMemo(() => {
    if (!rows) return []
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => renderValue(r.value).toLowerCase().includes(q))
  }, [rows, query])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-base font-semibold line-clamp-2 pr-8">
            {questionTitle || "Pergunta sem título"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {rows
              ? `${filtered.length.toLocaleString("pt-BR")}${
                  query ? ` de ${rows.length.toLocaleString("pt-BR")}` : ""
                } respostas`
              : `${totalAnswers.toLocaleString("pt-BR")} respostas`}
          </p>
        </DialogHeader>

        <div className="px-6 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar nas respostas..."
              className="pl-9 h-9"
              disabled={loading || !!error}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="px-6 py-4">
            {loading && (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm">Carregando respostas...</span>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive text-center py-12">{error}</p>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 opacity-30 mb-3" />
                <p className="text-sm">
                  {query
                    ? "Nenhuma resposta corresponde à busca."
                    : "Nenhuma resposta ainda."}
                </p>
              </div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <ul className="space-y-2">
                {filtered.map((r) => {
                  const text = renderValue(r.value)
                  return (
                    <li
                      key={r.responseId}
                      className="rounded-lg border bg-card/40 px-4 py-3"
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{text}</p>
                      <p className="text-[11px] text-muted-foreground mt-1.5 tabular-nums">
                        {formatDate(r.startedAt)}
                        {r.completedAt ? " · completa" : " · parcial"}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
