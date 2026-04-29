"use client"

import { Plus, Trash2, X, Zap, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useBuilderStore } from "@/stores/builder-store"
import type { Question, QuestionType, LogicRule, LogicOperator } from "@/lib/types/form"
import { cn } from "@/lib/utils"
import { OnboardingHint } from "@/components/shared/onboarding-banner"
import { ONBOARDING_KEYS, setFlag } from "@/lib/utils/onboarding"

const OPERATOR_LABELS: Record<LogicOperator, string> = {
  equals: "é igual a",
  not_equals: "não é igual a",
  contains: "contém",
  not_contains: "não contém",
  greater_than: "é maior que",
  less_than: "é menor que",
  is_empty: "está vazia",
  is_not_empty: "não está vazia",
}

function getOperatorsForType(type: QuestionType): LogicOperator[] {
  switch (type) {
    case "multiple_choice":
    case "dropdown":
      return ["equals", "not_equals", "is_empty", "is_not_empty"]
    case "checkbox":
      return ["contains", "not_contains", "is_empty", "is_not_empty"]
    case "yes_no":
      return ["equals", "not_equals"]
    case "number":
    case "rating":
    case "scale":
    case "nps":
      return ["equals", "not_equals", "greater_than", "less_than", "is_empty", "is_not_empty"]
    default:
      return ["equals", "not_equals", "contains", "not_contains", "is_empty", "is_not_empty"]
  }
}

