"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, ArrowRight, Check, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { completeSignupDraftAction } from "@/app/actions/onboarding"
import { DRAFT_KEY } from "@/lib/onboarding/draft"

export function CompleteSignup() {
  const router = useRouter()
  const started = useRef(false)
  const [requiresLogin, setRequiresLogin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [creditBalance, setCreditBalance] = useState(70)
  async function complete() {
    setError(null)
    setRequiresLogin(false)
    try {
      const result = await completeSignupDraftAction()
      if (result.requiresLogin) setRequiresLogin(true)
      if (!result.formId) { setError(result.error ?? "Tente novamente."); return }
      try { localStorage.removeItem(DRAFT_KEY) } catch { /* Storage may be unavailable. */ }
      setCreditBalance(result.creditBalance ?? 70)
      setCompleted(true)
      await new Promise(resolve => setTimeout(resolve, 900))
      router.replace(`/builder/${result.formId}?welcome=true`)
    } catch { setError("Não foi possível conectar. Tente novamente para recuperar seu formulário.") }
  }
  useEffect(() => {
    if (started.current) return
    started.current = true
    void complete()
    // Run only on entry. The stable server-side ID protects retries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <main className="min-h-screen grid place-items-center bg-stone-50 p-6">
    <div className="max-w-md text-center space-y-5" role="status">
      {!error && !completed && <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-600" />}
      {completed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 18 }}
          className="mx-auto w-fit rounded-3xl border border-amber-500/30 bg-amber-50 px-7 py-5 text-amber-950 shadow-lg"
        >
          <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.5 }}>
            <Sparkles className="mx-auto mb-2 h-7 w-7 text-amber-600" />
          </motion.div>
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-700">
            <Check className="h-4 w-4" /> +5 créditos
          </div>
          <p className="mt-1 text-2xl font-bold">{creditBalance} créditos</p>
          <p className="text-xs text-stone-600">{creditBalance - 20} garantidos + 20 extras</p>
        </motion.div>
      )}
      <h1 className="text-3xl font-semibold">{completed ? "Tudo pronto!" : "Seu primeiro formulário, do seu jeito."}</h1>
      <p className="text-stone-600">
        {error ?? (completed ? `Seus ${creditBalance} créditos foram liberados. Abrindo o editor...` : "Preparando sua conta e seu formulário no editor...")}
      </p>
      {error && !requiresLogin && <Button onClick={() => void complete()}>Tentar novamente <ArrowRight className="ml-2 h-4 w-4" /></Button>}
      {requiresLogin && <Link href="/login?next=%2Fonboarding%2Fcomplete" className="block text-sm underline">Entrar para continuar</Link>}
      <Link href="/dashboard" className="block text-sm underline">Ir para o painel</Link>
    </div>
  </main>
}
