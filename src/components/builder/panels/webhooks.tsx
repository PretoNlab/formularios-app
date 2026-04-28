"use client"

import { useState, useEffect, useTransition } from "react"
import { Plus, Loader2, Webhook, Zap, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  getFormIntegrationsAction,
  createWebhookAction,
  toggleIntegrationAction,
  deleteIntegrationAction,
} from "@/app/actions/integrations"
import type { IntegrationRow } from "@/lib/db/queries/integrations"
import { cn } from "@/lib/utils"

export function WebhooksPanel({ formId }: { formId: string }) {
  const [webhooks, setWebhooks] = useState<IntegrationRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getFormIntegrationsAction(formId)
      .then((rows) => setWebhooks(rows.filter((r) => r.type === "webhook")))
      .finally(() => setIsLoading(false))
  }, [formId])

  function handleCreate() {
    if (!newUrl.trim()) return
    startTransition(async () => {
      const created = await createWebhookAction(formId, newName.trim() || "Webhook", newUrl.trim())
      if (created) {
        setWebhooks((prev) => [...prev, created])
        setNewName("")
        setNewUrl("")
        setShowAdd(false)
      }
    })
  }

  function handleToggle(id: string, enabled: boolean) {
    startTransition(async () => {
      await toggleIntegrationAction(id, enabled, formId)
      setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, enabled } : w)))
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteIntegrationAction(id, formId)
      setWebhooks((prev) => prev.filter((w) => w.id !== id))
    })
  }

  return (
    <div className="p-4 pr-6 space-y-4 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Webhooks</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">POST ao receber nova resposta</p>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowAdd((v) => !v)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Adicionar
        </Button>
      </div>

      {showAdd && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <Input
            placeholder="Nome (ex: n8n, Zapier)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="text-sm h-8"
          />
          <Input
            type="url"
            placeholder="https://hooks.exemplo.com/..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="text-sm h-8"
          />
          <div className="flex gap-2">
            <Button size="sm" className="h-8 text-xs flex-1" onClick={handleCreate} disabled={!newUrl.trim() || isPending}>
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Salvar"}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setShowAdd(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm">Carregando...</span>
        </div>
      ) : webhooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
          <Webhook className="h-8 w-8 mb-3 opacity-20" />
          <p className="text-sm">Nenhum webhook configurado.</p>
          <p className="text-[11px] mt-1">Adicione uma URL para receber notificações.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {webhooks.map((w) => {
            const url = (w.config as { url?: string })?.url ?? ""
            return (
              <div key={w.id} className="rounded-lg border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between gap-2 pr-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <Zap className={cn("h-3.5 w-3.5 shrink-0", w.enabled ? "text-green-500" : "text-muted-foreground")} />
                    <span className="text-sm font-medium truncate">{w.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Switch
                      checked={w.enabled}
                      onCheckedChange={(v) => handleToggle(w.id, v)}
                      className="scale-75"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(w.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{url}</p>
              </div>
            )
          })}
        </div>
      )}

      <Separator />

      <div className="rounded-lg bg-muted/40 p-3 space-y-1">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Payload enviado</p>
        <pre className="text-[10px] text-muted-foreground leading-relaxed overflow-x-auto">{`{
  "event": "response.completed",
  "formId": "...",
  "responseId": "...",
  "answers": { "questionId": value },
  "submittedAt": "ISO date"
}`}</pre>
      </div>
    </div>
  )
}
