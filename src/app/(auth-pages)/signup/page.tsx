"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sparkles, Mail, Lock, User, ArrowRight, Chrome } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export default function SignupPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
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

  async function handleGoogleSignup() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-sm text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex bg-foreground text-background items-center justify-center p-3 rounded-xl">
              <Mail className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Confirme seu e-mail</h1>
          <p className="text-muted-foreground">
            Enviamos um link de confirmação para <strong>{email}</strong>.
            Verifique sua caixa de entrada para ativar sua conta.
          </p>
          <Button variant="outline" asChild>
            <Link href="/login">Voltar para o login</Link>
          </Button>
        </div>
      </div>
    )
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
            "Comece grátis.<br />Cresça sem limites."
          </blockquote>
          <ul className="space-y-3 text-background/70">
            {[
              "Formulários ilimitados no plano gratuito",
              "19 tipos de campo diferentes",
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
          © {new Date().getFullYear()} formularios.app
        </p>
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

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Criar conta</h1>
            <p className="text-muted-foreground">
              Já tem conta?{" "}
              <Link href="/login" className="text-foreground font-medium underline underline-offset-4 hover:no-underline">
                Entrar
              </Link>
            </p>
          </div>

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
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando conta..." : (
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou continue com</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            <Chrome className="mr-2 h-4 w-4" />
            Google
          </Button>
        </div>
      </div>
    </div>
  )
}
