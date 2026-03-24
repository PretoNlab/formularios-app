import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import { getFormById } from "@/lib/db/queries/forms"
import { BuilderClient } from "@/components/builder/builder-client"
import { mapDbForm } from "@/lib/utils/map-db-form"

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ formId: string }>
}) {
  const { formId } = await params

  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect("/login")

  // Fetch user record and form in parallel — ownership check happens after both resolve
  const [userResult, formResult] = await Promise.all([
    ensureUserExists({
      id: authUser.id,
      email: authUser.email!,
      user_metadata: authUser.user_metadata,
    }),
    getFormById(formId),
  ])

  const { data: user, success, error } = userResult
  if (!success || !user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center text-center p-8">
        <h1 className="text-2xl font-bold text-destructive mb-2">Erro de Banco de Dados</h1>
        <p className="text-muted-foreground max-w-md">{error?.message || "Não foi possível carregar o usuário."}</p>
      </div>
    )
  }

  // ── Ownership ─────────────────────────────────────────────────────────────
  const { data: dbForm, success: formSuccess } = formResult
  if (!formSuccess || !dbForm) notFound()
  if (dbForm.createdById !== user.id) notFound()

  const form = mapDbForm(dbForm)
  return <BuilderClient initialForm={form} />
}
