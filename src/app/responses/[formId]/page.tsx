import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import { getFormById } from "@/lib/db/queries/forms"
import { getResponsesByForm } from "@/lib/db/queries/responses"
import { getFormAnalytics } from "@/lib/db/queries/responses"
import { ResponsesSection } from "@/components/dashboard/responses-section"
import type { Question, QuestionType } from "@/lib/types/form"

export default async function ResponsesPage({
  params,
}: {
  params: Promise<{ formId: string }>
}) {
  const { formId } = await params

  // ── Auth ──────────────────────────────────────────────────────────────────
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

  // ── Ownership ─────────────────────────────────────────────────────────────
  const { data: dbForm } = await getFormById(formId)
  if (!dbForm) notFound()
  if (dbForm.createdById !== user.id) notFound()

  // ── Responses + analytics (parallel) ─────────────────────────────────────
  const [responsesResult, analyticsResult] = await Promise.all([
    getResponsesByForm(formId, 1, 100),
    getFormAnalytics(formId),
  ])

  // Map questions to simple objects for the client component
  const questions = dbForm.questions.map((q) => ({
    id: q.id,
    title: q.title,
    type: q.type as QuestionType,
    order: q.order,
  }))

  return (
    <ResponsesSection
      formId={formId}
      formTitle={dbForm.title}
      formStatus={dbForm.status}
      formSlug={dbForm.slug}
      questions={questions}
      responses={responsesResult.data ?? []}
      analytics={analyticsResult.data ?? null}
    />
  )
}
