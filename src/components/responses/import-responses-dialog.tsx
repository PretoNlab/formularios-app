"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  FileSpreadsheet, Upload, Loader2, AlertTriangle, CheckCircle2,
  ArrowRight, ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { previewCsvImportAction, importCsvResponsesAction } from "@/app/actions/import-responses"
import type { ColumnMapping, CsvPreviewResult } from "@/lib/import/csv-responses"

// ─── Props ──────────────────────────────────────────────────────────────────

interface QuestionOption {
  id: string
  title: string
  type: string
}

interface ImportResponsesDialogProps {
  formId: string
  questions: QuestionOption[]
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ImportResponsesDialog({ formId, questions }: ImportResponsesDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload")
  const [csvContent, setCsvContent] = useState("")
  const [fileName, setFileName] = useState("")
  const [preview, setPreview] = useState<CsvPreviewResult | null>(null)
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [importResult, setImportResult] = useState<{ imported: number; errors: number; warnings: string[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function reset() {
    setStep("upload")
    setCsvContent("")
    setFileName("")
    setPreview(null)
    setMappings([])
    setImportResult(null)
    setError(null)
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (!isOpen) reset()
  }

  // ── File select ──

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError("Arquivo muito grande (máximo 10MB)")
      return
    }
    setFileName(file.name)
    setError(null)
    const reader = new FileReader()
    reader.onload = (ev) => setCsvContent(ev.target?.result as string)
    reader.readAsText(file, "utf-8")
  }

  // ── Analyze ──

  function handleAnalyze() {
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
  }

  // ── Mapping change ──

  function handleMappingChange(csvIndex: number, questionId: string) {
    setMappings(mappings.map((m) => {
      if (m.csvIndex !== csvIndex) return m
      if (questionId === "") {
        return { ...m, questionId: null, questionTitle: null, questionType: null }
      }
      const q = questions.find((x) => x.id === questionId)
      return {
        ...m,
        questionId,
        questionTitle: q?.title ?? null,
        questionType: (q?.type ?? null) as ColumnMapping["questionType"],
      }
    }))
  }

  // ── Import ──

  function handleImport() {
    setError(null)
    startTransition(async () => {
      const res = await importCsvResponsesAction(
        formId, csvContent, mappings, preview?.detectedTimestampCol ?? null,
      )
      if (!res.success) {
        setError(res.error?.message ?? "Erro ao importar.")
        return
      }
      setImportResult(res.data!)
      setStep("result")
    })
  }

  const mappedCount = mappings.filter((m) => m.questionId !== null).length

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <FileSpreadsheet className="h-3.5 w-3.5" />
        Importar CSV
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar respostas via CSV</DialogTitle>
            <DialogDescription>
              Faça upload de um arquivo CSV exportado do Google Forms ou de outra plataforma.
            </DialogDescription>
          </DialogHeader>

          {/* ── Step 1: Upload ── */}
          {step === "upload" && (
            <div className="space-y-4 mt-2">
              <label className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-8 cursor-pointer transition-colors hover:border-muted-foreground/40 hover:bg-muted/50">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {fileName || "Clique para selecionar um arquivo CSV"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    .csv, .tsv ou .txt — máximo 10.000 linhas
                  </p>
                </div>
                <input type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={handleFileChange} disabled={isPending} />
              </label>

              {error && <ErrorBox message={error} />}

              <Button className="w-full" disabled={!csvContent || isPending} onClick={handleAnalyze}>
                {isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analisando...</>
                ) : (
                  <>Analisar arquivo<ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </div>
          )}

          {/* ── Step 2: Preview + Mapping ── */}
          {step === "preview" && preview && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {preview.totalRows.toLocaleString("pt-BR")} linhas encontradas
                </span>
                <Badge variant={mappedCount > 0 ? "default" : "secondary"}>
                  {mappedCount} de {mappings.length} colunas mapeadas
                </Badge>
              </div>

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

              {/* Debug info */}
              <p className="text-[10px] text-muted-foreground">
                {questions.length} perguntas disponíveis: {questions.map(q => q.title).join(", ")}
              </p>

              {/* Mapping */}
              <div className="space-y-2">
                {mappings.map((m) => (
                  <div key={m.csvIndex} className="flex items-center gap-3">
                    <span className="text-xs font-mono truncate w-[45%] shrink-0" title={m.csvHeader}>
                      {m.csvHeader}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">→</span>
                    <select
                      className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                      value={m.questionId ?? ""}
                      onChange={(e) => handleMappingChange(m.csvIndex, e.target.value)}
                    >
                      <option value="">— Ignorar —</option>
                      {questions.map((q) => (
                        <option key={q.id} value={q.id}>{q.title}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {error && <ErrorBox message={error} />}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setStep("upload"); setError(null) }} disabled={isPending}>
                  <ArrowLeft className="mr-2 h-4 w-4" />Voltar
                </Button>
                <Button className="flex-1" disabled={mappedCount === 0 || isPending} onClick={handleImport}>
                  {isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importando...</>
                  ) : (
                    `Importar ${preview.totalRows.toLocaleString("pt-BR")} respostas`
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Result ── */}
          {step === "result" && importResult && (
            <div className="space-y-4 mt-2">
              <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <div className="text-sm text-green-700 dark:text-green-300">
                  <p className="font-semibold">
                    {importResult.imported.toLocaleString("pt-BR")} resposta{importResult.imported !== 1 ? "s" : ""} importada{importResult.imported !== 1 ? "s" : ""} com sucesso!
                  </p>
                  {importResult.errors > 0 && (
                    <p className="mt-1 text-green-600 dark:text-green-400">
                      {importResult.errors} linha{importResult.errors !== 1 ? "s" : ""} ignorada{importResult.errors !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
              <Button className="w-full" onClick={() => { handleOpenChange(false); router.refresh() }}>
                Ver respostas
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-3">
      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
      <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
    </div>
  )
}
