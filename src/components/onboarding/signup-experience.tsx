"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Sparkles, Eye, Edit3 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GamificationRewardsBadge, GamificationStepMilestone } from "./gamification-rewards"
import { SignupAccountForm } from "./signup-account-form"
import { buildSignupForm, DRAFT_KEY, GOALS, STYLES, QUESTION_PRESETS, readSavedDraft, type SignupDraft } from "@/lib/onboarding/draft"

const STEPS = [
  { id: 0, shortLabel: "Objetivo", label: "Objetivo · +5" },
  { id: 1, shortLabel: "Contexto", label: "Contexto · +5" },
  { id: 2, shortLabel: "Estilo", label: "Estilo · +5" },
  { id: 3, shortLabel: "Conta", label: "Conta · +5" },
] as const

export function SignupExperience() {
  const [step, setStep] = useState(0)
  const [rewardStep, setRewardStep] = useState(0)
  const [draft, setDraft] = useState<SignupDraft>({
    version: 1, id: "", goal: "leads", context: "", question: "", title: "", style: "cream",
  })
  const [ready, setReady] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form")
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    let saved: SignupDraft | null = null
    try { saved = readSavedDraft(localStorage.getItem(DRAFT_KEY)) } catch { /* Private browsing. */ }
    setDraft(saved ?? { version: 1, id: crypto.randomUUID(), goal: "leads", context: "", question: "", title: "", style: "cream" })
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ draft, savedAt: Date.now() })) } catch { /* Server handoff still works. */ }
  }, [draft, ready])

  useEffect(() => { heading.current?.focus() }, [step])

  const built = buildSignupForm(draft)
  const preview = built.questions[Math.min(previewIndex, Math.max(0, built.questions.length - 1))]
  const presets = QUESTION_PRESETS[draft.goal] ?? []

  function patch(values: Partial<SignupDraft>) { setDraft(d => ({ ...d, ...values })) }
  function chooseGoal(goal: SignupDraft["goal"]) {
    patch({ goal })
    setPreviewIndex(0)
    const nextStep = goal === "blank" ? 3 : 1
    setRewardStep(current => Math.max(current, nextStep))
    setStep(nextStep)
  }

  function handleNextStep(next: number) {
    setRewardStep(current => Math.max(current, next))
    setStep(next)
    // On mobile, keep on form tab so they see next inputs immediately
    setMobileTab("form")
  }

  return (
    <main className="min-h-screen bg-[#faf8f5] text-stone-900">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 sm:py-6 lg:px-12">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-80">
          <Sparkles className="h-5 w-5 text-amber-600" /> formularios.ia
        </Link>
        <Link href="/login" className="text-xs text-stone-600 underline underline-offset-4 hover:text-stone-900 sm:text-sm">
          Já tenho conta
        </Link>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-14 pt-4 sm:gap-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:gap-16 lg:px-12 lg:pt-8">
        {/* Mobile View Toggle */}
        <div className="flex rounded-2xl border border-stone-200/80 bg-stone-100 p-1 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileTab("form")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all ${
              mobileTab === "form"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            Etapa {step + 1} de 4
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all ${
              mobileTab === "preview"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Prévia ({built.questions.length})</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        </div>

        {/* Left Column: Form & Stepper */}
        <section className={`max-w-xl ${mobileTab === "form" ? "block" : "hidden lg:block"}`}>
          <div className="mb-6">
            <GamificationRewardsBadge step={rewardStep} goal={draft.goal} />
          </div>

          <nav aria-label="Etapas do cadastro" className="mb-8">
            <ol className="grid grid-cols-4 gap-2 text-xs sm:gap-4">
              {STEPS.map((s, i) => (
                <li
                  key={s.id}
                  aria-current={i === step ? "step" : undefined}
                  className={`flex flex-col ${i <= step ? "text-stone-900 font-medium" : "text-stone-500"}`}
                >
                  <span
                    className={`mb-2 block h-1.5 w-full rounded-full transition-all duration-300 ${
                      i <= step ? "bg-amber-600" : "bg-stone-200"
                    }`}
                  />
                  <div className="truncate text-[11px] sm:text-xs">
                    <span className="font-semibold">{i < step ? "✓ " : `0${i + 1} `}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{s.shortLabel}</span>
                  </div>
                </li>
              ))}
            </ol>
          </nav>

          {step > 0 && (
            <button
              onClick={() => handleNextStep(step === 3 && draft.goal === "blank" ? 0 : step - 1)}
              className="mb-5 flex items-center gap-2 text-sm text-stone-600 transition-colors hover:text-stone-900"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
          )}

          <GamificationStepMilestone step={step} goal={draft.goal} />

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Uma ideia. Seu primeiro formulário.
          </p>
          <h1 ref={heading} tabIndex={-1} className="text-3xl font-semibold leading-tight tracking-tight outline-none sm:text-4xl">
            {["O que vamos criar hoje?", "Vamos dar a sua cara.", "Já está tomando forma.", "Gostou? Agora é seu."][step]}
          </h1>
          <p className="mb-7 mt-3 leading-relaxed text-stone-600 text-sm sm:text-base">
            {[
              "Você já tem 50 créditos garantidos. Escolha um objetivo e ganhe mais 5.",
              "Conte um pouco sobre sua ideia e avance para 10 créditos extras.",
              "Escolha um estilo para chegar a 15 créditos extras.",
              "Crie sua conta, complete 20 extras e comece com 70 créditos.",
            ][step]}
          </p>

          <AnimatePresence>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <div className="space-y-3">
                  {GOALS.map(g => (
                    <motion.button
                      key={g.id}
                      whileHover={{ scale: 1.012, y: -1 }}
                      whileTap={{ scale: 0.988 }}
                      disabled={!ready}
                      onClick={() => chooseGoal(g.id)}
                      className="group flex w-full items-center gap-3.5 rounded-2xl border border-stone-200 bg-white p-4 text-left transition-all hover:border-amber-600/50 hover:bg-amber-500/[0.03] hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
                    >
                      <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-stone-100 text-2xl transition-transform duration-200 group-hover:scale-110">
                        {g.icon}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium text-stone-900">{g.label}</span>
                        <span className="text-sm text-stone-500 truncate block">{g.detail}</span>
                      </span>
                      <span className="inline-flex shrink-0 items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-500/20 mr-1">
                        Escolher
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-stone-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-stone-900" />
                    </motion.button>
                  ))}
                  <button
                    disabled={!ready}
                    onClick={() => chooseGoal("blank")}
                    className="pt-3 text-sm text-stone-600 underline underline-offset-4 transition-colors hover:text-stone-900 block"
                  >
                    Prefiro começar em branco
                  </button>
                </div>
              )}

              {step === 1 && (
                <form onSubmit={e => { e.preventDefault(); handleNextStep(2) }} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="context">Para qual negócio, evento ou assunto?</Label>
                    <Input
                      id="context"
                      autoFocus
                      maxLength={100}
                      value={draft.context}
                      onChange={e => patch({ context: e.target.value })}
                      placeholder={draft.goal === "registrations" ? "Ex.: Oficina de fotografia" : "Ex.: Studio Aurora"}
                      className="h-12 bg-white"
                    />
                    <p className="text-xs text-stone-500">Opcional. Usaremos esse nome no título.</p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label htmlFor="question">Qual pergunta não pode faltar?</Label>
                      {presets.length > 0 && (
                        <Select onValueChange={val => patch({ question: val })}>
                          <SelectTrigger className="h-7 w-auto max-w-[200px] gap-1.5 border-dashed border-amber-600/40 bg-amber-500/5 px-2.5 text-[11px] font-medium text-amber-900 hover:bg-amber-500/10">
                            <SelectValue placeholder="Escolher sugestão..." />
                          </SelectTrigger>
                          <SelectContent align="end" className="max-w-[340px] bg-white">
                            {presets.map(p => (
                              <SelectItem key={p} value={p} className="text-xs py-2">
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <Input
                      id="question"
                      maxLength={160}
                      value={draft.question}
                      onChange={e => patch({ question: e.target.value })}
                      placeholder="Ex.: O que você espera dessa experiência?"
                      className="h-12 bg-white"
                    />

                    {presets.length > 0 && (
                      <div className="space-y-1.5 pt-0.5">
                        <span className="text-[11px] font-medium text-stone-500">
                          Ou clique em uma sugestão rápida:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {presets.slice(0, 3).map(p => (
                            <motion.button
                              key={p}
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => patch({ question: p })}
                              className={`rounded-lg border px-2.5 py-1 text-left text-xs transition-colors ${
                                draft.question === p
                                  ? "border-amber-600 bg-amber-50 font-medium text-amber-950 ring-1 ring-amber-600"
                                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:bg-stone-50"
                              }`}
                            >
                              {p}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-stone-500">Opcional. Ela entra no seu formulário.</p>
                  </div>

                  <motion.div whileHover={{ scale: 1.008 }} whileTap={{ scale: 0.992 }}>
                    <Button className="h-12 w-full rounded-xl bg-stone-900 text-white hover:bg-stone-800 shadow-sm">
                      Ver meu formulário <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>

                  <div className="flex items-center justify-center lg:hidden">
                    <button
                      type="button"
                      onClick={() => setMobileTab("preview")}
                      className="text-xs font-medium text-amber-800 underline underline-offset-4"
                    >
                      Ver como está ficando na prévia ({built.questions.length} telas)
                    </button>
                  </div>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={e => { e.preventDefault(); handleNextStep(3) }} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título do formulário</Label>
                    <Input
                      id="title"
                      maxLength={120}
                      value={draft.title}
                      onChange={e => patch({ title: e.target.value })}
                      placeholder={built.title}
                      className="h-12 bg-white"
                    />
                  </div>

                  <fieldset>
                    <legend className="mb-3 text-sm font-medium">Que estilo combina com você?</legend>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {STYLES.map(s => (
                        <motion.label
                          key={s.id}
                          whileHover={{ scale: 1.025 }}
                          whileTap={{ scale: 0.975 }}
                          className={`cursor-pointer rounded-xl border p-2.5 sm:p-3 text-center text-xs sm:text-sm transition-all ${
                            s.id === draft.style
                              ? "border-stone-900 bg-white shadow-sm ring-1 ring-stone-900"
                              : "border-stone-200 bg-white/70 hover:border-stone-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="style"
                            value={s.id}
                            checked={draft.style === s.id}
                            onChange={() => patch({ style: s.id })}
                            className="sr-only peer"
                          />
                          <span
                            className="mx-auto mb-2 block h-7 w-7 sm:h-8 sm:w-8 rounded-full shadow-inner ring-1 ring-black/10 peer-focus-visible:outline peer-focus-visible:outline-offset-4"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="font-medium">{s.label}</span>
                        </motion.label>
                      ))}
                    </div>
                  </fieldset>

                  <motion.div whileHover={{ scale: 1.008 }} whileTap={{ scale: 0.992 }}>
                    <Button className="h-12 w-full rounded-xl bg-stone-900 text-white hover:bg-stone-800 shadow-sm">
                      Salvar e criar conta <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                  <p className="text-center text-xs text-stone-500">
                    Na próxima etapa, você cria sua conta e salva o formulário. Sem cartão de crédito.
                  </p>
                </form>
              )}

              {step === 3 && <SignupAccountForm draft={draft} />}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Right Column: Live Interactive Preview */}
        <aside
          className={`lg:sticky lg:top-10 lg:self-start ${mobileTab === "preview" ? "block" : "hidden lg:block"}`}
          aria-label="Prévia do seu formulário"
        >
          {/* Mobile Back to Form bar */}
          <div className="mb-3 flex items-center justify-between lg:hidden">
            <button
              type="button"
              onClick={() => setMobileTab("form")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-sm transition-colors hover:bg-stone-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o editor
            </button>
            <span className="text-xs text-stone-500">Passo {step + 1} de 4</span>
          </div>

          <div className="mb-4 flex items-center justify-between text-xs text-stone-500">
            <span className="flex items-center gap-2 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              PRÉVIA DO SEU FORMULÁRIO
            </span>
            <span>Rascunho · não publicado</span>
          </div>

          <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl shadow-stone-200/40">
            <div className="flex gap-1.5 border-b border-stone-100 px-5 py-4" aria-hidden="true">
              {[1, 2, 3].map(n => (
                <span key={n} className="h-2 w-2 rounded-full bg-stone-200" />
              ))}
            </div>

            <div
              className="flex min-h-[340px] sm:min-h-[380px] flex-col justify-center p-6 sm:p-10 transition-colors duration-300"
              style={{ backgroundColor: built.theme.colors.bg, color: built.theme.colors.text }}
            >
              <AnimatePresence>
                <motion.div
                  key={`${previewIndex}-${draft.style}`}
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col"
                >
                  <p className="mb-4 sm:mb-5 text-xs uppercase tracking-widest opacity-70">
                    {draft.context || "Sua próxima boa conversa"}
                  </p>
                  <h2 className="break-words text-2xl font-semibold leading-snug sm:text-3xl">
                    {preview?.title ?? built.title}
                  </h2>

                  {preview && (
                    <div className="mt-6">
                      {preview.type === "welcome" ? (
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setPreviewIndex(1)}
                          className="rounded-lg px-5 py-3 text-sm font-medium transition-transform"
                          style={{ backgroundColor: built.theme.colors.text, color: built.theme.colors.bg }}
                        >
                          Começar →
                        </motion.button>
                      ) : preview.type === "thank_you" ? (
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                          <Check className="h-8 w-8" />
                        </motion.div>
                      ) : preview.type === "rating" ? (
                        <div aria-label="Campo de avaliação com cinco estrelas" className="text-3xl tracking-widest">
                          ☆☆☆☆☆
                        </div>
                      ) : (
                        <div className="border-b pb-3 text-sm opacity-60" style={{ borderColor: built.theme.colors.accent }}>
                          Sua resposta aqui…
                        </div>
                      )}
                    </div>
                  )}

                  {!preview && (
                    <p className="mt-4 text-sm opacity-70">Uma página em branco, pronta para suas ideias.</p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {built.questions.length > 0 && (
              <div className="flex items-center justify-between gap-2 border-t border-stone-100 px-5 py-4">
                <button
                  aria-label="Pergunta anterior na prévia"
                  disabled={previewIndex === 0}
                  onClick={() => setPreviewIndex(i => Math.max(0, i - 1))}
                  className="rounded-lg p-2 transition-colors hover:bg-stone-100 disabled:opacity-25"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-stone-500 font-medium">
                  Tela {Math.min(previewIndex + 1, built.questions.length)} de {built.questions.length}
                </span>
                <button
                  aria-label="Próxima pergunta na prévia"
                  disabled={previewIndex >= built.questions.length - 1}
                  onClick={() => setPreviewIndex(i => Math.min(built.questions.length - 1, i + 1))}
                  className="rounded-lg p-2 transition-colors hover:bg-stone-100 disabled:opacity-25"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <p className="mt-4 text-center text-xs sm:text-sm text-stone-500">
            Seu ponto de partida. Tudo pode ser editado depois no editor.
          </p>
        </aside>
      </div>
    </main>
  )
}
