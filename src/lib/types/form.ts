// ─── Question Types Registry ───

export const QUESTION_TYPES = {
  short_text: { label: "Texto curto", icon: "Aa", category: "input", hasOptions: false },
  long_text: { label: "Texto longo", icon: "¶", category: "input", hasOptions: false },
  email: { label: "E-mail", icon: "@", category: "input", hasOptions: false },
  number: { label: "Número", icon: "#", category: "input", hasOptions: false },
  phone: { label: "Telefone", icon: "📱", category: "input", hasOptions: false },
  whatsapp: { label: "WhatsApp", icon: "💬", category: "input", hasOptions: false },
  cpf: { label: "CPF", icon: "🪪", category: "input", hasOptions: false },
  cnpj: { label: "CNPJ", icon: "🏢", category: "input", hasOptions: false },
  date: { label: "Data", icon: "📅", category: "input", hasOptions: false },
  url: { label: "URL", icon: "🔗", category: "input", hasOptions: false },
  multiple_choice: { label: "Múltipla escolha", icon: "○", category: "selection", hasOptions: true },
  checkbox: { label: "Caixas de seleção", icon: "☐", category: "selection", hasOptions: true },
  dropdown: { label: "Dropdown", icon: "▾", category: "selection", hasOptions: true },
  yes_no: { label: "Sim / Não", icon: "◑", category: "selection", hasOptions: false },
  rating: { label: "Avaliação", icon: "★", category: "rating", hasOptions: false },
  scale: { label: "Escala", icon: "⊞", category: "rating", hasOptions: false },
  nps: { label: "NPS (0-10)", icon: "📊", category: "rating", hasOptions: false },
  welcome: { label: "Tela de boas-vindas", icon: "👋", category: "layout", hasOptions: false },
  statement: { label: "Declaração", icon: "💬", category: "layout", hasOptions: false },
  thank_you: { label: "Tela de agradecimento", icon: "🎉", category: "layout", hasOptions: false },
  file_upload: { label: "Upload de arquivo", icon: "📎", category: "advanced", hasOptions: false },
  signature: { label: "Assinatura", icon: "✍️", category: "advanced", hasOptions: false },
} as const

export type QuestionType = keyof typeof QUESTION_TYPES
export type QuestionCategory = "input" | "selection" | "rating" | "layout" | "advanced"

export interface Question {
  id: string
  formId: string
  type: QuestionType
  title: string
  description?: string
  required: boolean
  order: number
  properties: QuestionProperties
  logicRules: LogicRule[]
}

export interface QuestionProperties {
  placeholder?: string
  maxLength?: number
  minLength?: number
  options?: QuestionOption[]
  allowOther?: boolean
  randomizeOptions?: boolean
  min?: number
  max?: number
  step?: number
  ratingStyle?: "stars" | "hearts" | "thumbs" | "numbers"
  ratingMax?: number
  scaleMin?: number
  scaleMax?: number
  scaleMinLabel?: string
  scaleMaxLabel?: string
  allowedFileTypes?: string[]
  maxFileSize?: number
  defaultCountry?: string
  buttonText?: string
  imageUrl?: string
  videoUrl?: string
}

export interface QuestionOption {
  id: string
  label: string
  imageUrl?: string
}

export interface LogicRule {
  id: string
  condition: LogicCondition
  action: LogicAction
}

export interface LogicCondition {
  questionId: string
  operator: LogicOperator
  value: string | number | boolean | string[]
}

export type LogicOperator =
  | "equals" | "not_equals" | "contains" | "not_contains"
  | "greater_than" | "less_than" | "is_empty" | "is_not_empty"

export interface LogicAction {
  type: "jump_to" | "hide_question" | "show_question" | "end_form"
  targetQuestionId?: string
}

export type FormStatus = "draft" | "published" | "closed"

export interface Form {
  id: string
  workspaceId: string
  createdById: string
  title: string
  description?: string
  slug: string
  status: FormStatus
  theme: ThemeConfig
  settings: FormSettings
  questions: Question[]
  responseCount: number
  viewCount: number
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export interface FormSettings {
  showProgressBar: boolean
  showQuestionNumbers: boolean
  allowPartialResponses: boolean
  notifyOnResponse: boolean
  notificationEmail: string | null
  redirectUrl: string | null
  closeMessage: string
  responseLimit: number | null
  closedAt: string | null
}

export interface ThemeConfig {
  id: string
  colors: ThemeColors
  font: ThemeFont
  borderRadius: string
  backgroundImage?: string
  customCSS?: string
  logo?: {
    url: string
    position: "left" | "center" | "right"
  }
}

export interface ThemeColors {
  bg: string
  card: string
  accent: string
  text: string
  muted: string
  inputBg?: string
}

export interface ThemeFont {
  heading: string
  body: string
}

export interface FormResponse {
  id: string
  formId: string
  answers: Record<string, AnswerValue>
  startedAt: string
  completedAt?: string
  metadata: ResponseMetadata
}

export type AnswerValue =
  | string | number | boolean | string[]
  | { fileUrl: string; fileName: string }
  | null

export interface ResponseMetadata {
  userAgent: string | null
  ipHash: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  referrer: string | null
  deviceType: "desktop" | "mobile" | "tablet" | null
}

export interface FormAnalytics {
  totalViews: number
  totalResponses: number
  completionRate: number
  averageCompletionTime: number
  responsesByDay: { date: string; count: number }[]
  dropoffByQuestion: { questionId: string; dropoffRate: number }[]
  questionStats: QuestionAnalytics[]
  mobilePercentage: number
  sourceBreakdown: { source: string; count: number; percentage: number; completionRate: number; avgTime: number }[]
  deviceBreakdown: { device: string; count: number; percentage: number }[]
  responsesByHour: { dow: number; hour: number; count: number }[]
}

export interface QuestionAnalytics {
  questionId: string
  questionTitle: string
  questionType: QuestionType
  totalAnswers: number
  skipRate: number
  // Selection types (multiple_choice, checkbox, dropdown, yes_no)
  optionCounts?: { option: string; count: number; percentage: number }[]
  // Numeric types (rating, scale, nps, number)
  average?: number
  min?: number
  max?: number
  distribution?: { value: number; count: number }[]
  // Rating specific
  ratingMax?: number
  ratingStyle?: "stars" | "hearts" | "thumbs" | "numbers"
  // Scale specific
  scaleMin?: number
  scaleMax?: number
  scaleMinLabel?: string
  scaleMaxLabel?: string
  // NPS specific
  npsScore?: number
  npsPromoters?: number
  npsPassives?: number
  npsDetractors?: number
  // Text types
  textSamples?: string[]
}

export type IntegrationType =
  | "webhook" | "email" | "google_sheets" | "whatsapp"
  | "n8n" | "zapier" | "slack"

export interface Integration {
  id: string
  formId: string
  type: IntegrationType
  name: string
  enabled: boolean
  config: Record<string, unknown>
  lastTriggeredAt?: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: { code: string; message: string; details?: Record<string, string[]> }
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

export interface BuilderState {
  form: Form
  selectedQuestionId: string | null
  isDragging: boolean
  hasUnsavedChanges: boolean
  undoStack: Form[]
  redoStack: Form[]
}

export interface RendererState {
  currentQuestionIndex: number
  answers: Record<string, AnswerValue>
  startedAt: string
  isSubmitting: boolean
  isComplete: boolean
  visitedQuestions: Set<string>
}
