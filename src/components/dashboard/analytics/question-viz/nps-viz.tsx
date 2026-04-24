import type { QuestionAnalytics } from "@/lib/types/form"

export function NpsViz({ stat }: { stat: QuestionAnalytics }) {
  const score = stat.npsScore ?? 0
  const promoters = stat.npsPromoters ?? 0
  const passives = stat.npsPassives ?? 0
  const detractors = stat.npsDetractors ?? 0
  const scoreColor = score >= 50 ? "text-green-600" : score >= 0 ? "text-amber-600" : "text-red-600"

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <span className={`text-5xl font-bold tabular-nums ${scoreColor}`}>{score}</span>
        <span className="text-sm text-muted-foreground mb-1.5">NPS Score</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        <div className="bg-red-400 transition-all" style={{ width: `${detractors}%` }} title={`Detratores: ${detractors}%`} />
        <div className="bg-yellow-400 transition-all" style={{ width: `${passives}%` }} title={`Passivos: ${passives}%`} />
        <div className="bg-green-500 transition-all" style={{ width: `${promoters}%` }} title={`Promotores: ${promoters}%`} />
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-400 inline-block" />Detratores {detractors}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-yellow-400 inline-block" />Passivos {passives}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />Promotores {promoters}%
        </span>
      </div>
      {stat.distribution && (
        <div className="flex gap-1 flex-wrap pt-1">
          {stat.distribution.map((d) => (
            <div key={d.value} className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-muted-foreground tabular-nums">{d.count}</span>
              <div className={`h-6 w-6 rounded flex items-center justify-center text-[10px] font-semibold ${
                d.value >= 9 ? "bg-green-100 text-green-700" :
                d.value >= 7 ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }`}>
                {d.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
