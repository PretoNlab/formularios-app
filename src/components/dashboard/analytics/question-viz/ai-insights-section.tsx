"use client"

import { useState } from "react"
import { Sparkles, Loader2, Quote, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getSemanticInsightsAction } from "@/app/actions/ai"
import { AnalyticsPeriod } from "@/lib/types/form"
import { Progress } from "@/components/ui/progress"

interface InsightTheme {
  theme: string
  count: number
  sentiment: 'positive' | 'neutral' | 'negative'
}

interface AiInsights {
  summary: string
  sentiment: 'positive' | 'neutral' | 'negative'
  themes: InsightTheme[]
  topQuotes: string[]
}

export function AiInsightsSection({ 
  formId, 
  questionId, 
  period,
  totalAnswers 
}: { 
  formId: string
  questionId: string
  period: AnalyticsPeriod
  totalAnswers: number
}) {
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<AiInsights | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await getSemanticInsightsAction(formId, questionId, period)
      if (res.success && res.data) {
        setInsights(res.data as AiInsights)
      } else {
        setError(res.error?.message || "Erro ao gerar insights.")
      }
    } catch (err) {
      setError("Erro inesperado ao processar dados.")
    } finally {
      setLoading(false)
    }
  }

  if (totalAnswers < 3) return null

  if (!insights) {
    return (
      <div className="mt-4 pt-4 border-t border-dashed">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-2 text-xs bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {loading ? "Processando respostas..." : "Gerar Insights com IA"}
        </Button>
        {error && <p className="text-[10px] text-red-500 mt-2">{error}</p>}
      </div>
    )
  }

  return (
    <div className="mt-4 pt-4 border-t border-dashed space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <h4 className="text-xs font-bold uppercase tracking-wider">Insights da IA</h4>
        </div>
        <SentimentBadge sentiment={insights.sentiment} />
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed italic">
        "{insights.summary}"
      </p>

      <div className="space-y-3">
        <h5 className="text-[10px] font-bold text-muted-foreground uppercase">Principais Temas Identificados</h5>
        {insights.themes.map((t, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{t.theme}</span>
              <span className="text-muted-foreground">{t.count} respostas</span>
            </div>
            <Progress value={(t.count / totalAnswers) * 100} className="h-1" />
          </div>
        ))}
      </div>

      {insights.topQuotes.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Quote className="h-3 w-3" />
            <span className="text-[10px] font-bold uppercase">Voz do Respondente</span>
          </div>
          {insights.topQuotes.map((q, i) => (
            <p key={i} className="text-xs text-muted-foreground border-l-2 border-primary/20 pl-3 py-1">
              {q}
            </p>
          ))}
        </div>
      )}

      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 px-0 text-[10px] text-muted-foreground hover:text-primary"
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-2 w-2 animate-spin mr-1" /> : <Sparkles className="h-2 w-2 mr-1" />}
        Atualizar Insights
      </Button>
    </div>
  )
}

function SentimentBadge({ sentiment }: { sentiment: 'positive' | 'neutral' | 'negative' }) {
  const configs = {
    positive: { icon: TrendingUp, label: "Positivo", class: "text-green-600 bg-green-50 dark:bg-green-950/20" },
    neutral: { icon: Minus, label: "Neutro", class: "text-amber-600 bg-amber-50 dark:bg-amber-950/20" },
    negative: { icon: TrendingDown, label: "Negativo", class: "text-red-600 bg-red-50 dark:bg-red-950/20" }
  }

  const { icon: Icon, label, class: cls } = configs[sentiment]

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>
      <Icon className="h-3 w-3" />
      {label}
    </div>
  )
}
