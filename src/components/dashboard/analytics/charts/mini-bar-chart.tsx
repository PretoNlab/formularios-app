import type { AnalyticsPeriod } from "@/lib/types/form"

const PERIOD_DAYS: Record<AnalyticsPeriod, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "all": 90, // "all" visual cap: same as 90d range for the chart
}

export function MiniBarChart({ data, period = "30d" }: {
  data: { date: string; count: number }[]
  period?: AnalyticsPeriod
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Sem dados no período.
      </div>
    )
  }

  const days = PERIOD_DAYS[period]
  const max = Math.max(...data.map((d) => d.count), 1)
  const today = new Date()
  const bars: { date: string; count: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    bars.push({ date: key, count: data.find((x) => x.date === key)?.count ?? 0 })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-0.5 h-24">
        {bars.map((d) => (
          <div
            key={d.date}
            title={`${d.date}: ${d.count} resposta${d.count !== 1 ? "s" : ""}`}
            className="flex-1 rounded-sm transition-all cursor-default"
            style={{
              height: d.count === 0 ? "4px" : `${(d.count / max) * 100}%`,
              backgroundColor: d.count === 0 ? "hsl(var(--muted))" : "hsl(var(--primary))",
              opacity: d.count === 0 ? 0.3 : 0.85,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{bars[0].date.slice(5).replace("-", "/")}</span>
        <span>hoje</span>
      </div>
    </div>
  )
}
