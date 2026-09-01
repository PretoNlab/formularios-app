"use client"

import type React from "react"
import { TrendingUp, AlertTriangle, Smartphone, Clock, Award, Users, Lightbulb, CheckCircle2 } from "lucide-react"
import type { FormAnalytics } from "@/lib/types/form"
import type { QuestionSummary } from "./types"
import { pct, formatDuration } from "./utils"

interface AutoInsightsProps {
  analytics: FormAnalytics
  questions?: QuestionSummary[]
}

interface InsightItem {
  id: string
  icon: React.ElementType
  title: string
  description: string
  badge?: string
  color: string
  bg: string
  borderColor: string
}

export function AutoInsights({ analytics, questions = [] }: AutoInsightsProps) {
  const insights: InsightItem[] = []
  const { totalResponses, totalViews, completionRate, dropoffByQuestion, mobilePercentage, averageCompletionTime, questionStats } = analytics

  // 1. Not enough data state
  if (totalResponses === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-6 text-center">
        <Users className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-foreground/80">Aguardando primeiras respostas</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          Compartilhe o link do formulário para começar a coletar dados e visualizar diagnósticos automáticos.
        </p>
      </div>
    )
  }

  // 2. Early collection state (< 3 responses)
  if (totalResponses < 3) {
    insights.push({
      id: "early_data",
      icon: Users,
      title: "Coleta em Andamento",
      badge: "Início",
      description: `Ainda há poucas respostas (${totalResponses}) para diagnósticos estatísticos aprofundados. Conforme mais dados chegarem, novos insights serão calculados.`,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/5 dark:bg-blue-500/10",
      borderColor: "border-blue-500/20",
    })
  } else {
    // 3. Conversion / Completion Rate
    if (completionRate >= 0.75) {
      insights.push({
        id: "high_conversion",
        icon: TrendingUp,
        title: "Alta Taxa de Conclusão",
        badge: `${pct(completionRate)} conclusão`,
        description: `Excelente desempenho! ${pct(completionRate)} dos que iniciaram completaram o envio, demonstrando que o formulário é direto e tem pouca fricção.`,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/5 dark:bg-emerald-500/10",
        borderColor: "border-emerald-500/20",
      })
    } else if (completionRate < 0.5) {
      insights.push({
        id: "low_conversion",
        icon: AlertTriangle,
        title: "Oportunidade de Otimização",
        badge: `${pct(completionRate)} conclusão`,
        description: `Menos da metade dos respondentes (${pct(completionRate)}) finaliza o envio. Considere reduzir o número de campos obrigatórios ou simplificar enunciados.`,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/5 dark:bg-amber-500/10",
        borderColor: "border-amber-500/20",
      })
    }

    // 4. Critical Dropoff Funnel
    if (dropoffByQuestion.length > 0) {
      const worstDropoff = [...dropoffByQuestion].sort((a, b) => b.dropoffRate - a.dropoffRate)[0]
      if (worstDropoff && worstDropoff.dropoffRate >= 0.25) {
        const qSummary = questions.find((x) => x.id === worstDropoff.questionId)
        const qStat = questionStats.find((x) => x.questionId === worstDropoff.questionId)
        const qTitle = qSummary?.title || qStat?.questionTitle || "uma das perguntas"
        insights.push({
          id: "high_dropoff",
          icon: Lightbulb,
          title: "Ponto de Atenção no Fluxo",
          badge: `${pct(worstDropoff.dropoffRate)} evasão`,
          description: `A pergunta "${qTitle}" concentra a maior taxa de evasão (${pct(worstDropoff.dropoffRate)}). Avalie torná-la opcional ou mais concisa.`,
          color: "text-amber-600 dark:text-amber-400",
          bg: "bg-amber-500/5 dark:bg-amber-500/10",
          borderColor: "border-amber-500/20",
        })
      }
    }

    // 5. NPS Insight
    const npsQuestion = questionStats.find((q) => q.npsScore !== undefined)
    if (npsQuestion && npsQuestion.npsScore !== undefined) {
      const score = npsQuestion.npsScore
      const isPositive = score >= 50
      const isNeutral = score >= 0 && score < 50
      insights.push({
        id: "nps_metric",
        icon: Award,
        title: isPositive ? "NPS em Zona de Excelência" : isNeutral ? "NPS Positivo" : "NPS em Zona Crítica",
        badge: `NPS ${score}`,
        description: `Seu Net Promoter Score é ${score}. Você possui ${npsQuestion.npsPromoters ?? 0}% promotores e ${npsQuestion.npsDetractors ?? 0}% detratores.`,
        color: isPositive ? "text-emerald-600 dark:text-emerald-400" : isNeutral ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400",
        bg: isPositive ? "bg-emerald-500/5 dark:bg-emerald-500/10" : isNeutral ? "bg-blue-500/5 dark:bg-blue-500/10" : "bg-red-500/5 dark:bg-red-500/10",
        borderColor: isPositive ? "border-emerald-500/20" : isNeutral ? "border-blue-500/20" : "border-red-500/20",
      })
    }

    // 6. Mobile Dominance
    if (mobilePercentage >= 0.6) {
      insights.push({
        id: "mobile_heavy",
        icon: Smartphone,
        title: "Público Majoritariamente Mobile",
        badge: `${pct(mobilePercentage)} celular`,
        description: `${pct(mobilePercentage)} dos acessos ocorrem via celular. Dê preferência a campos de múltipla escolha e botões clicáveis para agilizar o preenchimento.`,
        color: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-500/5 dark:bg-indigo-500/10",
        borderColor: "border-indigo-500/20",
      })
    }

    // 7. Long Duration
    if (averageCompletionTime >= 300) {
      insights.push({
        id: "long_completion",
        icon: Clock,
        title: "Tempo Médio Elevado",
        badge: formatDuration(averageCompletionTime),
        description: `O preenchimento está levando em média ${formatDuration(averageCompletionTime)}. Para pesquisas rápidas, tempos menores que 3 minutos costumam elevar a conversão.`,
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-500/5 dark:bg-purple-500/10",
        borderColor: "border-purple-500/20",
      })
    }
  }

  // Fallback if healthy and no specific warnings
  if (insights.length === 0) {
    insights.push({
      id: "all_healthy",
      icon: CheckCircle2,
      title: "Desempenho Saudável",
      badge: "Estável",
      description: "As métricas de conversão e resposta estão estáveis, sem gargalos críticos de abandono identificados.",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/5 dark:bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold tracking-tight text-foreground/90">Diagnósticos & Insights</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((ins) => {
          const Icon = ins.icon
          return (
            <div
              key={ins.id}
              className={`rounded-xl border p-4 shadow-xs transition-all flex items-start gap-3.5 ${ins.bg} ${ins.borderColor}`}
            >
              <div className={`p-2 rounded-lg bg-background/80 shadow-2xs shrink-0 ${ins.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-xs font-semibold text-foreground">{ins.title}</h4>
                  {ins.badge && (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-background/90 border border-border/40 tabular-nums ${ins.color}`}>
                      {ins.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {ins.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
