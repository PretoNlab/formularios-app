import type React from "react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  accent?: boolean
  trend?: "up" | "down" | "neutral"
}

export function StatCard({ icon: Icon, label, value, sub, accent, trend }: StatCardProps) {
  return (
    <div className={cn(
      "relative rounded-2xl border bg-card p-5 overflow-hidden transition-shadow hover:shadow-md",
      accent && "border-primary/20 bg-primary/[0.03]"
    )}>
      {/* subtle gradient blob */}
      {accent && (
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
      )}
      <div className="flex items-center justify-between mb-4">
        <span className={cn(
          "inline-flex items-center justify-center h-8 w-8 rounded-lg",
          accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          <Icon className="h-4 w-4" />
        </span>
        {trend && (
          <span className={cn(
            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
            trend === "up" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            trend === "down" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            trend === "neutral" && "bg-muted text-muted-foreground"
          )}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
          </span>
        )}
      </div>
      <p className={cn(
        "text-3xl font-bold tracking-tight tabular-nums",
        accent && "text-primary"
      )}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</p>}
    </div>
  )
}
