import type { QuestionAnalytics } from "@/lib/types/form"
import { lrmPercentages } from "../utils"

export function ChoiceViz({ stat }: { stat: QuestionAnalytics }) {
  const options = (stat.optionCounts ?? []).slice(0, 8)

  // Distribute 100% correctly using Largest Remainder Method
  const displayPcts = lrmPercentages(options.map((o) => o.percentage))
  const maxPct = Math.max(...displayPcts, 1)

  return (
    <div className="space-y-2.5">
      {options.map((opt, i) => (
        <div key={opt.option}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm truncate max-w-[70%]">{opt.option || "—"}</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums shrink-0">
              <span className="font-medium text-foreground">{displayPcts[i]}%</span>
              <span>{opt.count}</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(displayPcts[i] / maxPct) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
