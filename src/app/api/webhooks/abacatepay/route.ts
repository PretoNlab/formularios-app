import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db/client"
import { creditOrders, creditTransactions, users } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ ok: false }, { status: 400 }) }

  const payload = body as Record<string, unknown>
  const event = payload.event as string | undefined
  const data = payload.data as Record<string, unknown> | undefined

  // Accept payment events from AbacatePay (event name may vary)
  const isPaid =
    event === "transparent.completed" ||
    event === "pixQrCode.paid" ||
    event === "checkout.completed"

  if (!isPaid || !data) return NextResponse.json({ ok: true })

  // AbacatePay sends the QR code ID inside data
  const abacatepayId = (data.id ?? data.pixQrCodeId ?? data.referenceId) as string | undefined
  if (!abacatepayId) return NextResponse.json({ ok: true })

  const order = await db.query.creditOrders.findFirst({
    where: eq(creditOrders.abacatepayId, abacatepayId),
    columns: { id: true, userId: true, credits: true, status: true },
  })

  if (!order || order.status === "paid") return NextResponse.json({ ok: true })

  await db.transaction(async (tx) => {
    await tx.update(creditOrders).set({ status: "paid", paidAt: new Date() }).where(eq(creditOrders.id, order.id))
    await tx.update(users).set({ creditBalance: sql`${users.creditBalance} + ${order.credits}` }).where(eq(users.id, order.userId))
    await tx.insert(creditTransactions).values({
      userId: order.userId,
      amount: order.credits,
      type: "purchase",
      metadata: { orderId: order.id },
    })
  })

  return NextResponse.json({ ok: true })
}
