"use client"

import { Calendar, Loader2 } from "lucide-react"
import type { AnalyticsPeriod } from "@/lib/types/form"

const OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "all", label: "Todo o período" },
]

export function PeriodSelector({ value, onChange, isPending }: {
  value: AnalyticsPeriod
  onChange: (p: AnalyticsPeriod) => void
  isPending?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
      ) : (
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
      )}
      <div className="inline-flex rounded-lg border bg-background p-0.5">
        {OPTIONS.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              onClick={() => { if (!isPending && !active) onChange(opt.value) }}
              disabled={isPending}
              className={`px-3 h-7 text-xs rounded-md transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground disabled:opacity-50"
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
