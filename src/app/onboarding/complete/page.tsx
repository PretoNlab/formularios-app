import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CompleteSignup } from "@/components/onboarding/complete-signup"

export default async function CompleteSignupPage() {
  // Provisioning belongs to the retryable action, so a database outage does not crash this page.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=%2Fonboarding%2Fcomplete")
  return <CompleteSignup />
}
