import type { QuestionAnalytics } from "@/lib/types/form"

export function NumericViz({ stat }: { stat: QuestionAnalytics }) {
  const dist = stat.distribution ?? []
  const max = Math.max(...dist.map((d) => d.count), 1)

  return (
    <div className="space-y-4">
      <div className="flex gap-6 text-sm">
        <div>
          <p className="text-2xl font-bold tabular-nums">{stat.average}</p>
          <p className="text-xs text-muted-foreground">média</p>
        </div>
        <div className="text-muted-foreground text-xs flex flex-col justify-end pb-0.5 gap-1">
          <span>mín: {stat.min}</span>
          <span>máx: {stat.max}</span>
        </div>
      </div>
      {dist.length > 0 && (
        <div className="flex items-end gap-1.5 h-16">
          {dist.map((d) => (
            <div key={d.value} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
              <div
                className="w-full rounded-t bg-primary/70 transition-all"
                style={{ height: `${(d.count / max) * 52}px`, minHeight: d.count > 0 ? "4px" : "0" }}
                title={`${d.value}: ${d.count}`}
              />
              <span className="text-[10px] text-muted-foreground tabular-nums">{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
