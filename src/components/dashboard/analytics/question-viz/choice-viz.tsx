import type { QuestionAnalytics } from "@/lib/types/form"
import { pct } from "../utils"

export function ChoiceViz({ stat }: { stat: QuestionAnalytics }) {
  const options = stat.optionCounts ?? []
  const maxCount = Math.max(...options.map((o) => o.count), 1)

  return (
    <div className="space-y-2.5">
      {options.slice(0, 8).map((opt) => (
        <div key={opt.option}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm truncate max-w-[70%]">{opt.option || "—"}</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums shrink-0">
              <span className="font-medium text-foreground">{pct(opt.percentage)}</span>
              <span>{opt.count}</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(opt.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
