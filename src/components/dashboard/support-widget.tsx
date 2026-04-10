"use client"

import { HelpCircle, MessageSquare, Bug, Lightbulb, LifeBuoy } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function SupportWidget() {
  const supportEmail = "contato@formularios.ia.br"
  
  const handleEmail = (subject: string) => {
    window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}`
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            size="icon" 
            className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-foreground text-background"
          >
            <HelpCircle className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 mb-2">
          <DropdownMenuLabel>Suporte e Feedback</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild>
            <Link href="/help" className="flex items-center gap-2 cursor-pointer">
              <LifeBuoy className="h-4 w-4" />
              <span>Central de Ajuda</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleEmail("Reportar Bug (Dash)")} className="flex items-center gap-2 cursor-pointer">
            <Bug className="h-4 w-4 text-red-500" />
            <span>Reportar Bug</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleEmail("Sugestão de Melhoria")} className="flex items-center gap-2 cursor-pointer">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <span>Sugerir Melhoria</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => handleEmail("Dúvida / Suporte")} className="flex items-center gap-2 cursor-pointer font-medium">
            <MessageSquare className="h-4 w-4" />
            <span>Falar com agente</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
