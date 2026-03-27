import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DesignSystemPage } from "@/components/design-system/design-system-page"

export const metadata = { title: "Design System — formularios.ia" }

export default async function DesignPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return <DesignSystemPage />
}
