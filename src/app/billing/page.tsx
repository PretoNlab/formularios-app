import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import { db } from "@/lib/db/client"
import { creditTransactions } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { BillingClient } from "@/components/billing/billing-client"

export const metadata = { title: "Créditos — formularios.ia" }

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect("/login")

  const { data: user, success } = await ensureUserExists({
    id: authUser.id,
    email: authUser.email!,
    user_metadata: authUser.user_metadata,
  })
  if (!success || !user) redirect("/dashboard")

  const transactions = await db.query.creditTransactions.findMany({
    where: eq(creditTransactions.userId, user.id),
    orderBy: [desc(creditTransactions.createdAt)],
    columns: { id: true, amount: true, type: true, createdAt: true, metadata: true },
    limit: 30,
  })

  return (
    <BillingClient
      creditBalance={user.creditBalance}
      transactions={transactions.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        metadata: t.metadata as Record<string, unknown> | null,
      }))}
    />
  )
}
