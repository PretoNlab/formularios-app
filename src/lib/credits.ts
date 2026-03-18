export const CREDIT_PACKS = [
  { id: "starter",    name: "Iniciante",  credits: 300,   priceReais: 19,  priceCents: 1900  },
  { id: "pro",        name: "Pro",        credits: 1000,  priceReais: 49,  priceCents: 4900  },
  { id: "business",   name: "Business",   credits: 2500,  priceReais: 99,  priceCents: 9900  },
  { id: "enterprise", name: "Enterprise", credits: 7000,  priceReais: 199, priceCents: 19900 },
] as const

export type PackId = typeof CREDIT_PACKS[number]["id"]

export const WELCOME_CREDITS = 50

export function getPackById(id: string) {
  return CREDIT_PACKS.find((p) => p.id === id) ?? null
}
