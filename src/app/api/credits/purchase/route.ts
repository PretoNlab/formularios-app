import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import { db } from "@/lib/db/client"
import { creditOrders } from "@/lib/db/schema"
import { createPixBillingLink } from "@/lib/abacatepay"
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

  const parsed = body as Record<string, unknown>
  const productId = parsed.packId as string
  const taxId = parsed.taxId as string | undefined
  const product = getProductById(productId)
  if (!product) return NextResponse.json({ error: "Produto inválido." }, { status: 400 })
  if (!taxId || !/^\d{11}$/.test(taxId)) return NextResponse.json({ error: "CPF inválido." }, { status: 400 })

  try {
    const baseUrl = req.headers.get("origin") || "https://formularios.ia"
    const pix = await createPixBillingLink({
      externalId: product.id,
      amountCents: product.priceCents,
      description: `${product.name} - formularios.ia`,
      returnUrl: `${baseUrl}/billing?success=true`,
      completionUrl: `${baseUrl}/billing?success=true`,
      customer: {
        name: user.name || authUser.user_metadata?.full_name || "Cliente",
        email: user.email,
        cellphone: "11999999999",
        taxId,
      },
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
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour expiration for link fallback
      })
      .returning()

    return NextResponse.json({
      orderId: order.id,
      url: pix.url,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao criar cobrança."
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
