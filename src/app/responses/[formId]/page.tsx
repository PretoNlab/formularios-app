import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import { getFormById } from "@/lib/db/queries/forms"
import { getResponsesByForm } from "@/lib/db/queries/responses"
import { getFormAnalytics } from "@/lib/db/queries/responses"
import type {
  ResponseFilters,
  FilterPeriod,
  FilterStatus,
  FilterDevice,
} from "@/lib/db/queries/responses"
import { ResponsesSection } from "@/components/dashboard/responses-section"
import type { QuestionType } from "@/lib/types/form"

const ALLOWED_PAGE_SIZES = [50, 100] as const
const DEFAULT_PAGE_SIZE = 50

const VALID_PERIODS: readonly FilterPeriod[] = ["today", "7d", "30d", "90d"]
const VALID_STATUSES: readonly FilterStatus[] = ["complete", "partial"]
const VALID_DEVICES: readonly FilterDevice[] = ["desktop", "mobile", "tablet", "unknown"]

function parseFilters(sp: {
  period?: string
  status?: string
  device?: string
  source?: string
  answerQ?: string
  answerV?: string
}): ResponseFilters {
  const filters: ResponseFilters = {}
  if (sp.period && (VALID_PERIODS as readonly string[]).includes(sp.period)) {
    filters.period = sp.period as FilterPeriod
  }
  if (sp.status && (VALID_STATUSES as readonly string[]).includes(sp.status)) {
    filters.status = sp.status as FilterStatus
  }
  if (sp.device && (VALID_DEVICES as readonly string[]).includes(sp.device)) {
    filters.device = sp.device as FilterDevice
  }
  if (sp.source) filters.source = sp.source
  if (sp.answerQ && sp.answerV) {
    filters.answerFilter = { questionId: sp.answerQ, value: sp.answerV }
  }
  return filters
}

export default async function ResponsesPage({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>
  searchParams: Promise<{
    page?: string
    pageSize?: string
    period?: string
    status?: string
    device?: string
    source?: string
    answerQ?: string
    answerV?: string
  }>
}) {
  const [{ formId }, sp] = await Promise.all([params, searchParams])
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1)
  const rawPageSize = parseInt(sp.pageSize ?? "", 10)
  const pageSize = (ALLOWED_PAGE_SIZES as readonly number[]).includes(rawPageSize)
    ? rawPageSize
    : DEFAULT_PAGE_SIZE
  const filters = parseFilters(sp)

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

  // ── Responses (filtered) + analytics (parallel) ───────────────────────────
  const [responsesResult, analyticsResult] = await Promise.all([
    getResponsesByForm(formId, page, pageSize, filters),
    getFormAnalytics(formId),
  ])

  const questions = dbForm.questions.map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description,
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
      pagination={responsesResult.pagination}
      filters={filters}
      shareToken={dbForm.shareToken}
      isAnalyticsPublic={dbForm.isAnalyticsPublic}
      userPlan={user.plan}
    />
  )
}
