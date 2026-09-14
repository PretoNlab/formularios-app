"use client"

import { useMemo } from "react"
import { BarChart3, Eye, TrendingUp, Globe } from "lucide-react"
import type { FormListItem } from "@/lib/db/queries/forms"

interface DashboardKpisProps {
  forms: FormListItem[]
}

export function DashboardKpis({ forms }: DashboardKpisProps) {
  const stats = useMemo(() => {
    const totalResponses = forms.reduce((acc, f) => acc + (f.responseCount || 0), 0)
    const totalViews = forms.reduce((acc, f) => acc + (f.viewCount || 0), 0)
    const publishedCount = forms.filter((f) => f.status === "published").length
    const conversionRate = totalViews > 0
      ? ((totalResponses / totalViews) * 100).toFixed(1)
      : "0"

    return {
      totalResponses,
      totalViews,
      publishedCount,
      totalForms: forms.length,
      conversionRate,
    }
  }, [forms])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      {/* Total Responses */}
      <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-4 sm:p-5 shadow-xs transition-all hover:border-primary/30">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-muted-foreground">Respostas</span>
          <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
            <BarChart3 className="h-4 w-4" />
          </div>
        </div>
        <p className="text-2xl sm:text-3xl font-bold tracking-tight">
          {stats.totalResponses.toLocaleString("pt-BR")}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {stats.totalResponses === 1 ? "1 resposta coletada" : `${stats.totalResponses} respostas coletadas`}
        </p>
      </div>

      {/* Total Views */}
      <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-4 sm:p-5 shadow-xs transition-all hover:border-primary/30">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-muted-foreground">Visualizações</span>
          <div className="rounded-lg bg-blue-500/10 p-1.5 text-blue-600 dark:text-blue-400">
            <Eye className="h-4 w-4" />
          </div>
        </div>
        <p className="text-2xl sm:text-3xl font-bold tracking-tight">
          {stats.totalViews.toLocaleString("pt-BR")}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Visitas em todos os forms
        </p>
      </div>

      {/* Conversion Rate */}
      <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-4 sm:p-5 shadow-xs transition-all hover:border-primary/30">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-muted-foreground">Taxa de Conclusão</span>
          <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <p className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
          {stats.conversionRate}%
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Média de respostas / visitas
        </p>
      </div>

      {/* Active Forms */}
      <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-4 sm:p-5 shadow-xs transition-all hover:border-primary/30">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-muted-foreground">Forms Publicados</span>
          <div className="rounded-lg bg-violet-500/10 p-1.5 text-violet-600 dark:text-violet-400">
            <Globe className="h-4 w-4" />
          </div>
        </div>
        <p className="text-2xl sm:text-3xl font-bold tracking-tight">
          {stats.publishedCount}{" "}
          <span className="text-sm font-normal text-muted-foreground">/ {stats.totalForms}</span>
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {stats.publishedCount === 1 ? "1 formulário ativo" : `${stats.publishedCount} formulários ativos`}
        </p>
      </div>
    </div>
  )
}
