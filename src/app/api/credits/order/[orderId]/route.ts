import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import { db } from "@/lib/db/client"
import { creditOrders } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params

  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })

  const { data: user, success } = await ensureUserExists({
    id: authUser.id,
    email: authUser.email!,
    user_metadata: authUser.user_metadata,
  })
  if (!success || !user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 })

  const order = await db.query.creditOrders.findFirst({
    where: and(eq(creditOrders.id, orderId), eq(creditOrders.userId, user.id)),
    columns: { id: true, status: true, credits: true, packId: true },
  })

  if (!order) return NextResponse.json({ error: "Ordem não encontrada." }, { status: 404 })

  return NextResponse.json(order)
}
