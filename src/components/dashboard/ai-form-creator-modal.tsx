"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { 
  Sparkles, 
  Loader2, 
  Wand2, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  GitFork, 
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  HelpCircle,
  Undo2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  generateFormDraftWithAiAction,
  refineFormDraftWithAiAction,
  saveAiGeneratedFormAction,
  type AiFormDraft,
} from "@/app/actions/ai"
import { QUESTION_TYPES } from "@/lib/types/form"

const INSPIRATION_PILLS = [
  { label: "🎯 Qualificação de Leads B2B", prompt: "Qualificação de leads B2B para consultoria de alto valor com orçamento, faturamento atual e contato por WhatsApp." },
  { label: "⭐ Pesquisa de Satisfação & NPS", prompt: "Pesquisa de satisfação pós-compra para e-commerce com NPS de 0 a 10 e campo de melhorias sugeridas." },
  { label: "🚀 Briefing de Novo Projeto", prompt: "Briefing para agência de design e desenvolvimento com prazos, objetivos de negócio, links de referência e investimento previsto." },
  { label: "💼 Triagem de Candidatos (RH)", prompt: "Formulário de candidatura para vaga de suporte ao cliente com pretensão salarial, experiência e disponibilidade de horário." },
]

interface AiFormCreatorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AiFormCreatorModal({ open, onOpenChange }: AiFormCreatorModalProps) {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [tone, setTone] = useState<"casual" | "neutral" | "formal">("neutral")
  const [depth, setDepth] = useState<"short" | "balanced" | "detailed">("balanced")
  const [showOptions, setShowOptions] = useState(false)
  const [refineText, setRefineText] = useState("")

  const [draft, setDraft] = useState<AiFormDraft | null>(null)
  const [isGenerating, startGenerating] = useTransition()
  const [isRefining, startRefining] = useTransition()
  const [isSaving, startSaving] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function handleGenerate() {
    if (!prompt.trim() || prompt.length < 5) {
      setErrorMsg("Descreva sua ideia com pelo menos 5 caracteres.")
      return
    }
    setErrorMsg(null)

    startGenerating(async () => {
      const res = await generateFormDraftWithAiAction({ prompt, tone, depth })
      if (res.success && res.data) {
        setDraft(res.data)
      } else {
        setErrorMsg(res.error?.message || "Erro ao gerar rascunho com IA.")
      }
    })
  }

  function handleRefine(customInstruction?: string) {
    const instruction = customInstruction || refineText
    if (!draft || !instruction.trim()) return
    setErrorMsg(null)

    startRefining(async () => {
      const res = await refineFormDraftWithAiAction({
        currentDraft: draft,
        instruction,
      })
      if (res.success && res.data) {
        setDraft(res.data)
        if (!customInstruction) setRefineText("")
      } else {
        setErrorMsg(res.error?.message || "Não foi possível refinar o rascunho.")
      }
    })
  }

  function handleSave() {
    if (!draft) return
    setErrorMsg(null)

    startSaving(async () => {
      const res = await saveAiGeneratedFormAction(draft)
      if (res.success && res.data) {
        onOpenChange(false)
        router.push(`/builder/${res.data.formId}`)
      } else {
        setErrorMsg(res.error?.message || "Erro ao salvar o formulário gerado.")
      }
    })
  }

