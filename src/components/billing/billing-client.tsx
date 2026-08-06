"use client"

import { FOUNDER_PLAN, TOPUP_PACKS } from "@/lib/credits"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle2, Gift, Star, ShoppingCart,
  CalendarDays, BarChart3, FileText, Zap, AlertTriangle,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string
  amount: number
  type: string
  createdAt: string
  metadata: Record<string, unknown> | null
}

interface BillingClientProps {
  plan: string
  planExpiresAt: string | null
  responseQuota: number
  responseUsed: number
  formQuota: number
  publishedFormsCount: number
  transactions: Transaction[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
}

function daysRemaining(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))
}

function txLabel(type: string, metadata: Record<string, unknown> | null) {
  if (type === "welcome") return "Boas-vindas"
  if (type === "purchase") {
    const pack = metadata?.packId as string | undefined
    if (pack === "founder") return "Lote Fundador — 12 meses"
    if (pack === "responses_500") return "Recarga +500 respostas"
    if (pack === "responses_1000") return "Recarga +1.000 respostas"
    if (pack === "forms_5") return "Recarga +5 formulários"
    return "Compra"
  }
  return "Uso"
}

function txIcon(type: string) {
  if (type === "welcome") return <Gift className="h-4 w-4 text-violet-500" />
  if (type === "purchase") return <ShoppingCart className="h-4 w-4 text-green-500" />
  return <BarChart3 className="h-4 w-4 text-red-400" />
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function BillingClient({
  plan,
  planExpiresAt,
  responseQuota,
  responseUsed,
  formQuota,
  publishedFormsCount,
  transactions,
}: BillingClientProps) {
  const isFounder = plan === "founder"
  const planActive = isFounder && (!planExpiresAt || new Date(planExpiresAt) > new Date())
  const planExpired = isFounder && planExpiresAt && new Date(planExpiresAt) <= new Date()

  const days = planExpiresAt ? daysRemaining(planExpiresAt) : 0
  const responsePercent = responseQuota > 0 ? Math.min(100, Math.round((responseUsed / responseQuota) * 100)) : 0
  const formPercent = formQuota > 0 ? Math.min(100, Math.round((publishedFormsCount / formQuota) * 100)) : 0

  return (
    <div className="container mx-auto max-w-3xl py-10 px-4 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plano</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie seu plano e capacidade.</p>
      </div>

      {/* Plan status card */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={cn("rounded-xl p-3", planActive ? "bg-green-100 dark:bg-green-900/30" : planExpired ? "bg-red-100 dark:bg-red-900/30" : "bg-muted")}>
              <Star className={cn("h-5 w-5", planActive ? "text-green-600 dark:text-green-400" : planExpired ? "text-red-500" : "text-muted-foreground")} />
            </div>
            <div>
              <p className="font-semibold">{planActive ? "Lote Fundador" : planExpired ? "Lote Fundador (expirado)" : "Plano gratuito"}</p>
              <p className="text-sm text-muted-foreground">
                {planActive && planExpiresAt ? `Expira em ${days} dia${days !== 1 ? "s" : ""} — ${formatDate(planExpiresAt)}` : planExpired && planExpiresAt ? `Expirou em ${formatDate(planExpiresAt)}` : "Até 3 formulários e 50 respostas para experimentar"}
              </p>
            </div>
          </div>
          <Badge variant={planActive ? "default" : planExpired ? "destructive" : "secondary"}>
            {planActive ? "Ativo" : planExpired ? "Expirado" : "Gratuito"}
          </Badge>
        </div>

        {/* Usage bars (only when has any quota) */}
        {(isFounder || responseQuota > 0) && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground"><BarChart3 className="h-3.5 w-3.5" /> Respostas</span>
                <span className="font-medium tabular-nums">{responseUsed.toLocaleString("pt-BR")} / {responseQuota.toLocaleString("pt-BR")}</span>
              </div>
              <Progress value={responsePercent} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground"><FileText className="h-3.5 w-3.5" /> Formulários publicados</span>
                <span className="font-medium tabular-nums">{publishedFormsCount} / {formQuota}</span>
              </div>
              <Progress value={formPercent} className="h-2" />
            </div>
          </div>
        )}
      </div>

      {/* CTA: free or expired → show founder plan (compra temporariamente indisponível) */}
      {(!isFounder || planExpired) && (
        <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 space-y-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-3 mt-0.5">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Lote Fundador</h2>
              <p className="text-sm text-muted-foreground">Sem renovação mensal. Sem surpresas. Sem obrigação de upgrade logo de início.</p>
            </div>
            <div className="ml-auto text-right shrink-0">
              <p className="text-2xl font-bold">R${FOUNDER_PLAN.priceReais}</p>
              <p className="text-xs text-muted-foreground">por 12 meses</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              "Até 10 formulários publicados",
              "Rascunhos ilimitados",
              "Até 2.500 respostas por ano",
              "Personalização básica",
              "Exportação de respostas",
              "Suporte padrão",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700 dark:text-amber-300">
              Compra temporariamente indisponível. Entre em contato pelo suporte se quiser entrar no Lote Fundador.
            </div>
          </div>
        </div>
      )}

      {/* Top-ups: only for active founder plan (compra temporariamente indisponível) */}
      {planActive && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recargas</h2>
            <p className="text-sm text-muted-foreground mt-1">Você começa com uma franquia anual. Recargas avulsas estão temporariamente indisponíveis.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TOPUP_PACKS.map((pack) => (
              <div
                key={pack.id}
                className="rounded-2xl border bg-card p-5 text-left opacity-60"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {pack.formQuota > 0 ? "Formulários" : "Respostas"}
                  </span>
                </div>
                <p className="text-xl font-bold">{pack.name}</p>
                <p className="text-lg font-bold text-primary mt-2">R${pack.priceReais}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            As recargas de respostas somam ao saldo atual e valem enquanto o plano estiver ativo.
          </p>
        </div>
      )}

      {/* Warning: plan expires soon */}
      {planActive && days <= 30 && days > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700 dark:text-amber-300">
            <span className="font-semibold">Seu plano expira em {days} dia{days !== 1 ? "s" : ""}.</span>{" "}
            Renove o Lote Fundador para continuar recebendo respostas.
          </div>
        </div>
      )}

      {/* Transaction history */}
      {transactions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Histórico</h2>
          <div className="rounded-xl border overflow-hidden">
            {transactions.map((tx, i) => (
              <div key={tx.id} className={cn("flex items-center gap-3 px-4 py-3", i > 0 && "border-t")}>
                <div className="rounded-full bg-muted p-2">{txIcon(tx.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{txLabel(tx.type, tx.metadata)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
