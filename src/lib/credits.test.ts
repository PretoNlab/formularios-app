import { describe, expect, it } from "vitest"
import {
  EARLY_ADOPTER_LIMIT,
  getInitialCreditGrant,
  AI_CREDIT_COSTS,
} from "./credits"

describe("initial credit grant", () => {
  it("grants 50 guaranteed plus 20 onboarding credits to the first 50 users", () => {
    expect(getInitialCreditGrant(EARLY_ADOPTER_LIMIT - 1, true)).toEqual({
      isEarlyAdopter: true,
      welcomeCredits: 50,
      onboardingCredits: 20,
      totalCredits: 70,
    })
  })

  it("returns to the standard 20 guaranteed credits after the launch cohort", () => {
    expect(getInitialCreditGrant(EARLY_ADOPTER_LIMIT, true)).toEqual({
      isEarlyAdopter: false,
      welcomeCredits: 20,
      onboardingCredits: 20,
      totalCredits: 40,
    })
  })

  it("does not grant the onboarding bonus outside the interactive signup", () => {
    expect(getInitialCreditGrant(0, false).totalCredits).toBe(50)
  })

  it("defines clear costs for AI operations", () => {
    expect(AI_CREDIT_COSTS.CREATE_FORM).toBe(5)
    expect(AI_CREDIT_COSTS.REFINE_FORM).toBe(2)
    expect(AI_CREDIT_COSTS.SEMANTIC_INSIGHTS).toBe(3)
  })
})
