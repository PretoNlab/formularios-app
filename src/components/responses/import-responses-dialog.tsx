"use client"

import { useState, useTransition, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  FileSpreadsheet, Upload, Loader2, AlertTriangle, CheckCircle2,
  ArrowRight, ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  previewCsvImportAction,
  importCsvResponsesAction,
  getFormQuestionsAction,
} from "@/app/actions/import-responses"
import type { ColumnMapping, CsvPreviewResult } from "@/lib/import/csv-responses"

// ─── Types ──────────────────────────────────────────────────────────────────

interface QuestionOption {
  id: string
  title: string
  type: string
}

interface ImportResponsesDialogProps {
  formId: string
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ImportResponsesDialog({ formId }: ImportResponsesDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <FileSpreadsheet className="h-3.5 w-3.5" />
        Importar CSV
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar respostas via CSV</DialogTitle>
            <DialogDescription>
              Faça upload de um arquivo CSV exportado do Google Forms ou de outra plataforma.
            </DialogDescription>
          </DialogHeader>

          {open && (
            <ImportFlow
              formId={formId}
              onClose={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Import Flow (3 steps) ──────────────────────────────────────────────────

type Step = "upload" | "preview" | "result"

interface ImportResultData {
  imported: number
  errors: number
  warnings: string[]
}

function ImportFlow({
  formId,
  onClose,
}: {
  formId: string
  onClose: () => void
}) {
  const router = useRouter()
  const [step, setStep] = useState<Step>("upload")
  const [csvContent, setCsvContent] = useState("")
  const [fileName, setFileName] = useState("")
  const [preview, setPreview] = useState<CsvPreviewResult | null>(null)
  const [questions, setQuestions] = useState<QuestionOption[]>([])
  const [questionsLoaded, setQuestionsLoaded] = useState(false)
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [result, setResult] = useState<ImportResultData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // ── Load questions on mount ──
  useEffect(() => {
    getFormQuestionsAction(formId).then((res) => {
      if (res.success && res.data) {
        setQuestions(res.data)
      }
      setQuestionsLoaded(true)
    })
  }, [formId])

  // ── Step 1: Upload ──

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".csv") && !file.name.endsWith(".tsv") && !file.name.endsWith(".txt")) {
      setError("Selecione um arquivo .csv, .tsv ou .txt")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Arquivo muito grande (máximo 10MB)")
      return
    }

    setFileName(file.name)
    setError(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      setCsvContent(ev.target?.result as string)
    }
    reader.readAsText(file, "utf-8")
  }, [])

  const handleAnalyze = useCallback(() => {
    setError(null)
    startTransition(async () => {
      const res = await previewCsvImportAction(formId, csvContent)
      if (!res.success) {
        setError(res.error?.message ?? "Erro ao analisar o arquivo.")
        return
      }
      setPreview(res.data!)
      setMappings(res.data!.mappings)
      setStep("preview")
    })
  }, [formId, csvContent])

  // ── Step 2: Preview ──

  const handleMappingChange = useCallback((csvIndex: number, questionId: string) => {
    setMappings((prev) =>
      prev.map((m) => {
        if (m.csvIndex !== csvIndex) return m
        if (questionId === "") {
          return { ...m, questionId: null, questionTitle: null, questionType: null }
        }
        const q = questions.find((x) => x.id === questionId)
        if (!q) return m
        return {
          ...m,
          questionId: q.id,
          questionTitle: q.title,
          questionType: q.type as ColumnMapping["questionType"],
        }
      }),
    )
  }, [questions])

  const mappedCount = mappings.filter((m) => m.questionId !== null).length

  const handleImport = useCallback(() => {
    setError(null)
    startTransition(async () => {
      const res = await importCsvResponsesAction(
        formId,
        csvContent,
        mappings,
        preview?.detectedTimestampCol ?? null,
      )
      if (!res.success) {
        setError(res.error?.message ?? "Erro ao importar.")
        return
      }
      setResult(res.data!)
      setStep("result")
    })
  }, [formId, csvContent, mappings, preview])

  // ── Render ──

  if (step === "upload") {
    return (
      <div className="space-y-4 mt-2">
        <label
          className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-8 cursor-pointer transition-colors hover:border-muted-foreground/40 hover:bg-muted/50"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">
              {fileName || "Clique para selecionar um arquivo CSV"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              .csv, .tsv ou .txt — máximo 10.000 linhas
            </p>
          </div>
          <input
            type="file"
            accept=".csv,.tsv,.txt"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isPending}
          />
        </label>

        {!questionsLoaded && (
          <p className="text-xs text-muted-foreground text-center">Carregando perguntas do formulário...</p>
        )}

        {questionsLoaded && questions.length === 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Este formulário não possui perguntas. Adicione perguntas no Builder antes de importar respostas.
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-3">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <Button
          className="w-full"
          disabled={!csvContent || isPending || questions.length === 0}
          onClick={handleAnalyze}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              Analisar arquivo
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    )
  }

  if (step === "preview" && preview) {
    return (
      <div className="space-y-4 mt-2">
        {/* Summary */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {preview.totalRows.toLocaleString("pt-BR")} linhas encontradas
          </span>
          <Badge variant={mappedCount > 0 ? "default" : "secondary"}>
            {mappedCount} de {mappings.length} colunas mapeadas
          </Badge>
        </div>

        {/* Warnings */}
        {preview.warnings.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">Avisos</span>
            </div>
            <ul className="space-y-1">
              {preview.warnings.map((w, i) => (
                <li key={i} className="text-xs text-amber-600 dark:text-amber-400">{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Mapping table */}
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Coluna CSV</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  Mapear para ({questions.length} perguntas)
                </th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m) => (
                <tr key={m.csvIndex} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs truncate max-w-[200px]" title={m.csvHeader}>
                    {m.csvHeader}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={m.questionId ?? ""}
                      onChange={(e) => handleMappingChange(m.csvIndex, e.target.value)}
                    >
                      <option value="">— Ignorar —</option>
                      {questions.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.title}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Preview rows */}
        {preview.previewRows.length > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              Ver preview das primeiras linhas
            </summary>
            <div className="mt-2 overflow-x-auto rounded-lg border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    {mappings.map((m) => (
                      <th key={m.csvIndex} className="px-2 py-1 text-left font-medium text-muted-foreground whitespace-nowrap">
                        {m.csvHeader}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.previewRows.map((row, i) => (
                    <tr key={i} className="border-t">
                      {mappings.map((m) => (
                        <td key={m.csvIndex} className="px-2 py-1 truncate max-w-[150px]" title={row[m.csvIndex]}>
                          {row[m.csvIndex] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-3">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => { setStep("upload"); setError(null) }}
            disabled={isPending}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button
            className="flex-1"
            disabled={mappedCount === 0 || isPending}
            onClick={handleImport}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              `Importar ${preview.totalRows.toLocaleString("pt-BR")} respostas`
            )}
          </Button>
        </div>
      </div>
    )
  }

  if (step === "result" && result) {
    return (
      <div className="space-y-4 mt-2">
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div className="text-sm text-green-700 dark:text-green-300">
            <p className="font-semibold">
              {result.imported.toLocaleString("pt-BR")} resposta{result.imported !== 1 ? "s" : ""} importada{result.imported !== 1 ? "s" : ""} com sucesso!
            </p>
            {result.errors > 0 && (
              <p className="mt-1 text-green-600 dark:text-green-400">
                {result.errors} linha{result.errors !== 1 ? "s" : ""} com erro{result.errors !== 1 ? "s" : ""} (ignorada{result.errors !== 1 ? "s" : ""})
              </p>
            )}
          </div>
        </div>

        {result.warnings.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-3">
            <ul className="space-y-1">
              {result.warnings.map((w, i) => (
                <li key={i} className="text-xs text-amber-600 dark:text-amber-400">{w}</li>
              ))}
            </ul>
          </div>
        )}

        <Button
          className="w-full"
          onClick={() => {
            onClose()
            router.refresh()
          }}
        >
          Ver respostas
        </Button>
      </div>
    )
  }

  return null
}
