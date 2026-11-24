import { describe, it, expect } from "vitest"
import {
  computeAggregateSsrScore,
  extractCleanJson,
  normalizeSyntheticAnswers,
} from "./ssr-engine"
import type { Question } from "@/lib/types/form"

function makeQuestion(overrides: Partial<Question> & Pick<Question, "id" | "type" | "order">): Question {
  return {
    formId: "form-1",
    title: "Pergunta",
    required: true,
    properties: {},
    logicRules: [],
    ...overrides,
  }
}

describe("ssr-engine", () => {
  it("computes SSR aggregate score, dispersion and distribution accurately", () => {
    const res = computeAggregateSsrScore([1, 2, 4, 5, 5])
    expect(res.score).toBe(3.4)
    expect(res.highIntentPercentage).toBe(60)
    expect(res.dispersion).toBeGreaterThan(1.4)
    expect(res.distribution.find((d) => d.anchor === 5)?.count).toBe(2)
    expect(res.distribution.find((d) => d.anchor === 1)?.percentage).toBe(20)
  })

  it("extracts clean JSON even when wrapped in markdown fences", () => {
    const raw = "Aqui está o JSON:\n```json\n{\"score\": 4}\n```"
    expect(JSON.parse(extractCleanJson(raw))).toEqual({ score: 4 })
  })

  it("clamps numeric scales, matches option labels and respects logic jumps", () => {
    const questions: Question[] = [
      makeQuestion({
        id: "q1",
        order: 0,
        type: "yes_no",
        logicRules: [
          {
            id: "r1",
            condition: { questionId: "q1", operator: "equals", value: false },
            action: { type: "jump_to", targetQuestionId: "q3" },
          },
        ],
      }),
      makeQuestion({
        id: "q2",
        order: 1,
        type: "multiple_choice",
        properties: {
          options: [
            { id: "o1", label: "Plano Mensal" },
            { id: "o2", label: "Plano Anual" },
          ],
        },
      }),
      makeQuestion({
        id: "q3",
        order: 2,
        type: "nps",
      }),
    ]

    // Persona answered "Não" on q1 -> logic jumps over q2 directly to q3
    const normalized = normalizeSyntheticAnswers(questions, {
      q1: "Não",
      q2: "plano anual",
      q3: 14, // out-of-range NPS should clamp to 10
    })

    expect(normalized).toEqual([
      { questionId: "q1", value: false },
      { questionId: "q3", value: 10 },
    ])
  })
})

