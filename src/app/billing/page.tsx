import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import { db } from "@/lib/db/client"
import { creditTransactions, forms } from "@/lib/db/schema"
import { eq, desc, and, count } from "drizzle-orm"
import { BillingClient } from "@/components/billing/billing-client"

export const metadata = { title: "Plano — formularios.ia" }

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const { checkout } = await searchParams
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect("/login")

  const { data: user, success } = await ensureUserExists({
    id: authUser.id,
    email: authUser.email!,
    user_metadata: authUser.user_metadata,
  })
  if (!success || !user) redirect("/dashboard")

  const [transactions, publishedResult] = await Promise.all([
    db.query.creditTransactions.findMany({
      where: eq(creditTransactions.userId, user.id),
      orderBy: [desc(creditTransactions.createdAt)],
      columns: { id: true, amount: true, type: true, createdAt: true, metadata: true },
      limit: 30,
    }),
    db.select({ count: count() }).from(forms).where(
      and(eq(forms.createdById, user.id), eq(forms.status, "published"))
    ),
  ])

  const publishedFormsCount = publishedResult[0]?.count ?? 0

  return (
    <BillingClient
      checkoutIntent={checkout}
      plan={user.plan}
      planExpiresAt={user.planExpiresAt?.toISOString() ?? null}
      responseQuota={user.responseQuota}
      responseUsed={user.responseUsed}
      formQuota={user.formQuota}
      publishedFormsCount={publishedFormsCount}
      transactions={transactions.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        metadata: t.metadata as Record<string, unknown> | null,
      }))}
    />
  )
}
