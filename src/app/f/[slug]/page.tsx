import { notFound } from "next/navigation"
import { after } from "next/server"
import { getFormBySlug, incrementViewCount } from "@/lib/db/queries/forms"
import { FormRendererPage } from "@/components/renderer/form-renderer-page"
import { mapDbForm } from "@/lib/utils/map-db-form"
import { createClient } from "@/lib/supabase/server"
import type { Form } from "@/lib/types/form"
import type { Metadata, ResolvingMetadata } from "next"

export const dynamic = "force-dynamic"

// ─── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const isPreview = sp.preview === "1"
  const { data: dbForm } = await getFormBySlug(slug)

  if (!dbForm) {
    return { title: "Formulário não encontrado" }
  }

  // Preview mode is owner-only. For metadata we don't disclose the title to
  // non-owners viewing a draft — fall through to the generic title instead.
  if (isPreview && dbForm.status !== "published") {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== dbForm.createdById) {
      return { title: "Formulário não encontrado" }
    }
  } else if (dbForm.status !== "published") {
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

  if (!dbForm) notFound()

  // Preview mode is owner-only: the in-builder Preview button is the legit
  // caller. Without this check, anyone who knows or enumerates a slug can read
  // drafts the author has not published.
  if (isPreview) {
    if (dbForm.status !== "published") {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.id !== dbForm.createdById) notFound()
    }
  } else if (dbForm.status !== "published") {
    notFound()
  }

  // Only count real visits
  if (!isPreview) after(() => incrementViewCount(slug))

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
