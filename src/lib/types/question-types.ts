import { QUESTION_TYPES } from "@/lib/types/form"
import type { QuestionType, QuestionCategory } from "@/lib/types/form"

export interface QuestionTypeGroup {
  category: QuestionCategory
  label: string
  types: { type: QuestionType; label: string; icon: string }[]
}

export const QUESTION_TYPE_GROUPS: QuestionTypeGroup[] = [
  {
    category: "input",
    label: "Campos de entrada",
    types: [
      { type: "short_text", ...QUESTION_TYPES.short_text },
      { type: "long_text", ...QUESTION_TYPES.long_text },
      { type: "email", ...QUESTION_TYPES.email },
      { type: "number", ...QUESTION_TYPES.number },
      { type: "phone", ...QUESTION_TYPES.phone },
      { type: "date", ...QUESTION_TYPES.date },
      { type: "url", ...QUESTION_TYPES.url },
    ],
  },
  {
    category: "selection",
    label: "Campos de selecao",
    types: [
      { type: "multiple_choice", ...QUESTION_TYPES.multiple_choice },
      { type: "checkbox", ...QUESTION_TYPES.checkbox },
      { type: "dropdown", ...QUESTION_TYPES.dropdown },
      { type: "yes_no", ...QUESTION_TYPES.yes_no },
    ],
  },
  {
    category: "rating",
    label: "Avaliacao",
    types: [
      { type: "rating", ...QUESTION_TYPES.rating },
      { type: "scale", ...QUESTION_TYPES.scale },
      { type: "nps", ...QUESTION_TYPES.nps },
    ],
  },
  {
    category: "layout",
    label: "Layout",
    types: [
      { type: "welcome", ...QUESTION_TYPES.welcome },
      { type: "statement", ...QUESTION_TYPES.statement },
      { type: "thank_you", ...QUESTION_TYPES.thank_you },
    ],
  },
  {
    category: "advanced",
    label: "Avancado",
    types: [
      { type: "file_upload", ...QUESTION_TYPES.file_upload },
      { type: "download", ...QUESTION_TYPES.download },
      { type: "signature", ...QUESTION_TYPES.signature },
    ],
  },
]

export function getDefaultProperties(type: QuestionType): Record<string, unknown> {
  const defaults: Partial<Record<QuestionType, Record<string, unknown>>> = {
    short_text: { placeholder: "Digite sua resposta...", maxLength: 255 },
    long_text: { placeholder: "Digite sua resposta...", maxLength: 5000 },
    email: { placeholder: "nome@exemplo.com" },
    number: { placeholder: "0", min: 0 },
    phone: { placeholder: "(00) 00000-0000", defaultCountry: "BR" },
    url: { placeholder: "https://" },
    multiple_choice: { options: [{ id: "opt_1", label: "Opcao 1" }, { id: "opt_2", label: "Opcao 2" }], allowOther: false, randomizeOptions: false },
    checkbox: { options: [{ id: "opt_1", label: "Opcao 1" }, { id: "opt_2", label: "Opcao 2" }], allowOther: false },
    dropdown: { options: [{ id: "opt_1", label: "Opcao 1" }, { id: "opt_2", label: "Opcao 2" }] },
    rating: { ratingStyle: "stars", ratingMax: 5 },
    scale: { scaleMin: 1, scaleMax: 10, scaleMinLabel: "Discordo", scaleMaxLabel: "Concordo" },
    nps: { scaleMin: 0, scaleMax: 10, scaleMinLabel: "Nada provavel", scaleMaxLabel: "Muito provavel" },
    welcome: { buttonText: "Comecar" },
    statement: { buttonText: "Continuar" },
    thank_you: { buttonText: "Enviar outra resposta" },
    download: { buttonText: "Baixar arquivo", downloadButtonSize: "default", downloadButtonAlign: "center" },
  }
  return defaults[type] || {}
}

export function isLayoutType(type: QuestionType): boolean {
  return QUESTION_TYPES[type].category === "layout"
}

export function hasOptions(type: QuestionType): boolean {
  return QUESTION_TYPES[type].hasOptions
}
