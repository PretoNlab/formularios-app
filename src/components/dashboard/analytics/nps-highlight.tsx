import { BarChart2 } from "lucide-react"
import type { QuestionAnalytics } from "@/lib/types/form"

export function NPSHighlight({ npsStats }: { npsStats: QuestionAnalytics[] }) {
  if (npsStats.length === 0) return null
  const main = npsStats[0]
  const score = main.npsScore ?? 0
  const promoters = main.npsPromoters ?? 0
  const passives = main.npsPassives ?? 0
  const detractors = main.npsDetractors ?? 0

  const scoreColor = score >= 50 ? "text-emerald-600" : score >= 0 ? "text-amber-600" : "text-red-600"
  const ringColor = score >= 50 ? "#22c55e" : score >= 0 ? "#f59e0b" : "#ef4444"
  const scoreLabel = score >= 50 ? "Excelente" : score >= 0 ? "Bom" : score < 0 ? "Precisa atenção" : "Regular"

  return (
    <div className="rounded-xl border bg-card p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold">NPS Score</h3>
        {npsStats.length > 0 && (
          <span className="text-xs text-muted-foreground ml-1 truncate max-w-[200px]">
            · {main.questionTitle}
          </span>
        )}
      </div>

      <div className="flex items-center gap-8">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 36 36" className="rotate-[-90deg]" width="96" height="96">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={ringColor} strokeWidth="3"
              strokeDasharray={`${Math.abs(score)} 100`}
              strokeLinecap="round"
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-2xl font-bold tabular-nums ${scoreColor}`}>
            {score > 0 ? `+${score}` : score}
          </span>
        </div>

        <div className="flex-1 space-y-3">
          <p className={`text-sm font-semibold ${scoreColor}`}>{scoreLabel}</p>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
            <div className="bg-red-400" style={{ width: `${detractors}%` }} title={`Detratores: ${detractors}%`} />
            <div className="bg-yellow-400" style={{ width: `${passives}%` }} title={`Passivos: ${passives}%`} />
            <div className="bg-emerald-500" style={{ width: `${promoters}%` }} title={`Promotores: ${promoters}%`} />
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400 inline-block" />Detratores {detractors}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-yellow-400 inline-block" />Passivos {passives}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />Promotores {promoters}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