export function LogicPanel({ question, allQuestions }: { question: Question; allQuestions: Question[] }) {
  const updateQuestion = useBuilderStore((s) => s.updateQuestion)
  const rules = question.logicRules ?? []

  function addRule() {
    const newRule: LogicRule = {
      id: crypto.randomUUID(),
      condition: { questionId: question.id, operator: "equals", value: "" },
      action: { type: "jump_to", targetQuestionId: undefined },
    }
    updateQuestion(question.id, { logicRules: [...rules, newRule] })
    setFlag(ONBOARDING_KEYS.LOGIC_HINT_DISMISSED)
  }

  function updateRule(ruleId: string, partial: Partial<LogicRule>) {
    updateQuestion(question.id, {
      logicRules: rules.map((r) => (r.id === ruleId ? { ...r, ...partial } : r)),
    })
  }

  function deleteRule(ruleId: string) {
    updateQuestion(question.id, { logicRules: rules.filter((r) => r.id !== ruleId) })
  }

  const otherQuestions = allQuestions.filter((q) => q.id !== question.id)

  return (
    <div className="p-4 space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Regras de lógica</p>
        <p className="text-[11px] text-muted-foreground">Controle o fluxo baseado na resposta desta pergunta.</p>
      </div>

      <OnboardingHint
        storageKey={ONBOARDING_KEYS.LOGIC_HINT_DISMISSED}
        icon={Sparkles}
        title="Crie fluxos dinâmicos"
        description="Pule perguntas, oculte campos ou encerre o formulário com base na resposta — diferencial vs Google Forms."
      />

      {rules.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center text-muted-foreground">
          <Zap className="h-8 w-8 mb-3 opacity-20" />
          <p className="text-sm">Nenhuma regra definida.</p>
          <p className="text-[11px] mt-1">Adicione uma regra para criar fluxos dinâmicos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, i) => (
            <RuleEditor
              key={rule.id}
              index={i}
              rule={rule}
              question={question}
              otherQuestions={otherQuestions}
              onUpdate={(partial) => updateRule(rule.id, partial)}
              onDelete={() => deleteRule(rule.id)}
            />
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={addRule}>
        <Plus className="mr-1.5 h-3 w-3" /> Adicionar regra
      </Button>
    </div>
  )
}

function ConditionInput({
  condition,
  question,
  onChange,
  onDelete,
  canDelete,
}: {
  condition: LogicRule["condition"]
  question: Question
  onChange: (partial: Partial<LogicRule["condition"]>) => void
  onDelete: () => void
  canDelete: boolean
}) {
  const operators = getOperatorsForType(question.type)
  const showValue = !["is_empty", "is_not_empty"].includes(condition.operator)
  const isNumeric = ["number", "rating", "scale", "nps"].includes(question.type)
  const isChoice = ["multiple_choice", "dropdown"].includes(question.type)
  const isYesNo = question.type === "yes_no"
  const options = question.properties.options ?? []
  const selectClass = "w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  return (
    <div className="space-y-1.5 relative">
      <div className="flex gap-1">
        <select className={cn(selectClass, "flex-1")} value={condition.operator}
          onChange={(e) => onChange({ operator: e.target.value as LogicOperator, value: "" })}>
          {operators.map((op) => (
            <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
          ))}
        </select>
        {canDelete && (
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={onDelete}>
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      {showValue && (
        isYesNo ? (
          <select className={selectClass} value={String(condition.value)}
            onChange={(e) => onChange({ value: e.target.value === "true" })}>
            <option value="">Escolha...</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        ) : isChoice && options.length > 0 ? (
          <select className={selectClass} value={String(condition.value)}
            onChange={(e) => onChange({ value: e.target.value })}>
            <option value="">Escolha uma opção...</option>
            {options.map((opt) => (
              <option key={opt.id} value={opt.label}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input type={isNumeric ? "number" : "text"} className={selectClass}
            placeholder="Valor..."
            value={String(condition.value)}
            onChange={(e) => onChange({ value: isNumeric ? Number(e.target.value) : e.target.value })}
          />
        )
      )}
    </div>
  )
}

function RuleEditor({
  index,
  rule,
  question,
  otherQuestions,
  onUpdate,
  onDelete,
}: {
  index: number
  rule: LogicRule
  question: Question
  otherQuestions: Question[]
  onUpdate: (partial: Partial<LogicRule>) => void
  onDelete: () => void
}) {
  // Normalize to conditions array
  const conditions: LogicRule["condition"][] = rule.conditions?.length ? rule.conditions : [rule.condition]
  const conditionOperator = rule.conditionOperator ?? "and"

  function setConditions(next: LogicRule["condition"][]) {
    onUpdate({ conditions: next, condition: next[0] })
  }

  function updateConditionAt(i: number, partial: Partial<LogicRule["condition"]>) {
    const next = conditions.map((c, idx) => idx === i ? { ...c, ...partial } : c)
    setConditions(next)
  }

  function deleteConditionAt(i: number) {
    setConditions(conditions.filter((_, idx) => idx !== i))
  }

  function addCondition() {
    setConditions([...conditions, { questionId: question.id, operator: "equals" as LogicOperator, value: "" }])
  }

  function updateAction(partial: Partial<LogicRule["action"]>) {
    onUpdate({ action: { ...rule.action, ...partial } })
  }

  const selectClass = "w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Regra {index + 1}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={onDelete}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* WHEN */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Quando a resposta</p>
        {conditions.map((cond, i) => (
          <div key={i}>
            {i > 0 && (
              <button
                onClick={() => onUpdate({ conditionOperator: conditionOperator === "and" ? "or" : "and" })}
                className="text-[10px] font-semibold text-primary hover:underline my-1"
              >
                {conditionOperator === "and" ? "E" : "OU"}
              </button>
            )}
            <ConditionInput
              condition={cond}
              question={question}
              onChange={(partial) => updateConditionAt(i, partial)}
              onDelete={() => deleteConditionAt(i)}
              canDelete={conditions.length > 1}
            />
          </div>
        ))}
        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground px-1" onClick={addCondition}>
          <Plus className="h-3 w-3 mr-1" /> Adicionar condição
        </Button>
      </div>

      {/* THEN */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Então</p>
        <select className={selectClass} value={rule.action.type}
          onChange={(e) => updateAction({ type: e.target.value as LogicRule["action"]["type"], targetQuestionId: undefined })}>
          <option value="jump_to">Pular para</option>
          <option value="hide_question">Ocultar pergunta</option>
          <option value="end_form">Encerrar formulário</option>
        </select>
        {(rule.action.type === "jump_to" || rule.action.type === "hide_question") && (
          <select className={selectClass} value={rule.action.targetQuestionId ?? ""}
            onChange={(e) => updateAction({ targetQuestionId: e.target.value || undefined })}>
            <option value="">Escolha a pergunta...</option>
            {otherQuestions.map((q, i) => (
              <option key={q.id} value={q.id}>
                {i + 1}. {(q.title || "(sem título)").slice(0, 40)}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}
