"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, Check, ArrowRight, Sparkles, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

function maskWhatsApp(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 11)
  if (!digits) return ""
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`
}

export function HeroInteractiveDemo() {
  const [phone, setPhone] = useState("(11) 9 8765-4321")
  const [isSuccess, setIsSuccess] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(maskWhatsApp(e.target.value))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (phone.replace(/\D/g, "").length >= 10) {
      setIsSuccess(true)
    }
  }

  function handleReset() {
    setPhone("")
    setIsSuccess(false)
  }

  return (
    <div className="relative w-full max-w-4xl mt-10">
      <div className="rounded-3xl border bg-card shadow-2xl overflow-hidden border-border/80">
        {/* Browser Top Bar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/40 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
          </div>
          <div className="mx-auto text-xs text-muted-foreground font-mono flex items-center gap-1.5 bg-background/60 px-3 py-1 rounded-full border border-border/50">
            <span className="text-emerald-500 font-bold">🔒</span>
            formularios.ia/f/pesquisa-de-clientes
          </div>
          <span className="text-[10px] font-semibold text-primary uppercase tracking-wider hidden sm:inline-block bg-primary/10 px-2 py-0.5 rounded-full">
            Demonstração Interativa
          </span>
        </div>

        {/* Browser Content */}
        <div className="flex items-center justify-center p-8 sm:p-12 md:p-16 bg-background min-h-[360px]">
          <div className="w-full max-w-md space-y-7 text-left">
            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.form
                  key="step-phone"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                      Pergunta 3 de 5
                    </span>
                    <div className="w-28 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="w-[60%] h-full bg-violet-600 rounded-full" />
                    </div>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold font-headline leading-tight">
                    Qual o seu WhatsApp pra gente te enviar a proposta?
                  </h3>

                  <div className="space-y-2">
                    <div className="relative flex items-center rounded-2xl border-2 border-violet-600/30 bg-violet-50/50 dark:bg-violet-950/20 focus-within:border-violet-600 px-5 py-3.5 transition-all shadow-xs">
                      <MessageCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mr-3" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={handleChange}
                        placeholder="(11) 9 0000-0000"
                        className="w-full bg-transparent text-lg font-medium text-foreground tracking-wide placeholder:text-muted-foreground/40 focus:outline-none"
                      />
                      <span className="ml-auto text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider shrink-0 bg-violet-100 dark:bg-violet-900/50 px-2 py-0.5 rounded-md hidden sm:inline">
                        máscara automática
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground pl-1">
                      💡 Experimente alterar os números acima para testar a formatação nativa.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      type="submit"
                      className="bg-violet-600 hover:bg-violet-700 text-white px-8 rounded-full font-bold h-11 shadow-md gap-2"
                    >
                      OK
                      <Check className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Pressione <strong>Enter ↵</strong>
                    </span>
                  </div>
                </motion.form>
              ) : (
                <motion.div
                  key="step-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 text-center py-4"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shadow-xs">
                    <Check className="h-7 w-7" />
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-2xl font-bold font-headline">Validação perfeita!</h4>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      Seu lead cadastrou o WhatsApp <strong className="text-foreground font-mono">{phone}</strong> já sanitizado e pronto para você enviar mensagem em 1 clique.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <Link href="/signup">
                      <Button className="rounded-full px-6 bg-violet-600 hover:bg-violet-700 text-white font-bold gap-2 text-xs h-10 shadow-md">
                        <Sparkles className="h-3.5 w-3.5" />
                        Criar meu formulário grátis
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Testar de novo
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
