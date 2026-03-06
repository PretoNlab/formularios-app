import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import { getFormsByWorkspace } from "@/lib/db/queries/forms"
import { FormsSection } from "@/components/dashboard/forms-section"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect("/login")

  const { data: user, success } = await ensureUserExists({
    id: authUser.id,
    email: authUser.email!,
    user_metadata: authUser.user_metadata,
  })
  if (!success || !user) redirect("/login")

  const { data: forms } = await getFormsByWorkspace(user.defaultWorkspace.id)

  return <FormsSection forms={forms ?? []} />
}
