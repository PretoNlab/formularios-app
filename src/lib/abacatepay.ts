const BASE_URL = "https://api.abacatepay.com"

export async function createPixQrCode(params: {
  amountCents: number
  description: string
  expiresIn?: number
}): Promise<{ id: string; brCode: string; brCodeBase64: string; expiresAt: string }> {
  const apiKey = process.env.ABACATEPAY_API_KEY
  if (!apiKey) throw new Error("ABACATEPAY_API_KEY não configurada.")

  const res = await fetch(`${BASE_URL}/v1/pixQrCode/create`, {
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

  const json = (await res.json()) as {
    success: boolean
    data: { id: string; brCode: string; brCodeBase64: string; expiresAt: string } | null
    error: string | null
  }

  if (!json.success || !json.data) {
    throw new Error(`AbacatePay: ${json.error ?? "Erro desconhecido"}`)
  }

  const { id, brCode, brCodeBase64, expiresAt } = json.data
  return { id, brCode, brCodeBase64, expiresAt }
}
