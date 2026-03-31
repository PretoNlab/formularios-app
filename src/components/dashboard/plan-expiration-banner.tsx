import Link from "next/link"
import { AlertTriangle, XCircle } from "lucide-react"

interface PlanExpirationBannerProps {
  plan: string
  planExpiresAt: string | null
}

export function PlanExpirationBanner({ plan, planExpiresAt }: PlanExpirationBannerProps) {
  if (plan === "free" || !planExpiresAt) return null

  const expiresAt = new Date(planExpiresAt)
  const now = new Date()
  const expired = expiresAt <= now
  const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 86_400_000))
  const expiringSoon = !expired && daysLeft <= 30

  if (!expired && !expiringSoon) return null

  if (expired) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4 flex items-start gap-3">
        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1 text-sm text-red-700 dark:text-red-300">
          <span className="font-semibold">Seu plano Fundador expirou.</span>{" "}
          Formulários publicados não estão aceitando novas respostas.{" "}
          <Link href="/billing" className="font-semibold underline hover:opacity-80">
            Renovar plano
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm text-amber-700 dark:text-amber-300">
        <span className="font-semibold">Seu plano expira em {daysLeft} dia{daysLeft !== 1 ? "s" : ""}.</span>{" "}
        Renove para continuar recebendo respostas.{" "}
        <Link href="/billing" className="font-semibold underline hover:opacity-80">
          Renovar plano
        </Link>
      </div>
    </div>
  )
}
