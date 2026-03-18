"use client"

import { useState, useEffect, useRef } from "react"
import { CREDIT_PACKS } from "@/lib/credits"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Copy, Loader2, Coins, Zap, TrendingUp, ShoppingCart, Gift } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string
  amount: number
  type: string
  createdAt: string
  metadata: Record<string, unknown> | null
}

interface BillingClientProps {
  creditBalance: number
  transactions: Transaction[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

function txIcon(type: string) {
  if (type === "welcome") return <Gift className="h-4 w-4 text-violet-500" />
  if (type === "purchase") return <ShoppingCart className="h-4 w-4 text-green-500" />
  return <TrendingUp className="h-4 w-4 text-red-400" />
}

function txLabel(type: string) {
  if (type === "welcome") return "Créditos de boas-vindas"
  if (type === "purchase") return "Compra de créditos"
  return "Uso de créditos"
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function useCountdown(expiresAt: string | null) {
  const [remaining, setRemaining] = useState<number>(0)

  useEffect(() => {
    if (!expiresAt) return
    const target = new Date(expiresAt).getTime()
    const tick = () => {
      const diff = Math.max(0, Math.floor((target - Date.now()) / 1000))
      setRemaining(diff)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  const m = Math.floor(remaining / 60).toString().padStart(2, "0")
  const s = (remaining % 60).toString().padStart(2, "0")
  return { display: `${m}:${s}`, expired: remaining === 0 }
}

// ─── PIX Modal ────────────────────────────────────────────────────────────────

interface PixModalProps {
  open: boolean
  onClose: () => void
  onPaid: (credits: number) => void
  packName: string
  packCredits: number
  packPriceReais: number
  orderId: string | null
  pixCode: string | null
  pixQrBase64: string | null
  expiresAt: string | null
  loading: boolean
  error: string | null
}

function PixModal({
  open, onClose, onPaid,
  packName, packCredits, packPriceReais,
  orderId, pixCode, pixQrBase64, expiresAt,
  loading, error,
}: PixModalProps) {
  const [copied, setCopied] = useState(false)
  const [paid, setPaid] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { display: countdown, expired } = useCountdown(expiresAt)

  useEffect(() => {
    if (!orderId || paid) return

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/credits/order/${orderId}`)
        if (!res.ok) return
        const data = await res.json() as { status: string; credits: number }
        if (data.status === "paid") {
          setPaid(true)
          clearInterval(pollRef.current!)
          setTimeout(() => {
            onPaid(data.credits)
          }, 2000)
        }
      } catch { /* ignore */ }
    }, 3000)

    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [orderId, paid, onPaid])

  function handleClose() {
    if (pollRef.current) clearInterval(pollRef.current)
    setPaid(false)
    onClose()
  }

  function handleCopy() {
    if (!pixCode) return
    navigator.clipboard.writeText(pixCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="max-w-sm gap-0 p-0 overflow-hidden">
        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-base">
              {packName} — R${packPriceReais}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {packCredits.toLocaleString("pt-BR")} créditos via PIX
            </DialogDescription>
          </DialogHeader>

          {loading && (
            <div className="flex flex-col items-center py-10 gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Gerando QR Code...</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {paid && (
            <div className="flex flex-col items-center py-10 gap-3">
              <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/30">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="font-semibold text-green-700 dark:text-green-400">Pagamento confirmado!</p>
              <p className="text-sm text-muted-foreground">
                +{packCredits.toLocaleString("pt-BR")} créditos adicionados à sua conta.
              </p>
            </div>
          )}

          {!loading && !error && !paid && pixCode && (
            <div className="flex flex-col items-center gap-4">
              {/* QR Code */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(pixCode)}&size=200x200`}
                alt="QR Code PIX"
                className="w-48 h-48 rounded-xl border"
              />

              {/* Copia-e-cola */}
              <div className="w-full space-y-1.5">
                <p className="text-xs text-muted-foreground text-center font-medium">Ou copie o código PIX</p>
                <div className="flex gap-2">
                  <div className="flex-1 rounded-md border bg-muted/30 px-3 py-2 text-xs font-mono truncate text-muted-foreground">
                    {pixCode}
                  </div>
                  <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
                    {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Status */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {expired ? (
                  <span className="text-destructive">QR Code expirado</span>
                ) : (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Aguardando pagamento…</span>
                    <span className="font-mono text-xs tabular-nums">{countdown}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BillingClient({ creditBalance: initialBalance, transactions }: BillingClientProps) {
  const [balance, setBalance] = useState(initialBalance)
  const [selectedPack, setSelectedPack] = useState<typeof CREDIT_PACKS[number] | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [pixCode, setPixCode] = useState<string | null>(null)
  const [pixQrBase64, setPixQrBase64] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  async function handleSelectPack(pack: typeof CREDIT_PACKS[number]) {
    setSelectedPack(pack)
    setModalOpen(true)
    setLoading(true)
    setError(null)
    setOrderId(null)
    setPixCode(null)
    setPixQrBase64(null)
    setExpiresAt(null)

    try {
      const res = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: pack.id }),
      })
      const data = await res.json() as {
        orderId?: string; pixCode?: string; pixQrBase64?: string; expiresAt?: string; error?: string
      }
      if (!res.ok || data.error) {
        setError(data.error ?? "Erro ao gerar cobrança.")
        return
      }
      setOrderId(data.orderId!)
      setPixCode(data.pixCode!)
      setPixQrBase64(data.pixQrBase64!)
      setExpiresAt(data.expiresAt!)
    } catch {
      setError("Erro de rede. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  function handlePaid(credits: number) {
    setBalance((prev) => prev + credits)
    setModalOpen(false)
  }

  return (
    <div className="container mx-auto max-w-3xl py-10 px-4 space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Créditos</h1>
        <p className="text-muted-foreground text-sm mt-1">Compre créditos para receber respostas nos seus formulários.</p>
      </div>

      {/* Balance card */}
      <div className="rounded-2xl border bg-card p-6 flex items-center gap-5">
        <div className="rounded-xl bg-primary/10 p-4">
          <Coins className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Saldo atual</p>
          <p className="text-4xl font-bold tabular-nums">{balance.toLocaleString("pt-BR")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">crédito{balance !== 1 ? "s" : ""} disponíveis</p>
        </div>
      </div>

      {/* Packs */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Comprar créditos</h2>
        <div className="grid grid-cols-2 gap-3">
          {CREDIT_PACKS.map((pack) => {
            const highlight = pack.id === "pro"
            return (
              <button
                key={pack.id}
                onClick={() => handleSelectPack(pack)}
                className={cn(
                  "relative rounded-2xl border p-5 text-left transition-all hover:shadow-md hover:border-primary/50 group",
                  highlight ? "border-primary/30 bg-primary/5" : "bg-card"
                )}
              >
                {highlight && (
                  <Badge className="absolute top-3 right-3 text-[10px] px-2 py-0.5 bg-primary text-primary-foreground">
                    Popular
                  </Badge>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <Zap className={cn("h-4 w-4", highlight ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{pack.name}</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">{pack.credits.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground mb-4">créditos</p>
                <div className="flex items-baseline justify-between">
                  <p className="text-lg font-bold">R${pack.priceReais}</p>
                  <p className="text-xs text-muted-foreground">R${(pack.priceCents / pack.credits / 100).toFixed(3)}/cr</p>
                </div>
                <div className="mt-3 w-full rounded-lg border border-primary/20 bg-primary/5 py-2 text-center text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Pagar via PIX
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Transaction history */}
      {transactions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Histórico</h2>
          <div className="rounded-xl border overflow-hidden">
            {transactions.map((tx, i) => (
              <div key={tx.id} className={cn("flex items-center gap-3 px-4 py-3", i > 0 && "border-t")}>
                <div className="rounded-full bg-muted p-2">
                  {txIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{txLabel(tx.type)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                </div>
                <span className={cn(
                  "text-sm font-semibold tabular-nums",
                  tx.amount > 0 ? "text-green-600 dark:text-green-400" : "text-red-500"
                )}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString("pt-BR")} cr
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedPack && (
        <PixModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onPaid={handlePaid}
          packName={selectedPack.name}
          packCredits={selectedPack.credits}
          packPriceReais={selectedPack.priceReais}
          orderId={orderId}
          pixCode={pixCode}
          pixQrBase64={pixQrBase64}
          expiresAt={expiresAt}
          loading={loading}
          error={error}
        />
      )}
    </div>
  )
}
