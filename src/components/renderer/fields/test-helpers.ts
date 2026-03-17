import type { Question } from "@/lib/types/form"

/**
 * Factory for minimal valid Question objects used in field tests.
 * Override any property with the second argument.
 */
export function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: "q-1",
    formId: "form-1",
    type: "short_text",
    title: "Pergunta de teste",
    required: false,
    order: 0,
    properties: {},
    logicRules: [],
    ...overrides,
  }
}

/** Default no-op handlers for FieldProps */
export const noop = () => {}
