import type { FormAnalytics } from "@/lib/types/form"

const DOW_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) =>
  i % 3 === 0 ? `${String(i).padStart(2, "0")}h` : ""
)

export function HourHeatmap({ data }: { data: FormAnalytics["responsesByHour"] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Dados insuficientes para o heatmap.</p>
  }

  const countMap = new Map(data.map((d) => [`${d.dow}-${d.hour}`, d.count]))
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  const peak = data.reduce((a, b) => (b.count > a.count ? b : a), data[0])
  const peakLabel = `${DOW_LABELS[peak.dow]} ${String(peak.hour).padStart(2, "0")}h`

  return (
    <div className="space-y-3">
      <div className="flex gap-0.5 pl-9">
        {HOUR_LABELS.map((label, h) => (
          <div key={h} className="flex-1 text-center" style={{ minWidth: 0 }}>
            <span className="text-[9px] text-muted-foreground leading-none">{label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-0.5">
        {DOW_LABELS.map((day, dow) => (
          <div key={dow} className="flex items-center gap-0.5">
            <span className="text-[10px] text-muted-foreground w-8 shrink-0 text-right pr-1">{day}</span>
            {Array.from({ length: 24 }, (_, hour) => {
              const count = countMap.get(`${dow}-${hour}`) ?? 0
              const intensity = count / maxCount
              return (
                <div
                  key={hour}
                  className="flex-1 rounded-sm transition-colors"
                  style={{
                    aspectRatio: "1",
                    minWidth: 0,
                    backgroundColor: count === 0
                      ? "hsl(var(--muted))"
                      : `hsl(var(--primary) / ${Math.max(intensity * 0.9 + 0.1, 0.12)})`,
                  }}
                  title={`${day} ${String(hour).padStart(2, "0")}h: ${count} resposta${count !== 1 ? "s" : ""}`}
                />
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">Menos</span>
          {[0.1, 0.3, 0.55, 0.75, 0.95].map((v) => (
            <div
              key={v}
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: `hsl(var(--primary) / ${v})` }}
            />
          ))}
          <span className="text-[10px] text-muted-foreground">Mais</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          Pico: <span className="font-medium text-foreground">{peakLabel}</span> ({peak.count})
        </span>
      </div>
    </div>
  )
}
