import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import { BrandKitClient } from "@/components/settings/brand-kit-client"
import type { WorkspaceBrandKit } from "@/lib/db/schema"

export default async function BrandKitPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect("/login")

  const { data: user, success } = await ensureUserExists({
    id: authUser.id,
    email: authUser.email!,
    user_metadata: authUser.user_metadata,
  })
  if (!success || !user) redirect("/settings")

  const brandKit = (user.defaultWorkspace.brandKit as WorkspaceBrandKit | null) ?? null

  return (
    <div className="container max-w-2xl py-10">
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Configurações
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold font-heading">Brand Kit</h1>
        <p className="text-muted-foreground mt-2">
          Defina a identidade visual da sua marca — logo, cores e fontes — e aplique com um clique em qualquer formulário.
        </p>
      </div>

      <BrandKitClient initial={brandKit} />
    </div>
  )
}
