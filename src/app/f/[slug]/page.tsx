import { notFound } from "next/navigation"
import { getFormBySlug, incrementViewCount } from "@/lib/db/queries/forms"
import { FormRendererPage } from "@/components/renderer/form-renderer-page"
import type { Form, Question, QuestionType } from "@/lib/types/form"
import type { FormWithQuestions } from "@/lib/db/queries/forms"
import type { Metadata, ResolvingMetadata } from "next"

export const dynamic = "force-dynamic"

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
      downloadUrl: null,
      downloadLabel: null,
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

// ─── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const isPreview = sp.preview === "1"
  const { data: dbForm } = await getFormBySlug(slug)

  if (!dbForm || (!isPreview && dbForm.status !== "published")) {
    return { title: "Formulário não encontrado" }
  }

  const title = dbForm.title || "Formulário"
  const description = dbForm.description || "Responda a este formulário construído com formularios.ia"
  
  // Customizações de tema
  const theme = dbForm.theme as Form["theme"] | undefined
  const logoUrl = theme?.logo?.url

  const metadata: Metadata = {
    title,
    description,
    manifest: "/manifest.json",
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "formularios.ia",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }

  if (logoUrl) {
    metadata.icons = {
      icon: logoUrl, // Usar o logo como favicon
      apple: logoUrl,
    }
  }

  return metadata
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const isPreview = sp.preview === "1"

  const { data: dbForm } = await getFormBySlug(slug)

  // 404 for missing forms; in preview mode allow drafts
  if (!dbForm || (!isPreview && dbForm.status !== "published")) notFound()

  // Only count real visits
  if (!isPreview) void incrementViewCount(slug)

  const form = mapDbForm(dbForm)

  return (
    <main className="h-screen w-full">
      {isPreview && (
        <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-3 bg-amber-500/95 py-1.5 text-xs font-semibold text-amber-950 backdrop-blur-sm">
          <span>Modo Preview — as respostas não serão salvas</span>
        </div>
      )}
      <FormRendererPage form={form} isPreview={isPreview} />
    </main>
  )
}
