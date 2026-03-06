"use client"

import { useState } from "react"
import Link from "next/link"
import { Sparkles, Mail, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { getAppUrl } from "@/lib/utils"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${getAppUrl()}/auth/callback?next=/reset-password`,
    })

    if (error) {
      setError("Não foi possível enviar o e-mail. Tente novamente.")
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — branding panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-foreground p-12 text-background">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex bg-background text-foreground items-center justify-center p-1 rounded-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">formularios.app</span>
        </Link>
        <div className="space-y-6">
          <blockquote className="text-4xl font-bold leading-tight">
            "Formulários que convertem.<br />Dados que inspiram."
          </blockquote>
          <p className="text-background/60 text-lg">
            Recupere o acesso à sua conta em segundos.
          </p>
        </div>
        <p className="text-background/40 text-sm">© {new Date().getFullYear()} formularios.app</p>
      </div>

      {/* Right — form panel */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-8">
            <div className="flex bg-foreground text-background items-center justify-center p-1 rounded-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-bold text-lg">formularios.app</span>
          </Link>

          {sent ? (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="flex bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 items-center justify-center p-4 rounded-2xl">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">Verifique seu e-mail</h1>
                <p className="text-muted-foreground text-sm">
                  Enviamos um link para <strong>{email}</strong>.<br />
                  Clique no link para redefinir sua senha.
                </p>
              </div>
              <Button variant="outline" asChild className="w-full">
                <Link href="/login">Voltar para o login</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Esqueceu a senha?</h1>
                <p className="text-muted-foreground">
                  Informe seu e-mail e enviaremos um link para redefinir sua senha.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Enviando..." : (
                    <>Enviar link de recuperação <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Lembrou a senha?{" "}
                <Link href="/login" className="text-foreground font-medium underline underline-offset-4 hover:no-underline">
                  Entrar
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
