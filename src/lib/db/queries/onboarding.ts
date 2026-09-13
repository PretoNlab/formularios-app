import { createHash } from "crypto"
import { eq, and } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { forms, questions } from "@/lib/db/schema"
import { buildSignupForm, type SignupDraft } from "@/lib/onboarding/draft"

// A stable, user-scoped UUID makes retries (including two tabs) idempotent.
export function onboardingFormId(userId: string, draftId: string) {
  const hash = createHash("sha256").update(`signup-v1:${userId}:${draftId}`).digest("hex")
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`
}

export async function persistSignupForm(userId: string, workspaceId: string, draft: SignupDraft) {
  const id = onboardingFormId(userId, draft.id)
  const built = buildSignupForm(draft)
  return db.transaction(async tx => {
    const inserted = await tx.insert(forms).values({
      id, workspaceId, createdById: userId, title: built.title,
      slug: `form-${id}`, status: "draft", theme: built.theme,
    }).onConflictDoNothing({ target: forms.id }).returning({ id: forms.id })
    if (inserted.length && built.questions.length) {
      await tx.insert(questions).values(built.questions.map(q => ({
        ...q, formId: id, properties: q.properties ?? {}, logicRules: [],
      })))
    }
    const [owned] = await tx.select({ id: forms.id }).from(forms)
      .where(and(eq(forms.id, id), eq(forms.createdById, userId)))
    if (!owned) throw new Error("Não foi possível recuperar seu formulário.")
    return owned.id
  })
}
