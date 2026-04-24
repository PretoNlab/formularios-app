import type React from "react"
import { TrendingUp, AlertTriangle, Smartphone, BarChart2, Users } from "lucide-react"
import type { FormAnalytics } from "@/lib/types/form"
import { pct } from "./utils"
import type { QuestionSummary } from "./types"

export function InsightCards({ analytics, questions }: {
  analytics: FormAnalytics
  questions: QuestionSummary[]
}) {
  const insights: { icon: React.ElementType; color: string; bg: string; text: string }[] = []

  if (analytics.completionRate >= 0.75) {
    insights.push({
      icon: TrendingUp, color: "text-green-700", bg: "bg-green-50 border-green-100",
      text: `Taxa de conclusão excelente: ${pct(analytics.completionRate)} dos respondentes completam o formulário.`,
    })
  } else if (analytics.completionRate < 0.5 && analytics.totalResponses > 5) {
    insights.push({
      icon: AlertTriangle, color: "text-amber-700", bg: "bg-amber-50 border-amber-100",
      text: `Menos da metade conclui o formulário (${pct(analytics.completionRate)}). Considere simplificar ou encurtar.`,
    })
  }

  const worstDropoff = analytics.dropoffByQuestion
    .filter((d) => d.dropoffRate > 0.3)
    .sort((a, b) => b.dropoffRate - a.dropoffRate)[0]
  if (worstDropoff) {
    const q = questions.find((x) => x.id === worstDropoff.questionId)
    if (q) {
      insights.push({
        icon: AlertTriangle, color: "text-red-700", bg: "bg-red-50 border-red-100",
        text: `${pct(worstDropoff.dropoffRate)} abandonam na pergunta "${q.title}". Pode estar confusa ou longa.`,
      })
    }
  }

  if (analytics.mobilePercentage > 0.55) {
    insights.push({
      icon: Smartphone, color: "text-blue-700", bg: "bg-blue-50 border-blue-100",
      text: `${pct(analytics.mobilePercentage)} dos respondentes usam celular. Prefira campos de seleção a texto livre.`,
    })
  }

  const npsQuestion = analytics.questionStats.find(
    (q) => q.questionType === "nps" && q.npsScore !== undefined
  )
  if (npsQuestion && npsQuestion.npsScore !== undefined) {
    const score = npsQuestion.npsScore
    const sentiment = score >= 50 ? "excelente" : score >= 0 ? "razoável" : "precisa de atenção"
    const color = score >= 50 ? "text-green-700" : score >= 0 ? "text-amber-700" : "text-red-700"
    const bg = score >= 50 ? "bg-green-50 border-green-100" : score >= 0 ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100"
    insights.push({
      icon: BarChart2, color, bg,
      text: `Seu NPS é ${score} — ${sentiment}. ${npsQuestion.npsPromoters}% promotores, ${npsQuestion.npsDetractors}% detratores.`,
    })
  }

  if (analytics.totalResponses < 3) {
    insights.push({
      icon: Users, color: "text-muted-foreground", bg: "bg-muted/30 border-muted",
      text: "Ainda há poucas respostas para gerar insights. Compartilhe o link do formulário para coletar mais dados.",
    })
  }

  if (insights.length === 0) return null

  return (
    <div className="space-y-2 mb-6">
      {insights.map((ins, i) => (
        <div key={i} className={`flex items-start gap-3 rounded-xl border p-4 ${ins.bg}`}>
          <ins.icon className={`h-4 w-4 mt-0.5 shrink-0 ${ins.color}`} />
          <p className={`text-sm leading-relaxed ${ins.color}`}>{ins.text}</p>
        </div>
      ))}
    </div>
  )
}
