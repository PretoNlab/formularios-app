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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { previewCsvImportAction, importCsvResponsesAction, createQuestionsFromHeadersAction } from "@/app/actions/import-responses"
import type { ColumnMapping } from "@/lib/import/csv-responses"

// ─── Types ──────────────────────────────────────────────────────────────────

interface QuestionItem {
  id: string
  title: string
  type: string
}

interface PreviewData {
  totalRows: number
  mappings: ColumnMapping[]
  previewRows: string[][]
  warnings: string[]
  detectedTimestampCol: number | null
  questionsJson: string
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ImportResponsesDialog({ formId }: { formId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [csvContent, setCsvContent] = useState("")
  const [fileName, setFileName] = useState("")
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [importResult, setImportResult] = useState<{ imported: number; errors: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) {
      setStep(1)
      setCsvContent("")
      setFileName("")
      setPreview(null)
      setQuestions([])
      setMappings([])
      setImportResult(null)
      setError(null)
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError("Arquivo muito grande (máximo 10MB)"); return }
    setFileName(file.name)
    setError(null)
    const reader = new FileReader()
    reader.onload = (ev) => setCsvContent(ev.target?.result as string)
    reader.readAsText(file, "utf-8")
  }

  function onAnalyze() {
    setError(null)
    startTransition(async () => {
      const res = await previewCsvImportAction(formId, csvContent)
      if (!res.success) { setError(res.error?.message ?? "Erro"); return }
      const data = res.data!
      setPreview(data)
      setMappings(data.mappings)
      try {
        setQuestions(JSON.parse(data.questionsJson))
      } catch {
        setQuestions([])
      }
      setStep(2)
    })
  }

  function onGenerateQuestions() {
    setGenerating(true)
    setError(null)
    const headers = mappings.map((m) => m.csvHeader)
    
    startTransition(async () => {
      const res = await createQuestionsFromHeadersAction(formId, headers)
      if (!res.success) {
        setError(res.error?.message ?? "Erro ao criar perguntas.")
        setGenerating(false)
        return
      }

      // Re-run the preview to auto-map the newly created questions
      const previewRes = await previewCsvImportAction(formId, csvContent)
      setGenerating(false)

      if (!previewRes.success) {
        setError(previewRes.error?.message ?? "Perguntas criadas, mas falha ao atualizar pre-visualização.")
        return
      }

      const data = previewRes.data!
      setPreview(data)
      setMappings(data.mappings)
      try {
        setQuestions(JSON.parse(data.questionsJson))
      } catch {
        setQuestions([])
      }
    })
  }

  function onMapping(csvIndex: number, qId: string) {
    const updated = mappings.map((m) => {
      if (m.csvIndex !== csvIndex) return m
      if (qId === "") {
        return { ...m, questionId: null, questionTitle: null, questionType: null }
      }
      const q = questions.find((x) => x.id === qId)
      return {
        ...m,
        questionId: qId,
        questionTitle: q?.title ?? null,
        questionType: (q?.type ?? null) as ColumnMapping["questionType"],
      }
    })
    setMappings(updated)
  }

  function onImport() {
    setError(null)
    startTransition(async () => {
      const res = await importCsvResponsesAction(
        formId, csvContent, mappings, preview?.detectedTimestampCol ?? null,
      )
      if (!res.success) { setError(res.error?.message ?? "Erro"); return }
      setImportResult(res.data!)
      setStep(3)
    })
  }

  const mapped = mappings.filter((m) => m.questionId).length

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
              Faça upload de um CSV exportado do Google Forms ou de outra plataforma.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            {/* ════ STEP 1 ════ */}
            {step === 1 && (
              <div className="space-y-4">
                <label className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-8 cursor-pointer hover:border-muted-foreground/40">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">{fileName || "Selecione um arquivo CSV"}</p>
                  <p className="text-xs text-muted-foreground">máximo 10.000 linhas</p>
                  <input type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={onFileChange} />
                </label>
                {error && <ErrorMsg text={error} />}
                <Button className="w-full" disabled={!csvContent || isPending} onClick={onAnalyze}>
                  {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analisando...</> : <>Analisar<ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
              </div>
            )}

            {/* ════ STEP 2 ════ */}
            {step === 2 && preview && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{preview.totalRows} linhas</span>
                  <Badge variant={mapped > 0 ? "default" : "secondary"}>
                    {mapped}/{mappings.length} mapeadas
                  </Badge>
                </div>

                {preview.warnings.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-3 text-xs text-amber-700 dark:text-amber-300">
                    {preview.warnings.map((w, i) => <p key={i}>{w}</p>)}
                  </div>
                )}

                {questions.length === 0 && (
                  <div className="rounded-lg border-2 border-dashed p-5 flex flex-col items-center justify-center gap-3 bg-muted/20">
                    <p className="text-sm text-center text-muted-foreground">
                      Este formulário parece estar vazio (0 perguntas).<br/>
                      Quer criar automaticamente uma pergunta de texto curto para cada coluna deste arquivo CSV?
                    </p>
                    <Button
                      size="sm"
                      onClick={onGenerateQuestions}
                      disabled={generating}
                    >
                      {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...</> : "Sim, gerar perguntas do CSV"}
                    </Button>
                  </div>
                )}

                <p className="text-[11px] text-muted-foreground border rounded p-2 bg-muted/30">
                  <strong>{questions.length} perguntas no formulário:</strong>{" "}
                  {questions.length === 0
                    ? "Nenhuma pergunta encontrada!"
                    : questions.map((q) => q.title).join(" | ")}
                  <br />
                  <strong>Mapeadas: {mapped}</strong> — questionsJson length: {preview.questionsJson.length} chars
                </p>

                <div className="space-y-3">
                  {mappings.map((m, idx) => {
                    const selectId = `csv-map-${idx}`
                    return (
                      <div key={idx} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <label htmlFor={selectId} className="text-xs font-mono truncate" title={m.csvHeader}>
                          {m.csvHeader}
                        </label>
                        <span className="text-muted-foreground text-xs">→</span>
                        <Select
                          value={m.questionId ?? "ignore"}
                          onValueChange={(val: string) => onMapping(m.csvIndex, val === "ignore" ? "" : val)}
                        >
                          <SelectTrigger id={selectId} className="h-8 text-xs">
                            <SelectValue placeholder="— Ignorar —" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ignore">— Ignorar —</SelectItem>
                            {questions.map((q) => (
                              <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  })}
                </div>

                {error && <ErrorMsg text={error} />}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)} disabled={isPending}>
                    <ArrowLeft className="mr-2 h-4 w-4" />Voltar
                  </Button>
                  <Button className="flex-1" disabled={mapped === 0 || isPending} onClick={onImport}>
                    {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importando...</> : `Importar ${preview.totalRows} respostas`}
                  </Button>
                </div>
              </div>
            )}

            {/* ════ STEP 3 ════ */}
            {step === 3 && importResult && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                    {importResult.imported} resposta{importResult.imported !== 1 ? "s" : ""} importada{importResult.imported !== 1 ? "s" : ""} com sucesso!
                  </p>
                </div>
                <Button className="w-full" onClick={() => { handleOpenChange(false); router.refresh() }}>
                  Ver respostas
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ErrorMsg({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-3">
      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
      <p className="text-sm text-red-700 dark:text-red-300">{text}</p>
    </div>
  )
}
