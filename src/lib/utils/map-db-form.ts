import type { Form, Question, QuestionType } from "@/lib/types/form"
import type { FormWithQuestions } from "@/lib/db/queries/forms"

export const DEFAULT_THEME: Form["theme"] = {
  id: "midnight",
  colors: { bg: "#0f0f1a", card: "#1a1a2e", accent: "#6c63ff", text: "#e8e8f0", muted: "#6b6b8d" },
  font: { heading: "Fraunces", body: "DM Sans" },
  borderRadius: "12px",
}

export const DEFAULT_SETTINGS: Form["settings"] = {
  showProgressBar: true,
  showQuestionNumbers: true,
  allowPartialResponses: true,
  notifyOnResponse: false,
  notificationEmail: null,
  redirectUrl: null,
  closeMessage: "Este formulário não está mais aceitando respostas.",
  responseLimit: null,
  closedAt: null,
  downloadUrl: null,
  downloadLabel: null,
  autoResponderEnabled: false,
  autoResponderEmailFieldId: null,
  autoResponderSubject: "Recebemos sua resposta!",
  autoResponderBody: "Obrigado por preencher nosso formulário. Segue em anexo o material prometido.",
}

export function mapDbForm(dbForm: FormWithQuestions): Form {
  return {
    id: dbForm.id,
    title: dbForm.title,
    description: dbForm.description ?? undefined,
    slug: dbForm.slug,
    status: dbForm.status,
    theme: dbForm.theme ?? DEFAULT_THEME,
    settings: dbForm.settings ?? DEFAULT_SETTINGS,
    questions: dbForm.questions.map(
      (q): Question => ({
        id: q.id,
        formId: q.formId,
        type: q.type as QuestionType,
        title: q.title,
        description: q.description ?? undefined,
        required: q.required,
        order: q.order,
        properties: q.properties ?? {},
        logicRules: q.logicRules ?? [],
      })
    ),
    responseCount: dbForm.responseCount,
    viewCount: dbForm.viewCount,
    createdAt: dbForm.createdAt.toISOString(),
    updatedAt: dbForm.updatedAt.toISOString(),
    publishedAt: dbForm.publishedAt?.toISOString(),
  }
}
