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
    console.error("[abacatepay webhook] ABACATEPAY_WEBHOOK_PUBLIC_KEY is not set")
    return false
  }
  if (!signature) return false

  const expected = createHmac("sha256", secret).update(body).digest("base64")
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
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

  const isPaid =
    event === "transparent.completed" ||
    event === "pixQrCode.paid" ||
    event === "checkout.completed" ||
    event === "billing.paid" ||
    event === "billing.completed"

  if (!isPaid || !data) return NextResponse.json({ ok: true })

  const abacatepayId = (data.id ?? data.pixQrCodeId ?? data.referenceId) as string | undefined
  if (!abacatepayId) return NextResponse.json({ ok: true })

  const order = await db.query.creditOrders.findFirst({
    where: eq(creditOrders.abacatepayId, abacatepayId),
    columns: { id: true, userId: true, credits: true, packId: true, status: true },
  })

  if (!order || order.status === "paid") return NextResponse.json({ ok: true })

  try {
    await db.transaction(async (tx) => {
      await tx.update(creditOrders).set({ status: "paid", paidAt: new Date() }).where(eq(creditOrders.id, order.id))

      if (order.packId === "founder") {
        const now = new Date()
        const expiresAt = new Date(now)
        expiresAt.setMonth(expiresAt.getMonth() + 12)
        await tx.update(users).set({
          plan: "founder",
          planStartedAt: now,
          planExpiresAt: expiresAt,
          responseQuota: sql`${users.responseQuota} + 2500`,
          responseUsed: 0,
          formQuota: 10,
        }).where(eq(users.id, order.userId))
      } else if (order.packId === "responses_500" || order.packId === "responses_1000") {
        const quota = order.packId === "responses_500" ? 500 : 1000
        await tx.update(users).set({
          responseQuota: sql`${users.responseQuota} + ${quota}`,
        }).where(eq(users.id, order.userId))
      } else if (order.packId === "forms_5") {
        await tx.update(users).set({
          formQuota: sql`${users.formQuota} + 5`,
        }).where(eq(users.id, order.userId))
      }

      await tx.insert(creditTransactions).values({
        userId: order.userId,
        amount: order.credits,
        type: "purchase",
        metadata: { orderId: order.id, packId: order.packId },
      })
    })
  } catch (err) {
    console.error("[abacatepay webhook] transaction failed", err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