  function handleReset() {
    setDraft(null)
    setRefineText("")
    setErrorMsg(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-border/80 shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-b from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-bold flex items-center gap-2 font-heading">
                    Criar com IA
                  </DialogTitle>
                  <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                    Studio
                  </Badge>
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/30 gap-1 bg-primary/5 font-medium">
                    <Sparkles className="h-2.5 w-2.5" /> 5 créditos
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {draft 
                    ? "Revise o fluxo estruturado pela IA, ajuste conforme desejar e abra no editor."
                    : "Descreva o que você precisa ou selecione um caso de uso para gerar o formulário perfeito."}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <HelpCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!draft ? (
            /* STEP 1: PROMPT INPUT */
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Textarea
                    placeholder="Ex: Crie um formulário para qualificar clientes de consultoria empresarial. Preciso saber o faturamento mensal, principal desafio de gestão e telefone/WhatsApp para contato..."
                    className="min-h-[130px] resize-none rounded-2xl border-primary/20 focus-visible:ring-primary/20 p-4 text-sm leading-relaxed"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isGenerating}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault()
                        handleGenerate()
                      }
                    }}
                  />
                  <div className="absolute bottom-3 right-3 text-[11px] text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full border">
                    Cmd + Enter para gerar
                  </div>
                </div>
              </div>

              {/* Advanced Config Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowOptions(!showOptions)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {showOptions ? "Ocultar ajustes de tom e extensão" : "Personalizar tom de voz e profundidade"}
                  <ChevronDown className={`h-3 w-3 transition-transform ${showOptions ? "rotate-180" : ""}`} />
                </button>

                {showOptions && (
                  <div className="mt-3 p-3.5 rounded-xl border bg-muted/30 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold block mb-1.5 text-foreground/80">Tom de Comunicação:</label>
                      <div className="flex gap-1.5">
                        {(["casual", "neutral", "formal"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTone(t)}
                            className={`flex-1 py-1 px-2 rounded-lg border text-center font-medium transition-all ${
                              tone === t 
                                ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                                : "bg-background text-muted-foreground border-border hover:border-foreground/20"
                            }`}
                          >
                            {t === "casual" ? "Descontraído" : t === "neutral" ? "Amigável" : "Corporativo"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold block mb-1.5 text-foreground/80">Profundidade:</label>
                      <div className="flex gap-1.5">
                        {(["short", "balanced", "detailed"] as const).map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDepth(d)}
                            className={`flex-1 py-1 px-2 rounded-lg border text-center font-medium transition-all ${
                              depth === d 
                                ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                                : "bg-background text-muted-foreground border-border hover:border-foreground/20"
                            }`}
                          >
                            {d === "short" ? "Rápido" : d === "balanced" ? "Equilibrado" : "Detalhado"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Inspiration Pills */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-semibold text-muted-foreground block">
                  Ou comece com um caso de uso validado:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {INSPIRATION_PILLS.map((pill) => (
                    <button
                      key={pill.label}
                      type="button"
                      onClick={() => setPrompt(pill.prompt)}
                      className="text-left text-xs p-2.5 rounded-xl border border-border/80 bg-background hover:bg-muted/50 hover:border-primary/30 transition-all group"
                    >
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors block">
                        {pill.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: DRAFT PREVIEW & REFINEMENT */
            <div className="space-y-5">
              {/* Form Title & Meta */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold text-base text-foreground font-heading">
                    {draft.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-background text-xs font-normal gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      ~{draft.estimatedTimeMinutes} min de resposta
                    </Badge>
                    <Badge variant="outline" className="bg-background text-xs font-normal">
                      {draft.questions.length} perguntas
                    </Badge>
                  </div>
                </div>
                {draft.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {draft.description}
                  </p>
                )}

                {/* Conversion Tips */}
                {draft.conversionTips && draft.conversionTips.length > 0 && (
                  <div className="pt-2 border-t border-border/50 mt-2 space-y-1">
                    <span className="text-[11px] font-semibold text-foreground/80 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Estratégia de Conversão:
                    </span>
                    <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc list-inside">
                      {draft.conversionTips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Questions Preview List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
                  <span>Estrutura de Perguntas & Fluxo:</span>
                  <span>{draft.questions.length} blocos gerados</span>
                </div>

                <div className="space-y-2">
                  {draft.questions.map((q, index) => {
                    const typeInfo = QUESTION_TYPES[q.type]
                    return (
                      <div
                        key={q.tempId || index}
                        className="p-3 rounded-xl border bg-card text-card-foreground shadow-xs space-y-2 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground mt-0.5">
                              {index + 1}
                            </span>
                            <div>
                              <p className="text-sm font-medium leading-snug">
                                {q.title}
                                {q.required && <span className="text-destructive ml-1">*</span>}
                              </p>
                              {q.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {q.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <Badge variant="secondary" className="shrink-0 text-[10px] font-medium gap-1">
                            <span>{typeInfo?.icon || "Aa"}</span>
                            <span>{typeInfo?.label || q.type}</span>
                          </Badge>
                        </div>

                        {/* Options if available */}
                        {q.options && q.options.length > 0 && (
                          <div className="pl-7 flex flex-wrap gap-1.5 pt-1">
                            {q.options.map((opt, i) => (
                              <span
                                key={i}
                                className="text-[11px] px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/50"
                              >
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Logic jump indicator */}
                        {q.logicJumpToTempId && (
                          <div className="pl-7 pt-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                              <GitFork className="h-3 w-3" />
                              Se for &quot;{q.logicConditionValue}&quot; ➔ Pula para pergunta vinculada
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Refinement Section */}
              <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2.5">
                <span className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                  <Wand2 className="h-3.5 w-3.5 text-primary" />
                  Refinar com 1 clique:
                </span>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    "✨ Tornar mais curto e conciso",
                    "📱 Adicionar WhatsApp para contato",
                    "💬 Deixar as perguntas mais amigáveis",
                    "📊 Incluir pergunta de NPS (0 a 10)",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={isRefining}
                      onClick={() => handleRefine(preset)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-background hover:bg-primary/10 hover:text-primary border text-muted-foreground transition-all disabled:opacity-50"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Input
                    placeholder="Ou digite o que mudar: ex. troque a pergunta 2 por opções..."
                    className="h-8 text-xs bg-background"
                    value={refineText}
                    onChange={(e) => setRefineText(e.target.value)}
                    disabled={isRefining}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleRefine()
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs shrink-0 gap-1"
                    disabled={isRefining || !refineText.trim()}
                    onClick={() => handleRefine()}
                  >
                    {isRefining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Ajustar (2 créditos)
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
          {!draft ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => onOpenChange(false)}
                disabled={isGenerating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || prompt.length < 5}
                className="gap-2 rounded-full px-5 text-xs font-semibold shadow-md shadow-primary/20"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Criando estrutura...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Gerar Rascunho (5 créditos)
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={handleReset}
                disabled={isSaving || isRefining}
              >
                <Undo2 className="h-3.5 w-3.5" />
                Recomeçar
              </Button>

              <Button
                onClick={handleSave}
                disabled={isSaving || isRefining}
                className="gap-2 rounded-full px-6 text-xs font-semibold shadow-md shadow-primary/25"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Salvando formulário...
                  </>
                ) : (
                  <>
                    Abrir no Editor
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
