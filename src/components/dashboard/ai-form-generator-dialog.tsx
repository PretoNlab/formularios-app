"use client"

import { useState, useTransition } from "react"
import { Sparkles, Loader2, ChevronRight, Wand2, MessageSquare, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { generateFormFromTextAction } from "@/app/actions/ai"
import { useRouter } from "next/navigation"

const SUGGESTIONS = [
  "Pesquisa de satisfação para uma hamburgueria",
  "Inscrição para workshop de marketing digital",
  "Feedback pós-evento com NPS",
  "Formulário de contato para consultoria",
]

export function AiFormGeneratorDialog() {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleGenerate() {
    if (!prompt.trim() || prompt.length < 5) return

    startTransition(async () => {
      try {
        const result = await generateFormFromTextAction(prompt)
        if (result.success && result.data) {
          setOpen(false)
          router.push(`/builder/${result.data.formId}`)
        } else {
          alert(result.error?.message || "Erro ao gerar formulário.")
        }
      } catch (error) {
        alert("Erro inesperado ao processar o comando.")
      }
    })
  }

  return (
    <>
      <Button 
        variant="outline" 
        className="rounded-full gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/30"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-4 w-4" />
        Criar com IA
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wand2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-xl font-bold font-heading">Gerador Mágico IA</DialogTitle>
            <DialogDescription className="text-center">
              Descreva o formulário que você precisa e nossa IA criará a estrutura completa com as melhores perguntas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="relative">
                <Textarea
                  placeholder="Ex: Crie uma pesquisa de satisfação para clientes de uma clínica estética, focando no atendimento e ambiente..."
                  className="min-h-[120px] resize-none rounded-2xl border-primary/10 focus-visible:ring-primary/20 p-4 text-sm"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isPending}
                />
                <div className="absolute bottom-3 right-3 text-[10px] text-muted-foreground bg-background/50 backdrop-blur-sm px-2 py-0.5 rounded-full border">
                  Gemini 1.5 Flash
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
                <Lightbulb className="h-3 w-3" />
                Sugestões:
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setPrompt(s)}
                    className="text-[10px] bg-muted hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all px-2.5 py-1 rounded-full text-muted-foreground text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full rounded-full gap-2 h-11 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
              disabled={!prompt.trim() || prompt.length < 5 || isPending}
              onClick={handleGenerate}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Criando seu formulário...
                </>
              ) : (
                <>
                  Gerar com IA
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
