import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, User, Building2, CreditCard, Shield } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LogoutButton } from "@/components/layout/logout-button"

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito",
  pro: "Pro",
  business: "Business",
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect("/login")

  const { data: user, success, error } = await ensureUserExists({
    id: authUser.id,
    email: authUser.email!,
    user_metadata: authUser.user_metadata,
  })
  if (!success || !user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center text-center p-8">
        <h1 className="text-2xl font-bold text-destructive mb-2">Erro de Banco de Dados</h1>
        <p className="text-muted-foreground max-w-md">{error?.message || "Não foi possível carregar o usuário."}</p>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-10">
      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      <h1 className="text-3xl font-bold font-heading mb-8">Configurações</h1>

      {/* ── Profile ── */}
      <section className="rounded-xl border bg-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <User className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Perfil</h2>
        </div>
        <Separator />

        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground shrink-0">
            {(user.name ?? user.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-lg">{user.name ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</p>
            <p>{user.name ?? "Não definido"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">E-mail</p>
            <p>{user.email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Membro desde</p>
            <p>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(user.createdAt))}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ID da conta</p>
            <p className="font-mono text-xs text-muted-foreground truncate">{user.id}</p>
          </div>
        </div>
      </section>

      {/* ── Workspace ── */}
      <section className="rounded-xl border bg-card p-6 space-y-5 mt-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Workspace</h2>
        </div>
        <Separator />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</p>
            <p>{user.defaultWorkspace.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Slug</p>
            <p className="font-mono text-xs">{user.defaultWorkspace.slug}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Função</p>
            <p>Proprietário</p>
          </div>
        </div>
      </section>

      {/* ── Plano ── */}
      <section className="rounded-xl border bg-card p-6 space-y-5 mt-6">
        <div className="flex items-center gap-3">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Plano</h2>
        </div>
        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <p className="font-semibold text-lg capitalize">{PLAN_LABELS[user.plan] ?? user.plan}</p>
              <Badge
                variant={user.plan === "free" ? "secondary" : "default"}
                className={user.plan !== "free" ? "bg-violet-600" : ""}
              >
                {PLAN_LABELS[user.plan] ?? user.plan}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {user.plan === "free"
                ? "Até 10 perguntas por formulário, 100 respostas/mês."
                : "Sem limites — tudo desbloqueado."}
            </p>
          </div>
          {user.plan === "free" && (
            <button className="rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg hover:opacity-90 transition-opacity">
              Fazer upgrade
            </button>
          )}
        </div>

        {user.plan === "free" && (
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
            <p className="font-medium">O que você ganha no Pro:</p>
            <ul className="space-y-1 text-muted-foreground">
              {[
                "Perguntas ilimitadas por formulário",
                "Respostas ilimitadas",
                "Remoção do branding formularios.app",
                "Webhooks e integrações avançadas",
                "Analytics detalhado",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ── Segurança ── */}
      <section className="rounded-xl border bg-card p-6 space-y-5 mt-6">
        <div className="flex items-center gap-3">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Sessão</h2>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Sair da conta</p>
            <p className="text-xs text-muted-foreground mt-0.5">Encerra sua sessão neste dispositivo.</p>
          </div>
          <LogoutButton />
        </div>
      </section>
    </div>
  )
}
