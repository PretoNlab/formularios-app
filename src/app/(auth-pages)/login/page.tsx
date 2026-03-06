import Link from "next/link"
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginAction } from "@/app/actions/auth"
import { GoogleLoginButton } from "./google-button"

interface LoginPageProps {
  searchParams: Promise<{ error?: string; next?: string }>
}

/**
 * Server Component — reads searchParams server-side (no useSearchParams needed).
 * The form uses a Server Action directly, which means:
 *   - form submit → true Server Action POST (not React's client-side fetch)
 *   - Set-Cookie headers from loginAction are properly sent to the browser
 *   - session cookies are stored → middleware reads them → dashboard accessible
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const sp = await searchParams
  const error = sp.error
  const next = sp.next ?? "/dashboard"

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
            Crie formulários inteligentes e descubra insights que importam.
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

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Entrar</h1>
            <p className="text-muted-foreground">
              Não tem conta?{" "}
              <Link href="/signup" className="text-foreground font-medium underline underline-offset-4 hover:no-underline">
                Criar grátis
              </Link>
            </p>
          </div>

          <form action={loginAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" name="email" type="email" placeholder="voce@empresa.com"
                  className="pl-10" required autoComplete="email" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Esqueci a senha
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" name="password" type="password" placeholder="••••••••"
                  className="pl-10" required autoComplete="current-password" />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full">
              Entrar <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou continue com</span>
            </div>
          </div>

          <GoogleLoginButton next={next} />
        </div>
      </div>
    </div>
  )
}
