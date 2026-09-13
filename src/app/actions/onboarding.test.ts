import { vi, describe, it, expect, beforeEach } from "vitest"
import { draftSchema } from "@/lib/onboarding/draft"
const mocks = vi.hoisted(() => ({
  ensureUserExists: vi.fn(), getUser: vi.fn(), getCookie: vi.fn(), setCookie: vi.fn(), persist: vi.fn(),
}))
vi.mock("@/lib/db/queries/users", () => ({ ensureUserExists: mocks.ensureUserExists }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: mocks.getUser } }) }))
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.getCookie, set: mocks.setCookie }) }))
vi.mock("@/lib/db/queries/onboarding", () => ({ persistSignupForm: mocks.persist }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
import { completeSignupDraftAction, prepareSignupDraftAction } from "./onboarding"

const draft = draftSchema.parse({ version: 1, id: "95fbb4a4-33ca-4b0c-84a4-20ed7d015112", goal: "feedback", context: "Aurora", question: "", title: "", style: "cream" })
beforeEach(() => {
  vi.clearAllMocks()
  mocks.ensureUserExists.mockResolvedValue({ success: true, data: { id: "owner", creditBalance: 70, defaultWorkspace: { id: "workspace" } } })
  mocks.getUser.mockResolvedValue({ data: { user: { id: "auth-user", email: "test@example.invalid", user_metadata: {} } } })
  mocks.getCookie.mockReturnValue(undefined)
  mocks.persist.mockResolvedValue("saved-form")
})
describe("signup handoff", () => {
  it("recovers email signup on another device from validated metadata", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "auth-user", email: "test@example.invalid", user_metadata: { signup_draft: draft } } } })
    expect(await completeSignupDraftAction()).toEqual({ formId: "saved-form", creditBalance: 70 })
    expect(mocks.persist).toHaveBeenCalledWith("owner", "workspace", draft)
  })
  it("recovers OAuth from its cookie", async () => {
    mocks.getCookie.mockReturnValue({ value: JSON.stringify(draft) })
    expect(await completeSignupDraftAction()).toEqual({ formId: "saved-form", creditBalance: 70 })
    expect(mocks.ensureUserExists).toHaveBeenCalledWith(expect.objectContaining({
      user_metadata: expect.objectContaining({ signup_draft: draft }),
    }))
  })
  it("never persists a missing or malformed draft", async () => {
    mocks.getCookie.mockReturnValue({ value: "{broken" })
    expect((await completeSignupDraftAction()).error).toBeTruthy()
    expect(mocks.ensureUserExists).not.toHaveBeenCalled()
    expect(mocks.persist).not.toHaveBeenCalled()
  })
  it("does not create anything before authentication", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } })
    expect((await completeSignupDraftAction()).requiresLogin).toBe(true)
    expect(mocks.ensureUserExists).not.toHaveBeenCalled()
    expect(mocks.persist).not.toHaveBeenCalled()
  })
  it("recovers when account provisioning fails and is retried", async () => {
    mocks.getCookie.mockReturnValue({ value: JSON.stringify(draft) })
    mocks.ensureUserExists.mockResolvedValueOnce({ success: false, error: { code: "DB_ERROR" } })
    expect((await completeSignupDraftAction()).error).toContain("não é necessário criar outra conta")
    expect(mocks.persist).not.toHaveBeenCalled()
    expect(await completeSignupDraftAction()).toEqual({ formId: "saved-form", creditBalance: 70 })
  })
  it("stores only validated configuration in an HttpOnly cookie", async () => {
    await prepareSignupDraftAction(draft)
    expect(mocks.setCookie).toHaveBeenCalledWith("signup_draft", JSON.stringify(draft), expect.objectContaining({ httpOnly: true, sameSite: "lax", maxAge: 604800 }))
    await expect(prepareSignupDraftAction({ ...draft, goal: "injected" })).rejects.toThrow()
    expect(mocks.setCookie).toHaveBeenCalledTimes(1)
  })
  it("keeps the draft recoverable when persistence fails", async () => {
    mocks.getCookie.mockReturnValue({ value: JSON.stringify(draft) })
    mocks.persist.mockRejectedValueOnce(new Error("database unavailable"))
    expect((await completeSignupDraftAction()).error).toContain("Tente novamente")
    expect(await completeSignupDraftAction()).toEqual({ formId: "saved-form", creditBalance: 70 })
  })
})
