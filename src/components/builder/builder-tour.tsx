"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export const BUILDER_TOUR_KEY = "formularios_builder_tour_v2"

export const TOUR_STEPS = [
  {
    highlight: "left" as const,
    title: "Adicione campos",
    description: "No painel à esquerda, clique em qualquer tipo de campo para adicioná-lo. Arraste os campos no canvas para reordenar.",
  },
  {
    highlight: "center" as const,
    title: "Edite e configure",
    description: "Clique em um campo no canvas para selecioná-lo. As propriedades aparecem à direita — título, opções, obrigatoriedade e mais.",
  },
  {
    highlight: "top" as const,
    title: "Publique e compartilhe",
    description: "Quando o formulário estiver pronto, clique em Publicar na barra superior. Você ganha um link para compartilhar e começa a coletar respostas.",
  },
]

function BuilderDiagram({ highlight }: { highlight: "left" | "center" | "top" }) {
  return (
    <div className="rounded-md border overflow-hidden text-[10px] select-none mb-4">
      <div className={cn(
        "flex items-center justify-between px-2 py-1 border-b",
        highlight === "top" ? "bg-green-500/15 border-green-400/40" : "bg-muted/50"
      )}>
        <span className={highlight === "top" ? "text-green-700 dark:text-green-400 font-semibold" : "text-muted-foreground"}>
          Editor
        </span>
        <span className={cn(
          "font-semibold",
          highlight === "top" ? "text-green-700 dark:text-green-400" : "text-muted-foreground"
        )}>
          Publicar
        </span>
      </div>
      <div className="flex h-14">
        <div className={cn(
          "w-[38%] border-r flex items-center justify-center",
          highlight === "left" ? "bg-blue-500/15 border-blue-400/40" : "bg-muted/30"
        )}>
          <span className={highlight === "left" ? "text-blue-700 dark:text-blue-400 font-semibold" : "text-muted-foreground"}>
            Campos
          </span>
        </div>
        <div className={cn(
          "flex-1 flex items-center justify-center",
          highlight === "center" ? "bg-violet-500/15" : "bg-muted/10"
        )}>
          <span className={highlight === "center" ? "text-violet-700 dark:text-violet-400 font-semibold" : "text-muted-foreground"}>
            Canvas
          </span>
        </div>
        <div className="w-[28%] border-l flex items-center justify-center bg-muted/20">
          <span className="text-muted-foreground">Props</span>
        </div>
      </div>
    </div>
  )
}

export function BuilderTour() {
  const [open, setOpen] = useState(
    () => typeof window !== "undefined" && !localStorage.getItem(BUILDER_TOUR_KEY)
  )
  const [step, setStep] = useState(0)

  function dismiss() {
    localStorage.setItem(BUILDER_TOUR_KEY, "done")
    setOpen(false)
  }

  const current = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss() }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden gap-0">
        {/* Progress bar */}
        <div className="flex h-1">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 transition-colors duration-300 ${i <= step ? "bg-primary" : "bg-muted"} ${i > 0 ? "ml-0.5" : ""}`}
            />
          ))}
        </div>

        <div className="p-6">
          <div key={step} className="animate-in fade-in-0 slide-in-from-right-2 duration-200">
            <BuilderDiagram highlight={current.highlight} />

            <DialogHeader className="mb-4 space-y-1.5">
              <DialogTitle className="text-base leading-snug">{current.title}</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                {current.description}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-1.5 mb-5">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`rounded-full transition-all ${i === step ? "w-4 h-2 bg-primary" : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"}`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => setStep(step - 1)}>
                Anterior
              </Button>
            )}
            {step === 0 && (
              <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground" onClick={dismiss}>
                Pular tour
              </Button>
            )}
            <Button size="sm" className="flex-1" onClick={isLast ? dismiss : () => setStep(step + 1)}>
              {isLast ? "Começar" : "Próximo →"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
