import Link from "next/link"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/server"
import { getUserByAuthId } from "@/lib/db/queries/users"
import { LogoutButton } from "./logout-button"
import { CreateFormButton } from "@/components/dashboard/create-form-button"
import { MainNav } from "./main-nav"

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
          <Link href="/dashboard" className="flex items-center gap-2.5 transition-opacity hover:opacity-80 group">
            <div className="flex bg-gradient-to-br from-zinc-800 to-black dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-black items-center justify-center p-1.5 rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight">formularios.ia</span>
          </Link>

          <MainNav />
        </div>

        {/* Right section: Profile & Actions */}
        <div className="flex items-center gap-4 shrink-0">
          {authUser ? (
            <>
              <div className="hidden sm:flex items-center gap-3 rounded-full border bg-background px-1.5 py-1.5 shadow-sm pr-4">
                <Avatar className="h-8 w-8 border">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                  <AvatarFallback className="text-[10px] bg-muted">{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-bold leading-none">{displayName.split(" ")[0]}</span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
                    {plan} plan
                  </span>
                </div>
              </div>
              <LogoutButton />
            </>
          ) : (
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">Entrar</Link>
            </Button>
          )}

          <CreateFormButton variant="header" />
        </div>

      </div>
    </header>
  )
}
