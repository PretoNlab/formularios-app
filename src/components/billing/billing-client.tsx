"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { FOUNDER_PLAN, TOPUP_PACKS } from "@/lib/credits"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle2, Loader2, ShoppingCart, Gift, Star, X,
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
  checkoutIntent?: string
  returnStatus?: string
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

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "")
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += Number(digits[i]) * (10 - i)
  let check = 11 - (sum % 11)
  if (check >= 10) check = 0
  if (Number(digits[9]) !== check) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += Number(digits[i]) * (11 - i)
  check = 11 - (sum % 11)
  if (check >= 10) check = 0
  return Number(digits[10]) === check
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
  checkoutIntent,
  returnStatus,
}: BillingClientProps) {
  const router = useRouter()
  const [purchasing, setPurchasing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pollingStatus, setPollingStatus] = useState<"idle" | "polling" | "confirmed" | "timeout">(
    returnStatus === "success" ? "polling" : "idle"
  )
  const [showCanceled, setShowCanceled] = useState(returnStatus === "canceled")
  const [cpfModal, setCpfModal] = useState<{ packId: string } | null>(null)
  const [cpf, setCpf] = useState("")
  const [cpfError, setCpfError] = useState<string | null>(null)

  const isFounder = plan === "founder"
  const planActive = isFounder && (!planExpiresAt || new Date(planExpiresAt) > new Date())
  const planExpired = isFounder && planExpiresAt && new Date(planExpiresAt) <= new Date()

  // Auto-trigger checkout from signup flow
  const autoTriggered = useRef(false)
  useEffect(() => {
    if (checkoutIntent === "founder" && (!isFounder || planExpired) && !autoTriggered.current) {
      autoTriggered.current = true
      setCpfModal({ packId: FOUNDER_PLAN.id })
      window.history.replaceState({}, "", "/billing")
    }
  }, [checkoutIntent, isFounder, planExpired])

  // Poll for payment confirmation on return from AbacatePay
  const pollPayment = useCallback(async () => {
    const orderId = sessionStorage.getItem("pendingOrderId")
    if (!orderId) {
      // No orderId — maybe already confirmed, show confirmed state
      if (returnStatus === "success") setPollingStatus("confirmed")
      return
    }

    setPollingStatus("polling")
    window.history.replaceState({}, "", "/billing")

    const maxAttempts = 30 // 60 seconds
    let attempts = 0

    const interval = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`/api/credits/order/${orderId}`)
        if (!res.ok) return
        const data = await res.json() as { status: string }
        if (data.status === "paid") {
          clearInterval(interval)
          sessionStorage.removeItem("pendingOrderId")
          setPollingStatus("confirmed")
          router.refresh()
        }
      } catch { /* ignore */ }

      if (attempts >= maxAttempts) {
        clearInterval(interval)
        sessionStorage.removeItem("pendingOrderId")
        setPollingStatus("timeout")
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [returnStatus, router])

  useEffect(() => {
    if (returnStatus === "success") {
      pollPayment()
    } else if (returnStatus) {
      window.history.replaceState({}, "", "/billing")
    }
  }, [returnStatus, pollPayment])

  const days = planExpiresAt ? daysRemaining(planExpiresAt) : 0
  const responsePercent = responseQuota > 0 ? Math.min(100, Math.round((responseUsed / responseQuota) * 100)) : 0
  const formPercent = formQuota > 0 ? Math.min(100, Math.round((publishedFormsCount / formQuota) * 100)) : 0

  function openCpfModal(packId: string) {
    setCpf("")
    setCpfError(null)
    setCpfModal({ packId })
  }

  async function handleConfirmPurchase() {
    if (!cpfModal) return
    const digits = cpf.replace(/\D/g, "")
    if (!isValidCpf(digits)) {
      setCpfError("CPF inválido. Verifique e tente novamente.")
      return
    }

    setCpfError(null)
    setPurchasing(true)
    setError(null)

    try {
      const res = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: cpfModal.packId, taxId: digits }),
      })
      const data = await res.json() as { orderId?: string; url?: string; error?: string }
      if (!res.ok || data.error) {
        setError(data.error ?? "Erro ao gerar cobrança.")
        setPurchasing(false)
        setCpfModal(null)
        return
      }

      if (data.orderId) {
        sessionStorage.setItem("pendingOrderId", data.orderId)
      }
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError("Erro de rede. Tente novamente.")
      setPurchasing(false)
      setCpfModal(null)
    }
  }

  return (
    <div className="container mx-auto max-w-3xl py-10 px-4 space-y-8">

      {/* Payment status banners */}
      {pollingStatus === "polling" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 p-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 animate-spin" />
          <div className="flex-1 text-sm text-blue-700 dark:text-blue-300">
            <span className="font-semibold">Verificando pagamento...</span> aguarde enquanto confirmamos.
          </div>
        </div>
      )}

      {pollingStatus === "confirmed" && (
        <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
          <div className="flex-1 text-sm text-green-700 dark:text-green-300">
            <span className="font-semibold">Pagamento confirmado!</span> Seu plano foi atualizado.
          </div>
          <button onClick={() => setPollingStatus("idle")} className="text-green-600 dark:text-green-400 hover:opacity-70">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {pollingStatus === "timeout" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1 text-sm text-amber-700 dark:text-amber-300">
            O pagamento pode levar alguns minutos para ser processado. Recarregue a página em instantes.
          </div>
          <button onClick={() => { setPollingStatus("idle"); router.refresh() }} className="text-amber-600 dark:text-amber-400 hover:opacity-70 text-sm font-medium underline">
            Recarregar
          </button>
        </div>
      )}

      {showCanceled && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1 text-sm text-amber-700 dark:text-amber-300">
            Pagamento cancelado. Você pode tentar novamente quando quiser.
          </div>
          <button onClick={() => setShowCanceled(false)} className="text-amber-600 dark:text-amber-400 hover:opacity-70">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1 text-sm text-destructive">{error}</div>
          <button onClick={() => setError(null)} className="text-destructive hover:opacity-70">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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

      {/* CTA: free or expired → show founder plan */}
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
              <p className="text-2xl font-bold">R$499</p>
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

          <Button
            className="w-full"
            size="lg"
            disabled={purchasing}
            onClick={() => openCpfModal(FOUNDER_PLAN.id)}
          >
            {purchasing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Star className="h-4 w-4 mr-2" />}
            {purchasing ? "Redirecionando…" : "Quero entrar no Lote Fundador"}
          </Button>
        </div>
      )}

      {/* Top-ups: only for active founder plan */}
      {planActive && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recargas</h2>
            <p className="text-sm text-muted-foreground mt-1">Você começa com uma franquia anual e só compra mais capacidade quando fizer sentido.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TOPUP_PACKS.map((pack) => (
              <button
                key={pack.id}
                disabled={purchasing}
                onClick={() => openCpfModal(pack.id)}
                className="rounded-2xl border bg-card p-5 text-left transition-all hover:shadow-md hover:border-primary/50 group disabled:opacity-50 disabled:pointer-events-none"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {pack.formQuota > 0 ? "Formulários" : "Respostas"}
                  </span>
                </div>
                <p className="text-xl font-bold">{pack.name}</p>
                <p className="text-lg font-bold text-primary mt-2">R${pack.priceReais}</p>
                <div className="mt-3 w-full rounded-lg border border-primary/20 bg-primary/5 py-2 text-center text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Pagar via PIX
                </div>
              </button>
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
            Adquira o Lote Fundador novamente para continuar recebendo respostas.
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

      {/* CPF Modal */}
      <Dialog open={!!cpfModal} onOpenChange={(v) => { if (!v) setCpfModal(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Informar CPF</DialogTitle>
            <DialogDescription>Precisamos do seu CPF para emitir a cobrança via PIX.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="cpf-input">CPF</Label>
              <Input
                id="cpf-input"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => { setCpf(formatCpf(e.target.value)); setCpfError(null) }}
                onKeyDown={(e) => { if (e.key === "Enter") handleConfirmPurchase() }}
                maxLength={14}
                inputMode="numeric"
              />
              {cpfError && <p className="text-xs text-destructive">{cpfError}</p>}
            </div>
            <Button
              className="w-full"
              disabled={purchasing || cpf.replace(/\D/g, "").length < 11}
              onClick={handleConfirmPurchase}
            >
              {purchasing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {purchasing ? "Redirecionando…" : "Continuar para pagamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
