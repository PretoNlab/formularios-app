"use client"

import { useState, useRef } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import type { Form } from "@/lib/types/form"
import { cn } from "@/lib/utils"

interface FormConfigPanelProps {
  form: Form
  onTitleChange: (t: string) => void
  onDescriptionChange: (d: string) => void
  onSettingsChange: (s: Partial<Form["settings"]>) => void
  onSlugChange: (slug: string) => void
}

function DownloadFileUploadButton({ onUrl }: { onUrl: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const body = new FormData()
      body.append("file", file)
      const res = await fetch("/api/upload/completion-file", { method: "POST", body })
      if (!res.ok) throw new Error("Falha no upload.")
      const data = await res.json() as { url: string }
      onUrl(data.url)
    } catch {
      alert("Erro ao fazer upload do arquivo. Tente novamente.")
    } finally {
      setUploading(false)
      if (ref.current) ref.current.value = ""
    }
  }

  return (
    <>
      <input ref={ref} type="file" className="hidden" accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg" onChange={handleFile} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 shrink-0 text-xs"
        disabled={uploading}
        onClick={() => ref.current?.click()}
      >
        {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Upload"}
      </Button>
    </>
  )
}

export function FormConfigPanel({ form, onTitleChange, onDescriptionChange, onSettingsChange, onSlugChange }: FormConfigPanelProps) {
  const [slugError, setSlugError] = useState("")
  
  const emailQuestions = form.questions?.filter((q) => q.type === "email") ?? []

  function handleSlugChange(raw: string) {
    const formatted = raw.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    onSlugChange(formatted)
    if (formatted.length > 0 && formatted.length < 3) {
      setSlugError("Mínimo de 3 caracteres")
    } else if (formatted.length > 60) {
      setSlugError("Máximo de 60 caracteres")
    } else {
      setSlugError("")
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://formularios.ia"

  return (
    <div className="p-4 pr-6 space-y-6 overflow-x-hidden w-full">
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Título</label>
        <Input
          value={form.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Formulário sem título"
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
        <textarea
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[72px] resize-none"
          value={form.description ?? ""}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Descrição opcional..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">URL pública</label>
        <div className={cn("flex items-center rounded-md border bg-background overflow-hidden text-sm min-w-0 w-full", slugError ? "border-destructive" : "border-input")}>
          <span className="px-2 py-2 text-muted-foreground bg-muted border-r border-input text-xs shrink-0">/f/</span>
          <input
            className="flex-1 px-2 py-2 bg-transparent outline-none focus-visible:ring-0 text-sm min-w-0"
            value={form.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="meu-formulario"
            spellCheck={false}
          />
        </div>
        {slugError ? (
          <p className="text-[11px] text-destructive">{slugError}</p>
        ) : (
          <p className="text-[11px] text-muted-foreground truncate">{origin}/f/{form.slug}</p>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Exibição</h4>

        <div className="flex items-center justify-between gap-4 pr-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Barra de progresso</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Mostra % de conclusão</p>
          </div>
          <Switch
            className="shrink-0"
            checked={form.settings?.showProgressBar ?? false}
            onCheckedChange={(v) => onSettingsChange({ showProgressBar: v })}
          />
        </div>

        <div className="flex items-center justify-between gap-4 pr-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Numerar perguntas</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Ex: "1 →"</p>
          </div>
          <Switch
            className="shrink-0"
            checked={form.settings?.showQuestionNumbers ?? false}
            onCheckedChange={(v) => onSettingsChange({ showQuestionNumbers: v })}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conclusão</h4>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Mensagem de encerramento</label>
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[60px] resize-none"
            value={form.settings.closeMessage}
            onChange={(e) => onSettingsChange({ closeMessage: e.target.value })}
            placeholder="Sua resposta foi registrada."
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Redirecionar para (URL)</label>
          <Input
            type="url"
            value={form.settings.redirectUrl ?? ""}
            onChange={(e) => onSettingsChange({ redirectUrl: e.target.value || null })}
            placeholder="https://exemplo.com/obrigado"
            className="text-sm h-9"
          />
          <p className="text-[11px] text-muted-foreground">Após conclusão, redireciona para esta URL.</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Arquivo para download</label>
          <div className="flex gap-2">
            <Input
              type="url"
              value={form.settings.downloadUrl ?? ""}
              onChange={(e) => onSettingsChange({ downloadUrl: e.target.value || null })}
              placeholder="https://drive.google.com/..."
              className="text-sm h-9 flex-1"
            />
            <DownloadFileUploadButton onUrl={(url) => onSettingsChange({ downloadUrl: url })} />
          </div>
          <Input
            type="text"
            value={form.settings.downloadLabel ?? ""}
            onChange={(e) => onSettingsChange({ downloadLabel: e.target.value || null })}
            placeholder="Texto do botão (ex: Baixar material)"
            className="text-sm h-9"
          />
          <p className="text-[11px] text-muted-foreground">Exibe um botão de download na tela de conclusão.</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Controle de acesso</h4>

        <div className="flex items-center justify-between gap-4 pr-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Salvar respostas parciais</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Salva progresso mesmo sem concluir</p>
          </div>
          <Switch
            className="shrink-0"
            checked={form.settings?.allowPartialResponses ?? false}
            onCheckedChange={(v) => onSettingsChange({ allowPartialResponses: v })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Limite de respostas</label>
          <Input
            type="number"
            min={1}
            value={form.settings.responseLimit ?? ""}
            onChange={(e) => onSettingsChange({ responseLimit: e.target.value ? Number(e.target.value) : null })}
            placeholder="Ilimitado"
            className="text-sm h-9"
          />
          <p className="text-[11px] text-muted-foreground">Fecha automaticamente ao atingir o número.</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Encerrar em</label>
          <Input
            type="datetime-local"
            value={form.settings.closedAt ? new Date(form.settings.closedAt).toISOString().slice(0, 16) : ""}
            onChange={(e) => onSettingsChange({ closedAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
            className="text-sm h-9"
          />
          <p className="text-[11px] text-muted-foreground">Fecha automaticamente na data e hora definidas.</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notificações</h4>

        <div className="flex items-center justify-between gap-4 pr-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Encaminhar respostas</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Envia cópia das respostas por e-mail</p>
          </div>
          <Switch
            className="shrink-0"
            checked={form.settings?.notifyOnResponse ?? false}
            onCheckedChange={(v) => onSettingsChange({ notifyOnResponse: v })}
          />
        </div>

        {form.settings.notifyOnResponse && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">E-mail(s) de destino <span className="font-normal">(sep. por vírgula)</span></label>
            <Input
              type="text"
              value={form.settings.notificationEmail ?? ""}
              onChange={(e) => onSettingsChange({ notificationEmail: e.target.value || null })}
              placeholder="email@exemplo.com, outro@exemplo.com"
              className="text-sm h-9"
            />
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Auto-Responder</h4>

        <div className="flex items-center justify-between gap-4 pr-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">E-mail para o Respondente</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Enviar uma confirmação ou material automático</p>
          </div>
          <Switch
            className="shrink-0"
            checked={form.settings?.autoResponderEnabled ?? false}
            onCheckedChange={(v) => onSettingsChange({ autoResponderEnabled: v })}
          />
        </div>

        {form.settings.autoResponderEnabled && (
          <div className="space-y-4 pt-2 border-l-2 border-border pl-3 ml-1">
            {emailQuestions.length === 0 ? (
              <p className="text-sm text-destructive">
                Você precisa adicionar uma pergunta do tipo "E-mail" ao seu formulário para usar o Auto-Responder.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Campo de destino</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.settings.autoResponderEmailFieldId ?? ""}
                    onChange={(e) => onSettingsChange({ autoResponderEmailFieldId: e.target.value || null })}
                  >
                    <option value="" disabled>Selecione a pergunta de e-mail...</option>
                    {emailQuestions.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title || "Pergunta sem título"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Assunto do E-mail</label>
                  <Input
                    type="text"
                    value={form.settings.autoResponderSubject ?? ""}
                    onChange={(e) => onSettingsChange({ autoResponderSubject: e.target.value || null })}
                    placeholder="Confirmação de Resposta"
                    className="text-sm h-9"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Corpo do E-mail</label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[120px] resize-y"
                    value={form.settings.autoResponderBody ?? ""}
                    onChange={(e) => onSettingsChange({ autoResponderBody: e.target.value || null })}
                    placeholder="Olá! Muito obrigado por responder. Segue em anexo o que você solicitou..."
                  />
                  <p className="text-[11px] text-muted-foreground">Use parágrafos normais. Nós formataremos como um belo e-mail padronizado.</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
