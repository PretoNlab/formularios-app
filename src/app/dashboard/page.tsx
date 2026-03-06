import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import { getFormsByWorkspace } from "@/lib/db/queries/forms"
import { FormsSection } from "@/components/dashboard/forms-section"

export default async function DashboardPage() {
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

  const { data: forms } = await getFormsByWorkspace(user.defaultWorkspace.id)

  return <FormsSection forms={forms ?? []} />
}
