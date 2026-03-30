const BASE_URL = "https://api.abacatepay.com"

export async function createPixBillingLink(params: {
  amountCents: number
  description: string
  returnUrl: string
  cancelUrl: string
}): Promise<{ id: string; url: string }> {
  const apiKey = process.env.ABACATEPAY_API_KEY
  if (!apiKey) throw new Error("ABACATEPAY_API_KEY não configurada.")

  const res = await fetch(`${BASE_URL}/v1/billing/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products: [
        {
          name: params.description.slice(0, 37),
          price: params.amountCents,
          quantity: 1,
        }
      ],
      returnUrl: params.returnUrl,
      cancelUrl: params.cancelUrl,
    }),
  })

  const json = (await res.json()) as {
    success: boolean
    data: { id: string; url: string } | null
    error: string | null
  }

  if (!json.success || !json.data) {
    throw new Error(`AbacatePay: ${json.error ?? "Erro desconhecido"}`)
  }

  const { id, url } = json.data
  return { id, url }
}
