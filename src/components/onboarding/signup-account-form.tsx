"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, ArrowRight, CheckCircle2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { getAppUrl } from "@/lib/utils"
import { signupAction } from "@/app/actions/auth"
import { prepareSignupDraftAction } from "@/app/actions/onboarding"
import type { SignupDraft } from "@/lib/onboarding/draft"

export function SignupAccountForm({ draft }: { draft: SignupDraft }) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [resendAt, setResendAt] = useState(0)
  const [resent, setResent] = useState(false)
  const callback = () => `${getAppUrl()}/auth/callback?next=${encodeURIComponent("/onboarding/complete")}`

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    form.set("signupDraft", JSON.stringify(draft))
    if (new URLSearchParams(window.location.search).get("plan") === "founder") form.set("plan", "founder")
    setLoading(true)
    setError(null)
    try {
      const result = await signupAction(form)
      if (result.success) setSuccess(true)
      else setError(result.error ?? "Não foi possível criar sua conta.")
    } catch (err: unknown) {
      if (err instanceof Error && (err.message === "NEXT_REDIRECT" || ("digest" in err && typeof err.digest === "string" && err.digest.includes("NEXT_REDIRECT")))) return
      setError("Não foi possível criar sua conta. Tente novamente.")
    } finally { setLoading(false) }
  }

  async function handleGoogle() {
    setLoading(true)
    setError(null)
    try {
      await prepareSignupDraftAction(draft)
      const { error: oauthError } = await createClient().auth.signInWithOAuth({
        provider: "google", options: { redirectTo: callback() },
      })
      if (oauthError) throw oauthError
    } catch {
      setError("Não foi possível entrar com Google. Tente novamente ou use seu e-mail.")
      setLoading(false)
    }
  }

  async function resend() {
    if (Date.now() < resendAt) { setError("Aguarde um minuto antes de reenviar."); return }
    setLoading(true)
    setError(null)
    try {
      const { error: resendError } = await createClient().auth.resend({
        type: "signup", email, options: { emailRedirectTo: callback() },
      })
      if (resendError) throw resendError
      setResendAt(Date.now() + 60000)
      setResent(true)
    } catch { setError("Não foi possível reenviar o e-mail. Tente novamente.") }
    finally { setLoading(false) }
  }

  if (success) return <section className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6" aria-live="polite">
    <CheckCircle2 className="h-8 w-8 text-emerald-700" />
    <h2 className="text-2xl font-semibold">Só falta confirmar seu e-mail.</h2>
    <p className="text-sm leading-relaxed text-stone-600">Enviamos um link para <strong>{email}</strong>. Confirme sua conta para abrir seu formulário e liberar os créditos da oferta. Suas escolhas estão guardadas.</p>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {resent && <p className="text-sm text-emerald-700">E-mail reenviado. Confira também a pasta de spam.</p>}
    <Button variant="outline" disabled={loading} onClick={() => void resend()}>Reenviar e-mail</Button>
    <Link className="block text-sm underline" href="/login?next=%2Fonboarding%2Fcomplete">Já confirmei, entrar</Link>
  </section>

  return <div className="space-y-5">
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent p-4 text-stone-900 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
        <Sparkles className="h-4 w-4 text-amber-600" />
        Oferta para os 50 primeiros
      </div>
      <p className="mt-1 text-base font-bold text-amber-950">
        50 garantidos + 15 extras conquistados 🎁
      </p>
      <p className="mt-0.5 text-xs text-stone-600 leading-relaxed">
        Crie sua conta para ganhar os últimos 5 e começar com 70 créditos.
      </p>
    </div>

    {process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true" && <>
      <Button type="button" variant="outline" className="h-12 w-full bg-white" disabled={loading} onClick={() => void handleGoogle()}>Continuar com Google</Button>
      <p className="text-center text-xs text-stone-500">ou crie sua conta com e-mail</p>
    </>}
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="name">Seu nome</Label><Input id="name" name="name" required maxLength={100} autoComplete="name" placeholder="Como podemos chamar você?" className="h-12 bg-white" /></div>
      <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" required maxLength={254} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@empresa.com" className="h-12 bg-white" /></div>
      <div className="space-y-2"><Label htmlFor="password">Crie uma senha</Label><Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="Pelo menos 8 caracteres" className="h-12 bg-white" /></div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-stone-900 text-white hover:bg-stone-800">
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando sua conta…</> : <>Criar conta e salvar formulário <ArrowRight className="ml-2 h-4 w-4" /></>}
      </Button>
      <p className="text-center text-xs text-stone-500">Sem cartão de crédito. Seu formulário será salvo como rascunho.</p>
      <p className="text-center text-xs leading-relaxed text-stone-500">Ao criar sua conta, você concorda com os <Link href="/terms" className="underline">Termos de Uso</Link> e a <Link href="/privacy" className="underline">Política de Privacidade</Link>.</p>
    </form>
  </div>
}
