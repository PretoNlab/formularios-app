import { z } from "zod"

// ─── Question Option ───

export const questionOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1, "Label da opcao nao pode ser vazio"),
  imageUrl: z.string().url().optional(),
})

// ─── Logic Rules ───

export const logicConditionSchema = z.object({
  questionId: z.string().uuid(),
  operator: z.enum([
    "equals", "not_equals", "contains", "not_contains",
    "greater_than", "less_than", "is_empty", "is_not_empty",
  ]),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
})

export const logicActionSchema = z.object({
  type: z.enum(["jump_to", "hide_question", "show_question", "end_form"]),
  targetQuestionId: z.string().uuid().optional(),
})

export const logicRuleSchema = z.object({
  id: z.string().min(1),
  condition: logicConditionSchema,
  action: logicActionSchema,
})

// ─── Question ───

export const questionSchema = z.object({
  id: z.string().min(1),
  formId: z.string().uuid(),
  type: z.string().min(1),
  title: z.string().min(1, "Titulo da pergunta e obrigatorio"),
  description: z.string().optional(),
  required: z.boolean().default(false),
  order: z.number().int().nonnegative(),
  properties: z.record(z.unknown()).default({}),
  logicRules: z.array(logicRuleSchema).default([]),
})

// ─── Theme ───

export const themeColorsSchema = z.object({
  bg: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor invalida"),
  card: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  text: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  muted: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  inputBg: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

export const themeConfigSchema = z.object({
  id: z.string().min(1),
  colors: themeColorsSchema,
  font: z.object({
    heading: z.string().min(1),
    body: z.string().min(1),
  }),
  borderRadius: z.string(),
  backgroundImage: z.string().url().optional(),
  customCSS: z.string().max(5000).optional(),
})

// ─── Form Settings ───

export const formSettingsSchema = z.object({
  showProgressBar: z.boolean().default(true),
  showQuestionNumbers: z.boolean().default(true),
  allowPartialResponses: z.boolean().default(true),
  notifyOnResponse: z.boolean().default(false),
  notificationEmail: z.string().email().nullable().default(null),
  redirectUrl: z.string().url().nullable().default(null),
  closeMessage: z.string().default("Este formulario nao esta mais aceitando respostas."),
  responseLimit: z.number().int().positive().nullable().default(null),
  closedAt: z.string().datetime().nullable().default(null),
})

// ─── Form (Create / Update) ───

export const createFormSchema = z.object({
  title: z.string().min(1, "Titulo e obrigatorio").max(200),
  description: z.string().max(1000).optional(),
  workspaceId: z.string().uuid(),
})

export const updateFormSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minusculas, numeros e hifens").optional(),
  status: z.enum(["draft", "published", "closed"]).optional(),
  theme: themeConfigSchema.optional(),
  settings: formSettingsSchema.partial().optional(),
})

// ─── Response Submission ───

export const answerValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.object({ fileUrl: z.string().url(), fileName: z.string() }),
  z.null(),
])

export const submitResponseSchema = z.object({
  formId: z.string().uuid(),
  answers: z.record(z.string(), answerValueSchema),
  metadata: z.object({
    userAgent: z.string().nullable().optional(),
    utmSource: z.string().nullable().optional(),
    utmMedium: z.string().nullable().optional(),
    utmCampaign: z.string().nullable().optional(),
    referrer: z.string().nullable().optional(),
  }).optional(),
})

export const savePartialResponseSchema = z.object({
  formId: z.string().uuid(),
  responseId: z.string().uuid().optional(),
  answers: z.record(z.string(), answerValueSchema),
})

// ─── Type exports ───

export type CreateFormInput = z.infer<typeof createFormSchema>
export type UpdateFormInput = z.infer<typeof updateFormSchema>
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>
export type SavePartialResponseInput = z.infer<typeof savePartialResponseSchema>
