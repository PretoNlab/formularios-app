import {
  Type, AlignLeft, Hash, Phone, TextCursorInput, Calendar, Link2 as LinkIcon,
  ListTodo, CheckSquare, ChevronDown, ToggleLeft,
  Star, TrendingUp, Presentation, MessageSquare,
  PartyPopper, Paperclip, PenTool, Download, MessageCircle, CreditCard, Building2,
} from "lucide-react"
import type { Question, QuestionType, QuestionProperties } from "@/lib/types/form"
import { QUESTION_TYPES } from "@/lib/types/form"

export const TYPE_ICONS: Record<string, React.ElementType> = {
  short_text: Type,
  long_text: AlignLeft,
  email: TextCursorInput,
  number: Hash,
  phone: Phone,
  whatsapp: MessageCircle,
  cpf: CreditCard,
  cnpj: Building2,
  date: Calendar,
  url: LinkIcon,
  multiple_choice: ListTodo,
  checkbox: CheckSquare,
  dropdown: ChevronDown,
  yes_no: ToggleLeft,
  rating: Star,
  scale: TrendingUp,
  nps: TrendingUp,
  welcome: Presentation,
  statement: MessageSquare,
  thank_you: PartyPopper,
  download: Download,
  file_upload: Paperclip,
  signature: PenTool,
}

export const SIDEBAR_TYPES: QuestionType[] = [
  "short_text", "long_text", "email", "number",
  "phone", "whatsapp",
  "cpf", "cnpj", "date",
  "multiple_choice", "checkbox", "dropdown", "yes_no",
  "rating", "scale", "nps",
  "download", "file_upload", "signature",
]

export function createQuestion(type: QuestionType, formId: string, order: number): Question {
  const hasOptions = ["multiple_choice", "checkbox", "dropdown"].includes(type)

  const defaultProperties: Record<string, QuestionProperties> = {
    multiple_choice: { options: [{ id: crypto.randomUUID(), label: "Opção 1" }, { id: crypto.randomUUID(), label: "Opção 2" }, { id: crypto.randomUUID(), label: "Opção 3" }] },
    checkbox:        { options: [{ id: crypto.randomUUID(), label: "Opção 1" }, { id: crypto.randomUUID(), label: "Opção 2" }, { id: crypto.randomUUID(), label: "Opção 3" }] },
    dropdown:        { options: [{ id: crypto.randomUUID(), label: "Opção 1" }, { id: crypto.randomUUID(), label: "Opção 2" }, { id: crypto.randomUUID(), label: "Opção 3" }] },
    rating:          { ratingStyle: "stars", ratingMax: 5 },
    scale:           { scaleMin: 1, scaleMax: 10, scaleMinLabel: "Ruim", scaleMaxLabel: "Ótimo" },
    nps:             { scaleMin: 0, scaleMax: 10, scaleMinLabel: "Nada provável", scaleMaxLabel: "Muito provável" },
    email:           { placeholder: "seu@email.com" },
    phone:           { placeholder: "(00) 00000-0000" },
    number:          { placeholder: "0" },
    short_text:      { placeholder: "Digite aqui..." },
    long_text:       { placeholder: "Escreva sua resposta..." },
    url:             { placeholder: "https://" },
  }

  const defaultTitles: Partial<Record<QuestionType, string>> = {
    nps:             "Em uma escala de 0 a 10, qual a probabilidade de você nos recomendar?",
    rating:          "Como você avalia nossa experiência?",
    scale:           "Como você avalia nosso serviço?",
    email:           "Qual é o seu e-mail?",
    phone:           "Qual é o seu telefone?",
    short_text:      "Qual é o seu nome?",
    yes_no:          "Você concorda com os termos?",
    file_upload:     "Envie um arquivo",
    signature:       "Assine abaixo",
    welcome:         "Bem-vindo(a)!",
    thank_you:       "Obrigado pela sua resposta!",
    date:            "Selecione uma data",
  }

  return {
    id: crypto.randomUUID(),
    formId,
    type,
    title: defaultTitles[type] ?? QUESTION_TYPES[type].label,
    required: false,
    order,
    properties: hasOptions
      ? defaultProperties[type] ?? { options: [{ id: crypto.randomUUID(), label: "Opção 1" }, { id: crypto.randomUUID(), label: "Opção 2" }] }
      : defaultProperties[type] ?? {},
    logicRules: [],
  }
}
