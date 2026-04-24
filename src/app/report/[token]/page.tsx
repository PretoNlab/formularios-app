import { notFound } from "next/navigation"
import { db } from "@/lib/db/client"
import { forms } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { AnalyticsView } from "@/components/dashboard/analytics/analytics-view"
import { getFormAnalytics } from "@/lib/db/queries/responses"
import type { QuestionSummary } from "@/components/dashboard/analytics/types"
import type { QuestionType } from "@/lib/types/form"

export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  if (!token) {
    notFound()
  }

  const dbForm = await db.query.forms.findFirst({
    where: eq(forms.shareToken, token),
    with: { questions: true },
  })

  if (!dbForm || !dbForm.isAnalyticsPublic) {
    notFound()
  }

  const analyticsResult = await getFormAnalytics(dbForm.id, "30d")
  const questions = dbForm.questions.map((q) => ({
    id: q.id,
    title: q.title,
    type: q.type as QuestionType,
    order: q.order,
  }))

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card sticky top-0 z-10 print-hide">
        <div className="container py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{dbForm.title}</h1>
            <p className="text-sm text-muted-foreground">Relatório Público</p>
          </div>
        </div>
      </header>

      <main className="container py-8 pb-20">
        <AnalyticsView
          formId={dbForm.id}
          initialAnalytics={analyticsResult.data ?? null}
          questions={questions}
        />
      </main>
    </div>
  )
}
