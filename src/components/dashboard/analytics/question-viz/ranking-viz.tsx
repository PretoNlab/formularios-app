import type { QuestionAnalytics } from "@/lib/types/form"

export function RankingViz({ stat }: { stat: QuestionAnalytics }) {
  const items = stat.rankingData ?? []

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem respostas ainda.</p>
  }

  // Preference score: items with lower avgPosition = more preferred. Normalize to 0-1.
  const maxPosition = Math.max(...items.map((i) => i.avgPosition), items.length)
  const minPosition = Math.min(...items.map((i) => i.avgPosition), 1)
  const positionRange = maxPosition - minPosition || 1

  return (
    <div className="space-y-2">
      {items.map((it, i) => {
        // Invert: lower position = fuller bar
        const score = 1 - (it.avgPosition - minPosition) / positionRange
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`
        return (
          <div key={it.item} className="flex items-center gap-3">
            <span className="text-sm font-semibold w-10 shrink-0 tabular-nums text-muted-foreground">
              {medal}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm truncate max-w-[75%]" title={it.item}>{it.item}</span>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                  posição média <span className="font-semibold text-foreground">{it.avgPosition}</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.max(score * 100, 4)}%` }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
