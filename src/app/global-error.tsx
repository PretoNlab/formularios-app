"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RotateCcw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 font-sans antialiased">
        <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl border bg-card shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Ops! Algo deu errado</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ocorreu um erro inesperado no sistema. Nossa equipe de monitoramento foi notificada automaticamente.
            </p>
          </div>

          {error.digest && (
            <p className="text-[11px] font-mono text-muted-foreground/70 bg-muted px-2.5 py-1 rounded-md inline-block">
              Código do erro: {error.digest}
            </p>
          )}

          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              onClick={() => reset()}
              className="gap-2 rounded-full px-6 text-sm font-semibold shadow-md"
            >
              <RotateCcw className="h-4 w-4" />
              Tentar novamente
            </Button>
            <Button
              variant="outline"
              onClick={() => { window.location.href = "/dashboard" }}
              className="rounded-full px-5 text-sm"
            >
              Ir para o início
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
