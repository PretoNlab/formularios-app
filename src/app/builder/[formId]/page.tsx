import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import { getFormById } from "@/lib/db/queries/forms"
import { BuilderClient } from "@/components/builder/builder-client"
import type { Form, Question, QuestionType } from "@/lib/types/form"
import type { FormWithQuestions } from "@/lib/db/queries/forms"

// ─── DB → domain type mapper ──────────────────────────────────────────────────

function mapDbForm(dbForm: FormWithQuestions): Form {
  return {
    id: dbForm.id,
    workspaceId: dbForm.workspaceId,
    createdById: dbForm.createdById,
    title: dbForm.title,
    description: dbForm.description ?? undefined,
    slug: dbForm.slug,
    status: dbForm.status,
    theme: dbForm.theme ?? {
      id: "midnight",
      colors: { bg: "#0f0f1a", card: "#1a1a2e", accent: "#6c63ff", text: "#e8e8f0", muted: "#6b6b8d" },
      font: { heading: "Fraunces", body: "DM Sans" },
      borderRadius: "12px",
    },
    settings: dbForm.settings ?? {
      showProgressBar: true,
      showQuestionNumbers: true,
      allowPartialResponses: true,
      notifyOnResponse: false,
      notificationEmail: null,
      redirectUrl: null,
      closeMessage: "Este formulário não está mais aceitando respostas.",
      responseLimit: null,
      closedAt: null,
    },
    questions: dbForm.questions.map(
      (q): Question => ({
        id: q.id,
        formId: q.formId,
        type: q.type as QuestionType,
        title: q.title,
        description: q.description ?? undefined,
        required: q.required,
        order: q.order,
        properties: q.properties ?? {},
        logicRules: q.logicRules ?? [],
      })
    ),
    responseCount: dbForm.responseCount,
    viewCount: dbForm.viewCount,
    createdAt: dbForm.createdAt.toISOString(),
    updatedAt: dbForm.updatedAt.toISOString(),
    publishedAt: dbForm.publishedAt?.toISOString(),
  }
}

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
  const { data: dbForm, success: formSuccess } = await getFormById(formId)
  if (!formSuccess || !dbForm) notFound()
  if (dbForm.createdById !== user.id) notFound()

  const form = mapDbForm(dbForm)
  return <BuilderClient initialForm={form} />
}
