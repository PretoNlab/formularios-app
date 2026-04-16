"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Table2, CheckCircle2, ExternalLink, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getFormIntegrationsAction,
  getGoogleSheetsAuthUrlAction,
  disconnectGoogleSheetsAction,
} from "@/app/actions/integrations"
import type { IntegrationRow } from "@/lib/db/queries/integrations"

export function GoogleSheetsPanel({ formId }: { formId: string }) {
  const router = useRouter()
  const [integration, setIntegration] = useState<IntegrationRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, startSaveTransition] = useTransition()
  const [isConnecting, startConnectTransition] = useTransition()

  // Load integration on mount; clean up ?sheets= param if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has("sheets")) {
      const url = new URL(window.location.href)
      url.searchParams.delete("sheets")
      router.replace(url.pathname + url.search)
    }

    getFormIntegrationsAction(formId)
      .then((rows) => {
        setIntegration(rows.find((r) => r.type === "google_sheets") ?? null)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [formId, router])

  function handleConnect() {
    startConnectTransition(async () => {
      const path = await getGoogleSheetsAuthUrlAction(formId)
      window.location.href = path
    })
  }

  function handleDisconnect() {
    startSaveTransition(async () => {
      await disconnectGoogleSheetsAction(formId)
      setIntegration(null)
    })
  }

  const config = integration?.config as { spreadsheetId?: string; spreadsheetTitle?: string; sheetName?: string; lastError?: string; lastErrorAt?: string } | undefined
  const isExpired = !!config?.lastError?.includes("invalid_grant")
  const isConfigured = !isExpired && integration?.enabled && config?.spreadsheetId && config?.sheetName
  const lastTriggeredAt = integration?.lastTriggeredAt ? new Date(integration.lastTriggeredAt) : null

  return (
    <div className="p-4 space-y-4 border-t">
      <div className="flex items-center gap-2">
        <Table2 className="h-4 w-4 text-green-600" />
        <div>
          <p className="text-sm font-semibold">Google Sheets</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Enviar respostas para uma planilha</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </div>
      ) : isExpired ? (
        // ── State 3: Expired (invalid_grant) ──
        <div className="rounded-lg border bg-amber-500/5 border-amber-500/30 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium">Conexão expirada</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                O acesso ao Google foi revogado ou expirou. Reconecte para voltar a enviar as respostas para a planilha.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ExternalLink className="h-3 w-3 mr-1" />}
              Reconectar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={handleDisconnect}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      ) : isConfigured ? (
        // ── State 2: Configured ──
        <div className="rounded-lg border bg-green-500/5 border-green-500/20 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="text-xs font-medium truncate">{config!.spreadsheetTitle ?? "Planilha configurada"}</p>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${config!.spreadsheetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">Aba: <span className="font-medium">{config!.sheetName}</span></p>
              {lastTriggeredAt && !config?.lastError && (
                <p className="text-[11px] text-muted-foreground truncate">
                  Última sync: {lastTriggeredAt.toLocaleString("pt-BR")}
                </p>
              )}
              {config?.lastError && (
                <p className="text-[11px] text-destructive truncate" title={config.lastError}>
                  Erro: {config.lastError.length > 40 ? config.lastError.slice(0, 40) + "…" : config.lastError}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive w-full"
            onClick={handleDisconnect}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
            Desconectar
          </Button>
        </div>
      ) : (
        // ── State 1: Not connected ──
        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 text-xs gap-2"
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          Conectar com Google
        </Button>
      )}
    </div>
  )
}
