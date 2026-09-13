import { describe, it, expect } from "vitest"
import { buildSignupForm, draftSchema, readSavedDraft, DRAFT_MAX_AGE, type SignupDraft } from "./draft"

const draft: SignupDraft = { version: 1, id: "95fbb4a4-33ca-4b0c-84a4-20ed7d015112", goal: "leads", context: "Studio Aurora", question: "O que você precisa?", title: "", style: "cream" }

describe("signup draft", () => {
  it("builds the exact preview content with context and extra question", () => {
    const built = buildSignupForm(draft)
    expect(built.title).toBe("Vamos conversar — Studio Aurora")
    expect(built.questions.map(q => q.type)).toEqual(["welcome", "short_text", "email", "whatsapp", "long_text", "thank_you"])
    expect(built.questions[4].title).toBe(draft.question)
    expect(built.questions.map(q => q.order)).toEqual([0,1,2,3,4,5])
  })
  it("supports blank drafts and preserves selected title and theme", () => {
    const built = buildSignupForm({ ...draft, goal: "blank", title: "Meu projeto", style: "minimal" })
    expect(built.questions).toEqual([])
    expect(built.title).toBe("Meu projeto")
    expect(built.theme.id).toBe("minimal")
  })
  it("rejects tampered types, invalid IDs and oversized payloads", () => {
    expect(draftSchema.safeParse({ ...draft, goal: "injected" }).success).toBe(false)
    expect(draftSchema.safeParse({ ...draft, id: "bad" }).success).toBe(false)
    expect(draftSchema.safeParse({ ...draft, question: "x".repeat(161) }).success).toBe(false)
  })
  it("restores only valid drafts within the retention window", () => {
    const now = 1900000000000
    expect(readSavedDraft(JSON.stringify({ draft, savedAt: now }), now)).toEqual(draft)
    expect(readSavedDraft(JSON.stringify({ draft, savedAt: now - DRAFT_MAX_AGE * 1000 - 1 }), now)).toBeNull()
    expect(readSavedDraft("{broken", now)).toBeNull()
  })
})
