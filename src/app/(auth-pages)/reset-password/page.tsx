"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Sparkles, Lock, ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.")
      return
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError("Não foi possível redefinir a senha. O link pode ter expirado.")
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push("/dashboard"), 2000)
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
            "Formulários que convertem.<br />Dados que inspiram."
          </blockquote>
          <p className="text-background/60 text-lg">
            Escolha uma nova senha segura para sua conta.
          </p>
        </div>
        <p className="text-background/40 text-sm">© {new Date().getFullYear()} formularios.ia</p>
      </div>

      {/* Right — form panel */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-8">
            <div className="flex bg-foreground text-background items-center justify-center p-1 rounded-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-bold text-lg">formularios.ia</span>
          </Link>

          {done ? (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="flex bg-green-100 text-green-700 items-center justify-center p-4 rounded-2xl">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">Senha redefinida!</h1>
                <p className="text-muted-foreground text-sm">
                  Sua senha foi atualizada. Redirecionando para o painel...
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Nova senha</h1>
                <p className="text-muted-foreground">
                  Escolha uma senha forte com pelo menos 8 caracteres.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nova senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmar senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm"
                      type={showPassword ? "text" : "password"}
                      placeholder="Repita a senha"
                      className="pl-10"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Salvando..." : (
                    <>Salvar nova senha <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="text-foreground font-medium underline underline-offset-4 hover:no-underline">
                  Voltar para o login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
