import type { FormAnalytics } from "@/lib/types/form"
import { formatDuration, pct } from "../utils"

function trimSource(source: string): string {
  try {
    const url = new URL(source.startsWith("http") ? source : `https://${source}`)
    return url.hostname.replace(/^www\./, "")
  } catch {
    return source.length > 24 ? source.slice(0, 24) + "…" : source
  }
}

export function UTMComparison({ data }: { data: FormAnalytics["sourceBreakdown"] }) {
  if (data.length <= 1) {
    return (
      <p className="text-sm text-muted-foreground">
        Compartilhe via diferentes canais (UTM links) para comparar a performance por origem.
      </p>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_5rem_5rem_5rem] gap-2 pb-2 border-b">
        <span className="text-xs text-muted-foreground font-medium">Origem</span>
        <span className="text-xs text-muted-foreground font-medium text-right">Respostas</span>
        <span className="text-xs text-muted-foreground font-medium text-right">Conclusão</span>
        <span className="text-xs text-muted-foreground font-medium text-right">Tempo médio</span>
      </div>

      {data.slice(0, 8).map((row) => (
        <div key={row.source} className="grid grid-cols-[1fr_5rem_5rem_5rem] gap-2 py-2 border-b last:border-0 items-center">
          <div className="min-w-0">
            <span className="text-sm font-medium truncate block">{trimSource(row.source)}</span>
            <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/60 transition-all duration-500"
                style={{ width: `${(row.count / maxCount) * 100}%` }}
              />
            </div>
          </div>

          <span className="text-sm tabular-nums text-right font-medium">{row.count}</span>

          <span className={`text-sm tabular-nums text-right font-semibold ${
            row.completionRate >= 0.75 ? "text-emerald-600" :
            row.completionRate >= 0.5  ? "text-amber-600"  : "text-red-500"
          }`}>
            {pct(row.completionRate)}
          </span>

          <span className="text-sm tabular-nums text-right text-muted-foreground">
            {row.avgTime > 0 ? formatDuration(row.avgTime) : "—"}
          </span>
        </div>
      ))}
    </div>
  )
}
