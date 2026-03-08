"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Sparkles, AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error tracking service (ex: Sentry) when available
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 text-center">
      <div className="space-y-6 max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="flex bg-foreground text-background items-center justify-center p-1 rounded-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm">formularios.ia</span>
        </Link>

        <div className="flex justify-center">
          <div className="flex bg-destructive/10 text-destructive items-center justify-center p-4 rounded-2xl">
            <AlertTriangle className="h-8 w-8" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Algo deu errado</h1>
          <p className="text-muted-foreground text-sm">
            Ocorreu um erro inesperado. Nossa equipe foi notificada.
            {error.digest && (
              <span className="block mt-1 font-mono text-xs text-muted-foreground/60">
                Código: {error.digest}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Ir para o painel</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
