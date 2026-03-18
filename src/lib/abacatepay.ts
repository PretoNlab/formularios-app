const BASE_URL = "https://api.abacatepay.com"

export async function createPixQrCode(params: {
  amountCents: number
  description: string
  expiresIn?: number
}): Promise<{ id: string; brCode: string; brCodeBase64: string; expiresAt: string }> {
  const apiKey = process.env.ABACATEPAY_API_KEY
  if (!apiKey) throw new Error("ABACATEPAY_API_KEY não configurada.")

  const res = await fetch(`${BASE_URL}/pixQrCode/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amountCents,
      expiresIn: params.expiresIn ?? 3600,
      description: params.description.slice(0, 37),
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`AbacatePay ${res.status}: ${body}`)
  }

  const data = (await res.json()) as {
    id: string
    brCode: string
    brCodeBase64: string
    expiresAt: string
  }

  return { id: data.id, brCode: data.brCode, brCodeBase64: data.brCodeBase64, expiresAt: data.expiresAt }
}
