import Link from "next/link"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/server"
import { getUserByAuthId } from "@/lib/db/queries/users"
import { LogoutButton } from "./logout-button"

function getInitials(name: string | null | undefined): string {
  if (!name) return "?"
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export async function Header() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  let displayName = "Usuário"
  let avatarUrl: string | null = null
  let plan: string = "free"

  if (authUser) {
    const { data: dbUser } = await getUserByAuthId(authUser.id)
    if (dbUser) {
      displayName = dbUser.name ?? authUser.email ?? "Usuário"
      avatarUrl = dbUser.avatarUrl
      plan = dbUser.plan
    } else {
      displayName =
        (authUser.user_metadata?.full_name as string | undefined) ??
        authUser.email ??
        "Usuário"
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">

        {/* Left section: Logo & Nav */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex bg-foreground text-background items-center justify-center p-1 rounded-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight">formularios.ia</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            <Link href="/dashboard" className="text-foreground transition-colors hover:text-foreground/80">Dashboard</Link>
            <Link href="/templates" className="text-foreground/60 transition-colors hover:text-foreground">Templates</Link>
            <Link href="/analytics" className="text-foreground/60 transition-colors hover:text-foreground">Analytics</Link>
            <Link href="/settings/brand-kit" className="text-foreground/60 transition-colors hover:text-foreground">Brand Kit</Link>
            <Link href="/settings" className="text-foreground/60 transition-colors hover:text-foreground">Settings</Link>
            <Link href="/billing" className="text-foreground/60 transition-colors hover:text-foreground">Créditos</Link>
            <Link href="/help" className="text-foreground/60 transition-colors hover:text-foreground">Ajuda</Link>
          </nav>
        </div>

        {/* Right section: Profile & Actions */}
        <div className="flex items-center gap-4 shrink-0">
          {authUser ? (
            <>
              <div className="hidden sm:flex items-center gap-3 rounded-full border bg-card px-3 py-1.5 shadow-sm">
                <Avatar className="h-6 w-6">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                  <AvatarFallback className="text-[10px]">{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{displayName.split(" ")[0]}</span>
                <span className="flex h-5 items-center justify-center rounded-md bg-accent px-1.5 text-[10px] font-bold uppercase text-accent-foreground tracking-widest">
                  {plan}
                </span>
              </div>
              <LogoutButton />
            </>
          ) : (
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">Entrar</Link>
            </Button>
          )}

          <Button className="rounded-full px-6" asChild>
            <Link href="/dashboard">Novo form</Link>
          </Button>
        </div>

      </div>
    </header>
  )
}
