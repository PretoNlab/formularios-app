"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { getAppUrl } from "@/lib/utils"
import { GoogleLoginButton } from "@/app/(auth-pages)/login/google-button"

// ─── Password strength ────────────────────────────────────────────────────────

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: "", color: "" }
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  const labels = ["", "Muito fraca", "Fraca", "Boa", "Forte"]
  const colors = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500"]
  const textColors = ["", "text-red-500", "text-orange-400", "text-yellow-500", "text-green-600"]
  return { score, label: labels[score], color: colors[score], textColor: textColors[score] } as { score: number; label: string; color: string; textColor: string }
}

// ─── Confirmation screen ──────────────────────────────────────────────────────

function ConfirmationScreen({ email }: { email: string }) {
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendMsg, setResendMsg] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const supabase = createClient()

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  async function handleResend() {
    setResendMsg(null)
    const { error } = await supabase.auth.resend({ type: "signup", email })
    if (!error) {
      setResendMsg("E-mail reenviado!")
      setResendCooldown(60)
      intervalRef.current = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) {
            clearInterval(intervalRef.current!)
            setResendMsg(null)
            return 0
          }
          return c - 1
        })
      }, 1000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="max-w-md w-full text-center space-y-8">

        {/* Animated mail icon */}
        <div className="flex justify-center">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-foreground text-background shadow-xl">
            <Mail className="h-12 w-12" />
            <span className="absolute -top-1 -right-1 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-5 w-5 rounded-full bg-green-500" />
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Verifique seu e-mail</h1>
          <p className="text-muted-foreground">
            Enviamos um link de ativação para{" "}
            <strong className="text-foreground">{email}</strong>.
            <br />Clique no link para ativar sua conta.
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-green-600 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            <span>Conta criada</span>
          </div>
          <div className="h-px w-8 bg-border" />
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold">2</span>
            <span>Confirme o e-mail</span>
          </div>
          <div className="h-px w-8 bg-border" />
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">3</span>
            <span>Comece a criar</span>
          </div>
        </div>

        {/* Mail provider shortcuts */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" className="rounded-full gap-2" asChild>
            <a href="https://mail.google.com/" target="_blank" rel="noopener noreferrer">
              <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Abrir Gmail
            </a>
          </Button>
          <Button variant="outline" size="sm" className="rounded-full gap-2" asChild>
            <a href="https://outlook.live.com/" target="_blank" rel="noopener noreferrer">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#0078D4" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
              </svg>
              Abrir Outlook
            </a>
          </Button>
        </div>

        {/* Resend */}
        <div className="space-y-2">
          {resendMsg && (
            <p className="text-sm text-green-600 font-medium">{resendMsg}</p>
          )}
          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={handleResend}
            disabled={resendCooldown > 0}
          >
            {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : "Reenviar e-mail"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Não recebeu? Verifique a pasta de spam.
          </p>
        </div>

        <Button variant="outline" asChild className="rounded-full">
          <Link href="/login">Voltar para o login</Link>
        </Button>
      </div>
    </div>
  )
}

// ─── Signup page ──────────────────────────────────────────────────────────────

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()
  const strength = getPasswordStrength(password) as { score: number; label: string; color: string; textColor: string }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${getAppUrl()}/auth/callback?next=${encodeURIComponent(
          window.location.search.includes("plan=founder") 
            ? "/billing?checkout=founder" 
            : "/dashboard?welcome=true"
        )}`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return <ConfirmationScreen email={email} />
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — branding panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-foreground p-12 text-background">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex bg-background text-foreground items-center justify-center p-1 rounded-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">formularios.ia</span>
        </Link>

        <div className="space-y-6">
          <blockquote className="text-4xl font-bold leading-tight">
            "Comece grátis.<br />Cresça sem limites."
          </blockquote>
          <ul className="space-y-3 text-background/70">
            {[
              "Formulários ilimitados no plano gratuito",
              "22 tipos de campo diferentes",
              "Analytics em tempo real",
              "Integrações com WhatsApp e mais",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/20 text-xs">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-background/40 text-sm">
          © {new Date().getFullYear()} formularios.ia
        </p>
      </div>

      {/* Right — form panel */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-6">
            <div className="flex bg-foreground text-background items-center justify-center p-1 rounded-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-bold text-lg">formularios.ia</span>
          </Link>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Criar conta</h1>
            <p className="text-muted-foreground">
              Já tem conta?{" "}
              <Link href="/login" className="text-foreground font-medium underline underline-offset-4 hover:no-underline">
                Entrar
              </Link>
            </p>
          </div>

          {/* Google OAuth (Temporarily disabled for Beta)
          <GoogleLoginButton next="/dashboard" />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou continue com e-mail</span>
            </div>
          </div>
          */}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  className="pl-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@empresa.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength.score ? strength.color : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p className={`text-xs font-medium ${(strength as { textColor?: string }).textColor ?? "text-muted-foreground"}`}>
                      {strength.label}
                    </p>
                  )}
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando conta...</>
              ) : (
                <>Criar conta grátis <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Ao criar uma conta você concorda com os{" "}
              <Link href="/terms" className="underline hover:text-foreground">Termos de Uso</Link>
              {" "}e{" "}
              <Link href="/privacy" className="underline hover:text-foreground">Política de Privacidade</Link>.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
