"use client"

import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Sparkles, Gift, Check } from "lucide-react"

interface GamificationRewardsProps {
  step: number
  goal?: string
}

export function calculateExtraCredits(step: number, goal?: string): {
  current: number
  addedInStep: number
  label: string
} {
  const safeStep = Math.max(0, Math.min(step, 3))
  if (goal === "blank" && safeStep === 3) {
    return {
      current: 15,
      addedInStep: 15,
      label: "Configuração rápida concluída: +15 créditos. Falta só criar sua conta.",
    }
  }

  const labels = [
    "Escolha um objetivo para ganhar seus primeiros 5 créditos.",
    "Objetivo concluído: +5 créditos!",
    "Contexto concluído: +5 créditos!",
    "Estilo concluído: +5 créditos. Falta só criar sua conta para chegar a 20!",
  ]
  return {
    current: safeStep * 5,
    addedInStep: safeStep > 0 ? 5 : 0,
    label: labels[safeStep],
  }
}

export function GamificationRewardsBadge({ step, goal }: GamificationRewardsProps) {
  const { current, addedInStep } = calculateExtraCredits(step, goal)
  const reduceMotion = useReducedMotion()
  const completedRewards = current / 5

  return (
    <motion.div
      layout
      role="status"
      aria-live="polite"
      className="relative flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-primary/10 px-4 py-3 shadow-sm"
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-amber-400/10"
        initial={false}
        animate={{ width: `${(current / 20) * 100}%` }}
        transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 }}
      />
      <div className="flex items-center gap-2.5">
        <motion.div
          key={`gift-${current}`}
          animate={reduceMotion ? undefined : { rotate: [0, -8, 8, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 0.45 }}
          className="relative z-10 grid h-9 w-9 place-items-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400"
        >
          <Gift className="h-4 w-4" />
        </motion.div>
        <div className="relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Oferta para os 50 primeiros
            </span>
            <span className="inline-flex items-center rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-900 dark:text-amber-200">
              GRÁTIS
            </span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300">
            50 créditos garantidos + até 20 extras
          </p>
        </div>
      </div>

      <div className="relative z-10 ml-auto flex items-center gap-2 sm:ml-0">
        <AnimatePresence>
          {addedInStep > 0 && (
            <motion.span
              key={`added-${step}-${goal}`}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.6 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 360, damping: 18 }}
              className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-extrabold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
            >
              +{addedInStep}
            </motion.span>
          )}
        </AnimatePresence>

        <motion.div
          key={`badge-${current}`}
          initial={{ scale: 0.92 }}
          animate={reduceMotion ? { scale: 1 } : { scale: [1, 1.08, 1] }}
          transition={{ duration: 0.45 }}
          className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-white px-3 py-1.5 shadow-sm dark:bg-stone-900"
        >
          <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-bold text-amber-950 dark:text-amber-100">
            +{current} / 20 extras
          </span>
        </motion.div>
      </div>

      <div className="relative z-10 flex w-full gap-1.5" aria-label={`${completedRewards} de 4 recompensas desbloqueadas`}>
        {[1, 2, 3, 4].map(reward => (
          <motion.span
            key={reward}
            className={`h-1.5 flex-1 rounded-full ${reward <= completedRewards ? "bg-amber-600" : "bg-stone-200"}`}
            initial={false}
            animate={reward <= completedRewards && !reduceMotion ? { scaleY: [1, 1.8, 1] } : undefined}
            transition={{ duration: 0.35 }}
          />
        ))}
      </div>
    </motion.div>
  )
}

export function GamificationStepMilestone({ step, goal }: GamificationRewardsProps) {
  const { label } = calculateExtraCredits(step, goal)

  if (step === 0) return null

  return (
    <motion.div
      key={`milestone-${step}`}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/20 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
    >
      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      <span>{label}</span>
    </motion.div>
  )
}
