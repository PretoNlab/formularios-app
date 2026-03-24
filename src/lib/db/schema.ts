import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// ─── Enums ───

export const formStatusEnum = pgEnum("form_status", ["draft", "published", "closed"])
export const planEnum = pgEnum("plan", ["free", "pro", "business"])

// ─── Users & Workspaces ───

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  plan: planEnum("plan").default("free").notNull(),
  creditBalance: integer("credit_balance").default(0).notNull(),
  supabaseAuthId: text("supabase_auth_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const workspaceMembers = pgTable("workspace_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: text("role").default("member").notNull(), // "owner" | "admin" | "member"
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueMember: uniqueIndex("unique_workspace_member").on(table.workspaceId, table.userId),
}))

// ─── Forms ───

export const forms = pgTable("forms", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  createdById: uuid("created_by_id").references(() => users.id).notNull(),

  // Identidade
  title: text("title").notNull().default("Formulário sem título"),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  status: formStatusEnum("status").default("draft").notNull(),

  // Tema e aparência
  theme: jsonb("theme").$type<FormThemeConfig>().default({
    id: "midnight",
    colors: { bg: "#0f0f1a", card: "#1a1a2e", accent: "#6c63ff", text: "#e8e8f0", muted: "#6b6b8d" },
    font: { heading: "Fraunces", body: "DM Sans" },
    borderRadius: "12px",
  }),

  // Configurações
  settings: jsonb("settings").$type<FormSettings>().default({
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
  }),

  // Metadados
  responseCount: integer("response_count").default(0).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
}, (table) => ({
  slugIdx: uniqueIndex("form_slug_idx").on(table.slug),
  workspaceIdx: index("form_workspace_idx").on(table.workspaceId),
  statusIdx: index("form_status_idx").on(table.status),
}))

// ─── Questions ───

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id").references(() => forms.id, { onDelete: "cascade" }).notNull(),

  // Conteúdo
  type: text("type").notNull(), // QuestionType
  title: text("title").notNull().default(""),
  description: text("description"),
  required: boolean("required").default(false).notNull(),
  order: integer("order").notNull(),

  // Propriedades específicas do tipo (opções, placeholder, validações, etc.)
  properties: jsonb("properties").$type<QuestionProperties>().default({}),

  // Lógica condicional
  logicRules: jsonb("logic_rules").$type<LogicRule[]>().default([]),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  formOrderIdx: index("question_form_order_idx").on(table.formId, table.order),
}))

// ─── Responses & Answers ───

export const responses = pgTable("responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id").references(() => forms.id, { onDelete: "cascade" }).notNull(),

  // Tracking
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),

  // Metadados do respondente
  metadata: jsonb("metadata").$type<ResponseMetadata>().default({
    userAgent: null,
    ipHash: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    referrer: null,
    deviceType: null,
  }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  formIdx: index("response_form_idx").on(table.formId),
  completedIdx: index("response_completed_idx").on(table.completedAt),
}))

export const answers = pgTable("answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  responseId: uuid("response_id").references(() => responses.id, { onDelete: "cascade" }).notNull(),
  questionId: uuid("question_id").references(() => questions.id, { onDelete: "cascade" }).notNull(),

  // Valor flexível — string, number, array, object
  value: jsonb("value").$type<AnswerValue>(),

  answeredAt: timestamp("answered_at").defaultNow().notNull(),
}, (table) => ({
  responseQuestionIdx: uniqueIndex("answer_response_question_idx").on(table.responseId, table.questionId),
}))

// ─── Integrations & Webhooks ───

export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id").references(() => forms.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // "webhook" | "email" | "google_sheets" | "whatsapp" | "n8n" | "zapier"
  name: text("name").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  config: jsonb("config").$type<IntegrationConfig>().default({}),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ─── Credits ───

export const creditOrders = pgTable("credit_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  packId: text("pack_id").notNull(),
  credits: integer("credits").notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").default("pending").notNull(), // pending | paid | expired
  abacatepayId: text("abacatepay_id"),
  pixCode: text("pix_code"),
  pixQrBase64: text("pix_qr_base64"),
  expiresAt: timestamp("expires_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const creditTransactions = pgTable("credit_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // 'welcome' | 'purchase' | 'usage'
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ─── Relations ───

export const usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
  forms: many(forms),
  creditOrders: many(creditOrders),
  creditTransactions: many(creditTransactions),
}))

export const creditOrdersRelations = relations(creditOrders, ({ one }) => ({
  user: one(users, { fields: [creditOrders.userId], references: [users.id] }),
}))

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, { fields: [creditTransactions.userId], references: [users.id] }),
}))

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, { fields: [workspaces.ownerId], references: [users.id] }),
  members: many(workspaceMembers),
  forms: many(forms),
}))

export const formsRelations = relations(forms, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [forms.workspaceId], references: [workspaces.id] }),
  createdBy: one(users, { fields: [forms.createdById], references: [users.id] }),
  questions: many(questions),
  responses: many(responses),
  integrations: many(integrations),
}))

export const questionsRelations = relations(questions, ({ one, many }) => ({
  form: one(forms, { fields: [questions.formId], references: [forms.id] }),
  answers: many(answers),
}))

export const responsesRelations = relations(responses, ({ one, many }) => ({
  form: one(forms, { fields: [responses.formId], references: [forms.id] }),
  answers: many(answers),
}))

export const answersRelations = relations(answers, ({ one }) => ({
  response: one(responses, { fields: [answers.responseId], references: [responses.id] }),
  question: one(questions, { fields: [answers.questionId], references: [questions.id] }),
}))

// ─── Type Definitions (referenced by $type above) ───

export interface FormThemeConfig {
  id: string
  colors: {
    bg: string
    card: string
    accent: string
    text: string
    muted: string
    inputBg?: string
  }
  font: {
    heading: string
    body: string
  }
  borderRadius: string
  backgroundImage?: string
  customCSS?: string
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
  downloadUrl: string | null
  downloadLabel: string | null
}

export interface QuestionProperties {
  // Texto
  placeholder?: string
  maxLength?: number
  minLength?: number

  // Opções (multiple_choice, checkbox, dropdown)
  options?: QuestionOption[]
  allowOther?: boolean
  randomizeOptions?: boolean

  // Numéricos
  min?: number
  max?: number
  step?: number

  // Rating
  ratingStyle?: "stars" | "hearts" | "thumbs" | "numbers"
  ratingMax?: number

  // Scale
  scaleMin?: number
  scaleMax?: number
  scaleMinLabel?: string
  scaleMaxLabel?: string

  // File upload
  allowedFileTypes?: string[]
  maxFileSize?: number // MB

  // Phone
  defaultCountry?: string

  // Layout
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
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "greater_than" | "less_than" | "is_empty" | "is_not_empty"
  value: string | number | boolean | string[]
}

export interface LogicAction {
  type: "jump_to" | "hide_question" | "show_question" | "end_form"
  targetQuestionId?: string
}

export type AnswerValue =
  | string
  | number
  | boolean
  | string[]
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

export interface IntegrationConfig {
  // Webhook
  url?: string
  method?: "POST" | "PUT"
  headers?: Record<string, string>
  secret?: string

  // Email
  to?: string[]
  subject?: string
  template?: string

  // Google Sheets
  spreadsheetId?: string
  spreadsheetTitle?: string
  sheetName?: string
  accessToken?: string
  refreshToken?: string
  tokenExpiry?: number
  lastError?: string
  lastErrorAt?: string

  // WhatsApp (Evolution API / ManyChat)
  phoneNumber?: string
  apiKey?: string
  templateName?: string

  // n8n / Zapier
  webhookUrl?: string
}
