import { z } from "zod"
import { PRESET_THEMES } from "@/config/themes"
import type { TemplateQuestion } from "@/config/templates"

export const DRAFT_KEY = "formularios_signup_draft_v1"
export const DRAFT_COOKIE = "signup_draft"
export const DRAFT_MAX_AGE = 7 * 24 * 60 * 60
export const GOALS = [
  { id: "leads", label: "Captar contatos", detail: "Transforme interesse em uma boa conversa.", icon: "↗" },
  { id: "registrations", label: "Receber inscrições", detail: "Organize quem quer participar.", icon: "+" },
  { id: "feedback", label: "Ouvir clientes", detail: "Descubra o que funciona e o que pode melhorar.", icon: "♡" },
  { id: "research", label: "Fazer uma pesquisa", detail: "Abra espaço para novas perspectivas.", icon: "◎" },
  { id: "other", label: "Tenho outra ideia", detail: "Comece com uma estrutura simples.", icon: "✦" },
] as const
export const STYLES = [
  { id: "cream", label: "Acolhedor", color: "#d4622b" },
  { id: "lavender", label: "Criativo", color: "#7c3aed" },
  { id: "minimal", label: "Essencial", color: "#111111" },
] as const

export const draftSchema = z.object({
  version: z.literal(1),
  id: z.string().uuid(),
  goal: z.enum(["leads", "registrations", "feedback", "research", "other", "blank"]),
  context: z.string().trim().max(100),
  question: z.string().trim().max(160),
  title: z.string().trim().max(120),
  style: z.enum(["cream", "lavender", "minimal"]),
})
export type SignupDraft = z.infer<typeof draftSchema>

export function readSavedDraft(raw: string | null, now = Date.now()): SignupDraft | null {
  if (!raw) return null
  try {
    const result = z.object({ draft: draftSchema, savedAt: z.number() }).safeParse(JSON.parse(raw))
    if (!result.success || now - result.data.savedAt > DRAFT_MAX_AGE * 1000 || result.data.savedAt > now) return null
    return result.data.draft
  } catch { return null }
}

export function buildSignupForm(draft: SignupDraft) {
  const titles = {
    leads: "Vamos conversar", registrations: "Inscreva-se",
    feedback: "Como foi sua experiência?", research: "Queremos ouvir você",
    other: "Compartilhe sua resposta", blank: "Meu primeiro formulário",
  }
  const title = draft.title || `${titles[draft.goal]}${draft.context ? ` — ${draft.context}` : ""}`
  const theme = PRESET_THEMES.find(t => t.id === draft.style)!
  const questions: TemplateQuestion[] = []
  function add(type: TemplateQuestion["type"], text: string, required = false, properties: TemplateQuestion["properties"] = {}) {
    questions.push({ type, title: text, required, order: questions.length, properties })
  }
  if (draft.goal !== "blank") {
    add("welcome", title)
    if (draft.goal === "leads" || draft.goal === "registrations") {
      add("short_text", "Como você se chama?", true)
      add("email", "Qual é o seu e-mail?", true)
      if (draft.goal === "leads") add("whatsapp", "Quer deixar seu WhatsApp?")
    }
    if (draft.goal === "feedback") {
      add("rating", "Como você avalia sua experiência?", true, { ratingMax: 5, ratingStyle: "stars" })
      add("long_text", "O que podemos melhorar?")
    }
    if (draft.goal === "research" || draft.goal === "other") {
      add("long_text", "O que você gostaria de compartilhar?", true)
    }
    if (draft.question) add("long_text", draft.question)
    add("thank_you", "Obrigado! Sua resposta faz a diferença.")
  }
  return { title, theme, questions }
}

export const QUESTION_PRESETS: Record<SignupDraft["goal"], string[]> = {
  leads: [
    "Qual é o principal desafio do seu negócio hoje?",
    "Qual o orçamento estimado para esse projeto?",
    "Quantas pessoas trabalham na sua empresa?",
    "Quando você gostaria de iniciar?",
    "Qual o melhor horário para entrarmos em contato?",
  ],
  registrations: [
    "Como você conheceu este evento?",
    "Possui alguma restrição alimentar ou necessidade especial?",
    "Qual é o seu nível de experiência com o tema?",
    "Em qual modalidade prefere participar?",
    "O que você mais espera aprender ou vivenciar?",
  ],
  feedback: [
    "O que mais chamou sua atenção positivamente?",
    "Qual ponto você acha que podemos melhorar?",
    "O que quase te impediu de concluir com a gente?",
    "Como foi a velocidade e cordialidade do atendimento?",
    "Qual outro serviço ou produto você gostaria de ver por aqui?",
  ],
  research: [
    "Com que frequência você utiliza soluções semelhantes?",
    "Qual é a sua maior prioridade profissional neste semestre?",
    "O que falta nas ferramentas atuais do mercado?",
    "Quanto tempo você gasta semanalmente nessa tarefa?",
    "Qual benefício mais pesaria na sua decisão de escolha?",
  ],
  other: [
    "O que você mais espera alcançar com este formulário?",
    "Como podemos te ajudar da melhor maneira?",
    "Qual detalhe não podemos deixar de saber?",
  ],
  blank: [],
}

