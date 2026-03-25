import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import { db } from "@/lib/db/client"
import { creditOrders } from "@/lib/db/schema"
import { createPixQrCode } from "@/lib/abacatepay"
import { getProductById } from "@/lib/credits"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })

  const { data: user, success } = await ensureUserExists({
    id: authUser.id,
    email: authUser.email!,
    user_metadata: authUser.user_metadata,
  })
  if (!success || !user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "JSON inválido." }, { status: 400 }) }

  const productId = (body as Record<string, unknown>).packId as string
  const product = getProductById(productId)
  if (!product) return NextResponse.json({ error: "Produto inválido." }, { status: 400 })

  try {
    const pix = await createPixQrCode({
      amountCents: product.priceCents,
      description: `${product.name} - formularios.ia`,
    })

    const [order] = await db
      .insert(creditOrders)
      .values({
        userId: user.id,
        packId: product.id,
        credits: product.responseQuota,
        amountCents: product.priceCents,
        status: "pending",
        abacatepayId: pix.id,
        pixCode: pix.brCode,
        pixQrBase64: pix.brCodeBase64,
        expiresAt: new Date(pix.expiresAt),
      })
      .returning()

    return NextResponse.json({
      orderId: order.id,
      pixCode: pix.brCode,
      pixQrBase64: pix.brCodeBase64,
      expiresAt: pix.expiresAt,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao criar cobrança."
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
