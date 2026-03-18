import { NextRequest, NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { db } from "@/lib/db/client"
import { creditOrders, creditTransactions, users } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

// AbacatePay signs payloads with HMAC-SHA256 (base64) using their public key.
// Set ABACATEPAY_WEBHOOK_PUBLIC_KEY from: AbacatePay Dashboard → Webhooks → Public Key
function verifySignature(body: Buffer, signature: string | null): boolean {
  const secret = process.env.ABACATEPAY_WEBHOOK_PUBLIC_KEY
  if (!secret) {
    // Misconfiguration — reject all requests to prevent unsigned fraud
    console.error("[abacatepay webhook] ABACATEPAY_WEBHOOK_PUBLIC_KEY is not set")
    return false
  }
  if (!signature) return false

  const expected = createHmac("sha256", secret).update(body).digest("base64")
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    // Buffers differ in length — signatures don't match
    return false
  }
}

export async function POST(req: NextRequest) {
  const rawBody = Buffer.from(await req.arrayBuffer())
  const signature = req.headers.get("x-webhook-signature")

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody.toString("utf-8")) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

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

  try {
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
  } catch (err) {
    console.error("[abacatepay webhook] transaction failed", err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
