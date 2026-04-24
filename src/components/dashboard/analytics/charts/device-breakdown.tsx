import type { FormAnalytics } from "@/lib/types/form"
import { pct } from "../utils"

const DEVICE_LABELS: Record<string, string> = {
  desktop: "Desktop",
  mobile: "Mobile",
  tablet: "Tablet",
  unknown: "Desconhecido",
}

const DEVICE_COLORS: Record<string, string> = {
  desktop: "bg-blue-500",
  mobile: "bg-emerald-500",
  tablet: "bg-violet-500",
  unknown: "bg-muted-foreground/40",
}

export function DeviceBreakdown({ data }: { data: FormAnalytics["deviceBreakdown"] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem dados de dispositivo ainda.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {data.map((row) => (
          <div
            key={row.device}
            className={`transition-all ${DEVICE_COLORS[row.device] ?? "bg-muted"}`}
            style={{ width: `${row.percentage * 100}%` }}
            title={`${DEVICE_LABELS[row.device] ?? row.device}: ${pct(row.percentage)}`}
          />
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        {data.map((row) => (
          <div key={row.device} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full inline-block ${DEVICE_COLORS[row.device] ?? "bg-muted"}`} />
              {DEVICE_LABELS[row.device] ?? row.device}
            </span>
            <span className="text-muted-foreground tabular-nums text-xs">
              {pct(row.percentage)} · {row.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
