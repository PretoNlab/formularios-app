import { describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), redirect: vi.fn() }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: mocks.getUser } }) }))
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }))
vi.mock("@/components/onboarding/complete-signup", () => ({ CompleteSignup: () => null }))
import CompleteSignupPage from "./page"

describe("completion page", () => {
  it("renders the retryable handoff using only authentication", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "auth-only-user" } } })
    expect(await CompleteSignupPage()).toBeTruthy()
    expect(mocks.redirect).not.toHaveBeenCalled()
  })
  it("preserves the return path when a visitor must sign in", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } })
    mocks.redirect.mockImplementation(() => { throw new Error("redirect") })
    await expect(CompleteSignupPage()).rejects.toThrow("redirect")
    expect(mocks.redirect).toHaveBeenCalledWith("/login?next=%2Fonboarding%2Fcomplete")
  })
})
