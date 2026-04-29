import type { AnswerValue, LogicCondition, LogicRule, Question } from "@/lib/types/form"

// ─── Condition Evaluation ────────────────────────────────────────────────────

function valuesMatch(answer: AnswerValue, expected: LogicCondition["value"]): boolean {
    if (Array.isArray(answer)) {
        return answer.join(",") == expected
    }
    // Boolean ↔ string normalization for yes_no answers (rules saved as "true"/"false" strings).
    if (typeof answer === "boolean" && (expected === "true" || expected === "false")) {
        return answer === (expected === "true")
    }
    if (typeof expected === "boolean" && (answer === "true" || answer === "false")) {
        return expected === (answer === "true")
    }
    return answer == expected
}

export function evaluateCondition(condition: LogicCondition, answers: Record<string, AnswerValue>): boolean {
    const answerVal = answers[condition.questionId]
    switch (condition.operator) {
        case "equals": return valuesMatch(answerVal, condition.value)
        case "not_equals": return !valuesMatch(answerVal, condition.value)
        case "contains": {
            if (Array.isArray(answerVal)) return answerVal.includes(String(condition.value))
            return typeof answerVal === "string" && answerVal.includes(String(condition.value))
        }
        case "not_contains": {
            if (Array.isArray(answerVal)) return !answerVal.includes(String(condition.value))
            return typeof answerVal === "string" && !answerVal.includes(String(condition.value))
        }
        case "greater_than": return Number(answerVal) > Number(condition.value)
        case "less_than": return Number(answerVal) < Number(condition.value)
        case "is_empty": return answerVal == null || answerVal === "" || (Array.isArray(answerVal) && answerVal.length === 0)
        case "is_not_empty": return answerVal != null && answerVal !== "" && !(Array.isArray(answerVal) && answerVal.length === 0)
        default: return false
    }
}

export function evaluateRule(rule: LogicRule, answers: Record<string, AnswerValue>): boolean {
    const conditions = rule.conditions?.length ? rule.conditions : [rule.condition]
    const op = rule.conditionOperator ?? "and"
    return op === "and"
        ? conditions.every((c) => evaluateCondition(c, answers))
        : conditions.some((c) => evaluateCondition(c, answers))
}

// ─── Hidden Questions ────────────────────────────────────────────────────────

export function computeHiddenQuestions(questions: Question[], answers: Record<string, AnswerValue>): Set<string> {
    const hidden = new Set<string>()
    for (const q of questions) {
        for (const rule of q.logicRules ?? []) {
            if (evaluateRule(rule, answers) && rule.action.type === "hide_question" && rule.action.targetQuestionId) {
                hidden.add(rule.action.targetQuestionId)
            }
        }
    }
    return hidden
}

// ─── Next Question Resolution ────────────────────────────────────────────────

export function resolveNextIndex(
    current: number,
    questions: Question[],
    answers: Record<string, AnswerValue>,
    hidden: Set<string>
): number {
    const q = questions[current]
    if (q?.logicRules?.length) {
        for (const rule of q.logicRules) {
            if (evaluateRule(rule, answers)) {
                if (rule.action.type === "end_form") return questions.length
                if (rule.action.type === "jump_to" && rule.action.targetQuestionId) {
                    const idx = questions.findIndex((x) => x.id === rule.action.targetQuestionId)
                    if (idx !== -1) return idx
                }
            }
        }
    }
    // advance past hidden questions
    let next = current + 1
    while (next < questions.length && hidden.has(questions[next].id)) next++
    return next
}
