"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Upload, Loader2, AlertTriangle, CheckCircle2, FileJson } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { importFromGoogleFormsAction, importFromJsonAction } from "@/app/actions/import"
import type { ImportWarning } from "@/lib/import/types"

export function ImportFormDialog() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <Upload className="h-4 w-4" />
        Importar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar formulário</DialogTitle>
            <DialogDescription>
              Importe um formulário de outra plataforma ou de um arquivo JSON.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="google" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="google" className="flex-1 text-xs">Google Forms</TabsTrigger>
              <TabsTrigger value="json" className="flex-1 text-xs">JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="google" className="mt-4">
              <GoogleFormsTab onClose={() => setOpen(false)} />
            </TabsContent>

            <TabsContent value="json" className="mt-4">
              <JsonTab onClose={() => setOpen(false)} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Google Forms Tab ───────────────────────────────────────────────────────

function GoogleFormsTab({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ formId: string; warnings: ImportWarning[] } | null>(null)

  const isValidUrl = url.includes("docs.google.com/forms")

  function handleImport() {
    setError(null)
    startTransition(async () => {
      const res = await importFromGoogleFormsAction(url)
      if (!res.success) {
        setError(res.error?.message ?? "Erro ao importar.")
        return
      }
      if (res.data!.warnings.length > 0) {
        setResult(res.data!)
      } else {
        onClose()
        router.push(`/builder/${res.data!.formId}`)
      }
    })
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div className="text-sm text-green-700 dark:text-green-300">
            <span className="font-semibold">Formulário importado com sucesso!</span>
          </div>
        </div>

        {result.warnings.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                {result.warnings.length} aviso{result.warnings.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ul className="space-y-1">
              {result.warnings.map((w, i) => (
                <li key={i} className="text-xs text-amber-600 dark:text-amber-400">
                  Pergunta {w.questionIndex + 1} ({w.originalType}): {w.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          className="w-full"
          onClick={() => {
            onClose()
            router.push(`/builder/${result.formId}`)
          }}
        >
          Abrir no Builder
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">URL do Google Forms</label>
        <Input
          placeholder="https://docs.google.com/forms/d/e/.../viewform"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(null) }}
          disabled={isPending}
        />
        <p className="text-[11px] text-muted-foreground mt-1.5">
          O formulário precisa estar aberto para respostas (público).
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-3">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <Button
        className="w-full"
        disabled={!isValidUrl || isPending}
        onClick={handleImport}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Importando...
          </>
        ) : (
          "Importar formulário"
        )}
      </Button>
    </div>
  )
}

// ─── JSON Tab ───────────────────────────────────────────────────────────────

function JsonTab({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [json, setJson] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ formId: string; warnings: ImportWarning[] } | null>(null)

  function handleImport() {
    setError(null)
    startTransition(async () => {
      const res = await importFromJsonAction(json)
      if (!res.success) {
        setError(res.error?.message ?? "Erro ao importar.")
        return
      }
      if (res.data!.warnings.length > 0) {
        setResult(res.data!)
      } else {
        onClose()
        router.push(`/builder/${res.data!.formId}`)
      }
    })
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div className="text-sm text-green-700 dark:text-green-300">
            <span className="font-semibold">Formulário importado com sucesso!</span>
          </div>
        </div>
        <Button
          className="w-full"
          onClick={() => {
            onClose()
            router.push(`/builder/${result.formId}`)
          }}
        >
          Abrir no Builder
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">
          <FileJson className="inline h-4 w-4 mr-1.5 -mt-0.5" />
          Cole o JSON do formulário
        </label>
        <textarea
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[160px] resize-y"
          placeholder={`{
  "title": "Meu formulário",
  "questions": [
    {
      "type": "short_text",
      "title": "Qual seu nome?",
      "required": true
    }
  ]
}`}
          value={json}
          onChange={(e) => { setJson(e.target.value); setError(null) }}
          disabled={isPending}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-3">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">{error}</p>
        </div>
      )}

      <Button
        className="w-full"
        disabled={!json.trim() || isPending}
        onClick={handleImport}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Importando...
          </>
        ) : (
          "Importar formulário"
        )}
      </Button>
    </div>
  )
}
