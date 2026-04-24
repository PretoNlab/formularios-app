import type { QuestionAnalytics } from "@/lib/types/form"

const RATING_ICONS: Record<string, { filled: string; empty: string }> = {
  stars:   { filled: "★", empty: "☆" },
  hearts:  { filled: "♥", empty: "♡" },
  thumbs:  { filled: "👍", empty: "·" },
  numbers: { filled: "●", empty: "○" },
}

export function RatingViz({ stat }: { stat: QuestionAnalytics }) {
  const ratingMax = stat.ratingMax ?? 5
  const style = stat.ratingStyle ?? "stars"
  const icons = RATING_ICONS[style] ?? RATING_ICONS.stars
  const avg = stat.average ?? 0
  const dist = stat.distribution ?? []
  const maxCount = Math.max(...dist.map((d) => d.count), 1)
  const filledCount = Math.round(avg)

  const bars = Array.from({ length: ratingMax }, (_, i) => {
    const value = i + 1
    const found = dist.find((d) => d.value === value)
    return { value, count: found?.count ?? 0 }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold tabular-nums">{avg}</span>
        <div className="flex flex-col gap-0.5">
          <span className="text-xl tracking-wide leading-none">
            {Array.from({ length: ratingMax }, (_, i) => (
              <span key={i} className={i < filledCount ? "text-amber-400" : "text-muted-foreground/30"}>
                {i < filledCount ? icons.filled : icons.empty}
              </span>
            ))}
          </span>
          <span className="text-xs text-muted-foreground">
            média de {stat.totalAnswers} resposta{stat.totalAnswers !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      <div className="space-y-1.5">
        {[...bars].reverse().map((b) => (
          <div key={b.value} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-4 text-right tabular-nums shrink-0">{b.value}</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${(b.count / maxCount) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums w-6 text-right shrink-0">{b.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
