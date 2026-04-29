import type { QuestionAnalytics } from "@/lib/types/form"
import { pct } from "../utils"
import { NpsViz } from "./nps-viz"
import { RatingViz } from "./rating-viz"
import { ScaleViz } from "./scale-viz"
import { NumericViz } from "./numeric-viz"
import { ChoiceViz } from "./choice-viz"
import { TextViz } from "./text-viz"
import { MatrixViz } from "./matrix-viz"
import { RankingViz } from "./ranking-viz"
import { SignatureViz } from "./signature-viz"

import { AiInsightsSection } from "./ai-insights-section"
import { AnalyticsPeriod } from "@/lib/types/form"

const CRITICALITY_BADGE = {
  high: { label: "Alta atenção", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  medium: { label: "Observar", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  ok: { label: "OK", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
}

function VizSwitch({ stat }: { stat: QuestionAnalytics }) {
  if (stat.questionType === "signature") return <SignatureViz stat={stat} />
  if (stat.questionType === "matrix") return <MatrixViz stat={stat} />
  if (stat.questionType === "ranking") return <RankingViz stat={stat} />
  if (stat.npsScore !== undefined) return <NpsViz stat={stat} />
  if (stat.questionType === "rating" && stat.distribution && stat.average !== undefined) return <RatingViz stat={stat} />
  if ((stat.questionType === "scale" || stat.questionType === "opinion_scale") && stat.distribution && stat.average !== undefined) return <ScaleViz stat={stat} />
  if (stat.distribution && stat.average !== undefined) return <NumericViz stat={stat} />
  if (stat.optionCounts && stat.optionCounts.length > 0) return <ChoiceViz stat={stat} />
  return <TextViz stat={stat} />
}

export function QuestionCard({ formId, period, stat, order, criticality, dropoffRate }: {
  formId: string
  period: AnalyticsPeriod
  stat: QuestionAnalytics
  order: number | string
  criticality?: "high" | "medium" | "ok"
  dropoffRate?: number
}) {
  const isTextType = ["short_text", "long_text", "email", "url", "number", "phone", "whatsapp"].includes(stat.questionType)
  const badge = criticality ? CRITICALITY_BADGE[criticality] : null

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-xs font-semibold text-muted-foreground bg-muted rounded-md px-2 py-1 shrink-0 tabular-nums">
            {order}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight line-clamp-2">{stat.questionTitle || "Sem título"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stat.totalAnswers} resposta{stat.totalAnswers !== 1 ? "s" : ""}
              {dropoffRate && dropoffRate > 0.1
                ? <span className="text-red-500"> · {pct(dropoffRate)} abandonaram aqui</span>
                : null}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
              {badge.label}
            </span>
          )}
          {stat.skipRate > 0.1 && (
            <span className="text-xs text-muted-foreground">{pct(stat.skipRate)} pularam</span>
          )}
        </div>
      </div>

      <VizSwitch stat={stat} />

      {isTextType && (
        <AiInsightsSection 
          formId={formId} 
          questionId={stat.questionId} 
          period={period}
          totalAnswers={stat.totalAnswers}
        />
      )}
    </div>
  )
}
