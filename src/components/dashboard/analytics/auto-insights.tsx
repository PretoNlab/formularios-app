"use client"

import { FormAnalytics } from "@/lib/types/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Lightbulb, AlertTriangle, TrendingUp, Smartphone, Clock } from "lucide-react"

interface AutoInsightsProps {
  analytics: FormAnalytics
}

export function AutoInsights({ analytics }: AutoInsightsProps) {
  const insights = []

  // 1. Completion Rate Heuristic
  if (analytics.completionRate < 40 && analytics.totalViews > 10) {
    insights.push({
      id: "low_conversion",
      icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
      title: "Baixa Conversão",
      description: `A taxa de conclusão está em ${analytics.completionRate.toFixed(1)}%, o que é considerado baixo. Considere reduzir a quantidade de perguntas ou simplificar a linguagem.`,
      variant: "destructive" as const,
    })
  } else if (analytics.completionRate > 80 && analytics.totalViews > 10) {
    insights.push({
      id: "high_conversion",
      icon: <TrendingUp className="h-4 w-4 text-green-500" />,
      title: "Alta Conversão",
      description: `Ótimo trabalho! A taxa de conclusão de ${analytics.completionRate.toFixed(1)}% indica que o formulário está engajador e fácil de preencher.`,
      variant: "default" as const,
    })
  }

  // 2. Critical Dropoff Heuristic
  if (analytics.dropoffByQuestion.length > 0) {
    const worstDropoff = analytics.dropoffByQuestion.reduce((prev, current) => 
      (prev.dropoffRate > current.dropoffRate) ? prev : current
    )
    
    if (worstDropoff.dropoffRate > 30) {
      const qTitle = analytics.questionStats.find(q => q.questionId === worstDropoff.questionId)?.questionTitle || "Desconhecida"
      insights.push({
        id: "high_dropoff",
        icon: <Lightbulb className="h-4 w-4 text-yellow-500" />,
        title: "Ponto de Abandono Crítico",
        description: `A pergunta "${qTitle}" está causando uma taxa de abandono de ${worstDropoff.dropoffRate.toFixed(1)}%. Se não for estritamente necessária, torne-a opcional.`,
        variant: "default" as const,
      })
    }
  }

  // 3. Mobile Dominance
  if (analytics.mobilePercentage > 75 && analytics.totalViews > 10) {
    insights.push({
      id: "mobile_heavy",
      icon: <Smartphone className="h-4 w-4 text-blue-500" />,
      title: "Tráfego Majoritariamente Mobile",
      description: `${analytics.mobilePercentage.toFixed(1)}% dos acessos ocorrem via celular. Certifique-se de testar o formulário em telas pequenas para evitar rolagem horizontal.`,
      variant: "default" as const,
    })
  }

  // 4. Completion Time
  if (analytics.averageCompletionTime > 300) {
    insights.push({
      id: "long_time",
      icon: <Clock className="h-4 w-4 text-purple-500" />,
      title: "Tempo de Preenchimento Alto",
      description: `A média de preenchimento é de ${Math.round(analytics.averageCompletionTime / 60)} minutos. Isso pode desencorajar novos respondentes se não houver um incentivo claro.`,
      variant: "default" as const,
    })
  }

  // Se não houver dados suficientes ou nenhum insight crítico
  if (insights.length === 0 && analytics.totalViews > 0) {
    insights.push({
      id: "normal",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      title: "Tudo nos conformes",
      description: "Os dados do seu formulário parecem saudáveis e não identificamos pontos críticos de alerta no momento.",
      variant: "default" as const,
    })
  }

  if (analytics.totalViews === 0) {
    return null
  }

  return (
    <div className="space-y-4 mb-8 print-hide">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        Insights Automáticos
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight) => (
          <Alert key={insight.id} variant={insight.variant === "destructive" ? "destructive" : "default"} className="bg-card">
            {insight.icon}
            <AlertTitle>{insight.title}</AlertTitle>
            <AlertDescription className="text-muted-foreground mt-1 text-sm leading-relaxed">
              {insight.description}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  )
}

// Para usar caso seja necessário o check circle
import { CheckCircle2 } from "lucide-react"
