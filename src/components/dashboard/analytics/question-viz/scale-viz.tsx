import type { QuestionAnalytics } from "@/lib/types/form"

export function ScaleViz({ stat }: { stat: QuestionAnalytics }) {
  const scaleMin = stat.scaleMin ?? 1
  const scaleMax = stat.scaleMax ?? 10
  const avg = stat.average ?? scaleMin
  const dist = stat.distribution ?? []
  const maxCount = Math.max(...dist.map((d) => d.count), 1)
  const range = scaleMax - scaleMin
  const position = range > 0 ? ((avg - scaleMin) / range) * 100 : 50

  const allValues = Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => {
    const value = scaleMin + i
    const found = dist.find((d) => d.value === value)
    return { value, count: found?.count ?? 0 }
  })

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{stat.scaleMinLabel || scaleMin}</span>
          <span>{stat.scaleMaxLabel || scaleMax}</span>
        </div>
        <div className="relative h-3 rounded-full bg-gradient-to-r from-red-300 via-amber-300 to-emerald-400">
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-white border-2 border-primary shadow-sm transition-all duration-700"
            style={{ left: `${position}%` }}
          />
        </div>
        <div className="flex justify-center gap-1">
          <span className="text-2xl font-bold tabular-nums">{avg}</span>
          <span className="text-xs text-muted-foreground self-end mb-0.5">/ {scaleMax}</span>
        </div>
      </div>
      <div className="flex items-end gap-1 h-12">
        {allValues.map((v) => (
          <div key={v.value} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
            <div
              className="w-full rounded-t bg-primary/60 transition-all duration-500"
              style={{ height: `${(v.count / maxCount) * 40}px`, minHeight: v.count > 0 ? "3px" : "0" }}
              title={`${v.value}: ${v.count}`}
            />
            <span className="text-[9px] text-muted-foreground tabular-nums">{v.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
