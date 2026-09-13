"use client"

import { useState, useTransition } from "react"
import { Sparkles, Plus, ChevronDown, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createFormAction } from "@/app/actions/forms"
import { AiFormCreatorModal } from "./ai-form-creator-modal"

interface CreateFormButtonProps {
  variant?: "hero" | "header"
}

export function CreateFormButton({ variant = "hero" }: CreateFormButtonProps) {
  const [isPendingBlank, startTransitionBlank] = useTransition()
  const [aiModalOpen, setAiModalOpen] = useState(false)

  function handleCreateBlank() {
    startTransitionBlank(() => createFormAction())
  }

  if (variant === "header") {
    return (
      <>
        <AiFormCreatorModal open={aiModalOpen} onOpenChange={setAiModalOpen} />
        <div className="flex items-center gap-1.5">
          <Button 
            size="sm"
            className="rounded-full px-4 gap-1.5 bg-gradient-to-r from-primary to-primary/80 hover:opacity-95 shadow-sm text-xs font-semibold" 
            onClick={() => setAiModalOpen(true)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Criar com IA
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="rounded-full h-8 w-8 p-0">
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="sr-only">Opções de criação</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setAiModalOpen(true)} className="gap-2 cursor-pointer">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Criar com IA</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCreateBlank} disabled={isPendingBlank} className="gap-2 cursor-pointer">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{isPendingBlank ? "Criando..." : "Começar em branco"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </>
    )
  }

  return (
    <>
      <AiFormCreatorModal open={aiModalOpen} onOpenChange={setAiModalOpen} />
      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="lg"
          className="rounded-full pl-6 pr-5 h-12 text-sm font-semibold gap-2 shadow-lg shadow-primary/20 bg-gradient-to-r from-primary via-primary/95 to-primary/85 hover:opacity-95 transition-all"
          onClick={() => setAiModalOpen(true)}
        >
          <Sparkles className="h-4 w-4" />
          <span>Criar com IA</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full h-12 w-10 p-0 border-border/80 hover:bg-muted"
              title="Mais opções"
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Mais opções de criação</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => setAiModalOpen(true)} className="gap-2.5 py-2 cursor-pointer">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold">Criar com IA</span>
                <span className="text-[10px] text-muted-foreground">Assistente inteligente de fluxo</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCreateBlank} disabled={isPendingBlank} className="gap-2.5 py-2 cursor-pointer">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold">{isPendingBlank ? "Criando..." : "Começar em branco"}</span>
                <span className="text-[10px] text-muted-foreground">Editor limpo tradicional</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}

