export const STANDARD_WELCOME_CREDITS = 20
export const EARLY_ADOPTER_WELCOME_CREDITS = 50
export const EARLY_ADOPTER_LIMIT = 50
export const SIGNUP_ONBOARDING_BONUS = 20

export const AI_CREDIT_COSTS = {
  CREATE_FORM: 5,
  REFINE_FORM: 2,
  SEMANTIC_INSIGHTS: 3,
} as const

export function getInitialCreditGrant(existingUserCount: number, completedSignupOnboarding: boolean) {
  const isEarlyAdopter = existingUserCount < EARLY_ADOPTER_LIMIT
  const welcomeCredits = isEarlyAdopter
    ? EARLY_ADOPTER_WELCOME_CREDITS
    : STANDARD_WELCOME_CREDITS
  const onboardingCredits = completedSignupOnboarding ? SIGNUP_ONBOARDING_BONUS : 0

  return {
    isEarlyAdopter,
    welcomeCredits,
    onboardingCredits,
    totalCredits: welcomeCredits + onboardingCredits,
  }
}

export const FOUNDER_PLAN = {
  id: "founder",
  name: "Lote Fundador",
  priceReais: 499,
  priceCents: 49900,
  responseQuota: 2500,
  formQuota: 10,
  durationMonths: 12,
} as const

export const TOPUP_PACKS = [
  { id: "responses_500",  name: "+500 respostas",             responseQuota: 500,  formQuota: 0, priceReais: 49, priceCents: 4900 },
  { id: "responses_1000", name: "+1.000 respostas",            responseQuota: 1000, formQuota: 0, priceReais: 79, priceCents: 7900 },
  { id: "forms_5",        name: "+5 formulários publicados",   responseQuota: 0,    formQuota: 5, priceReais: 59, priceCents: 5900 },
] as const

export type ProductId = "founder" | "responses_500" | "responses_1000" | "forms_5"

export function getProductById(id: string) {
  if (id === FOUNDER_PLAN.id) return FOUNDER_PLAN
  return (TOPUP_PACKS as readonly { id: string; name: string; responseQuota: number; formQuota: number; priceReais: number; priceCents: number }[]).find(p => p.id === id) ?? null
}
