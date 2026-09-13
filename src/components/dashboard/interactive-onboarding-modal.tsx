"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { 
  Sparkles, 
  ArrowRight, 
  Target, 
  Star, 
  Rocket, 
  Briefcase, 
  Gift, 
  CheckCircle,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { AiFormCreatorModal } from "./ai-form-creator-modal"

const ONBOARDING_GOALS = [
  {
    id: "leads",
    icon: Target,
    title: "Qualificar Clientes & Leads",
    desc: "Capturar dados com perguntas sobre orçamento, faturamento e WhatsApp.",
    prompt: "Qualificação de leads B2B para consultoria de alto valor com orçamento, faturamento atual e contato por WhatsApp.",
    tone: "formal" as const,
  },
  {
    id: "nps",
    icon: Star,
    title: "Pesquisa de Satisfação & NPS",
    desc: "Avaliação da experiência do cliente com NPS de 0 a 10 e feedback aberto.",
    prompt: "Pesquisa de satisfação pós-compra para e-commerce com escala NPS de 0 a 10 e campo para comentários e sugestões de melhoria.",
    tone: "neutral" as const,
  },
  {
    id: "briefing",
    icon: Rocket,
    title: "Briefing de Novo Projeto",
    desc: "Levantamento detalhado de escopo, prazos, referências e expectativas.",
    prompt: "Briefing para agência de design e desenvolvimento com prazos, objetivos de negócio, links de referência e investimento previsto.",
    tone: "neutral" as const,
  },
  {
    id: "rh",
    icon: Briefcase,
    title: "Triagem & Candidaturas (RH)",
    desc: "Processo seletivo para coletar pretensão salarial, experiência e perfil.",
    prompt: "Formulário de candidatura para vaga de trabalho com pretensão salarial, principais experiências anteriores e disponibilidade de horário.",
    tone: "formal" as const,
  },
]

export function InteractiveOnboardingModal() {
  const [open, setOpen] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Show if there is a 'welcome' param OR if it's the very first time on this browser
    if (searchParams.get("welcome") === "true" || !localStorage.getItem("formularios_onboarded_v2")) {
      setOpen(true)
    }
  }, [searchParams])

  function dismiss() {
    localStorage.setItem("formularios_onboarded_v2", "1")
    setOpen(false)

    // Clean up the URL parameter
    if (searchParams.get("welcome") === "true") {
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.delete("welcome")
      const search = newSearchParams.toString()
      const url = search ? `${pathname}?${search}` : pathname
      router.replace(url, { scroll: false })
    }
  }

  function handleSelectGoal(goal: typeof ONBOARDING_GOALS[0]) {
    setSelectedPrompt(goal.prompt)
    dismiss()
    // Open AI Creator modal directly
    setAiModalOpen(true)
  }

  return (
    <>
      <AiFormCreatorModal 
        open={aiModalOpen} 
        onOpenChange={setAiModalOpen} 
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss() }}>
        <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden border-border shadow-2xl">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 sm:p-8 pb-6 border-b text-center relative">
            <button
              onClick={dismiss}
              className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </button>

            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Gift className="h-7 w-7 animate-bounce" />
            </div>

            <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20 text-xs font-semibold px-3 py-0.5 rounded-full">
              ✨ Presente de Boas-Vindas
            </Badge>

            <DialogTitle className="text-2xl sm:text-3xl font-bold font-heading">
              Seus créditos de boas-vindas estão disponíveis!
            </DialogTitle>

            <DialogDescription className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
              Crie seu primeiro formulário inteligente em menos de 30 segundos e acompanhe seu saldo no topo do painel.
            </DialogDescription>
          </div>

          {/* Body: Goal Selection */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Selecione o objetivo do seu formulário:
              </span>
              <span className="text-xs text-primary font-medium flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Geração Instantânea
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ONBOARDING_GOALS.map((goal) => {
                const Icon = goal.icon
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => handleSelectGoal(goal)}
                    className="flex flex-col text-left p-3.5 rounded-2xl border border-border/80 bg-background hover:bg-primary/[0.03] hover:border-primary/40 hover:shadow-md transition-all group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="h-4 w-4" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <span className="font-semibold text-sm text-foreground block group-hover:text-primary transition-colors">
                      {goal.title}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {goal.desc}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 px-6 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              Sem cartão de crédito necessário
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={dismiss}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Explorar o painel primeiro
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
