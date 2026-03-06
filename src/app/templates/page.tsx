import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TemplatesSection } from "@/components/dashboard/templates-section"

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return <TemplatesSection />
}
