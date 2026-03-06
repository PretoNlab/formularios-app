import { redirect } from "next/navigation"
import Link from "next/link"
import { BarChart3, Eye, Users, TrendingUp, FileText, CheckCircle2, Globe, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import { getFormsByWorkspace } from "@/lib/db/queries/forms"
import { db } from "@/lib/db/client"
import { responses } from "@/lib/db/schema"
import { and, inArray, sql } from "drizzle-orm"
import { Badge } from "@/components/ui/badge"
import { PRESET_THEMES } from "@/config/themes"

// ─── Types ───────────────────────────────────────────────────────────────────

interface DayCount { date: string; count: number }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number) { return `${Math.round(n * 100)}%` }

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

// ─── Bar Chart (Server Component) ─────────────────────────────────────────────

function ResponsesBarChart({ data }: { data: DayCount[] }) {
  const today = new Date()
  const days: DayCount[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const found = data.find((x) => x.date === key)
    days.push({ date: key, count: found?.count ?? 0 })
  }
  const max = Math.max(...days.map((d) => d.count), 1)

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-0.5 h-28">
        {days.map((d) => (
          <div
            key={d.date}
            title={`${d.date}: ${d.count} resposta${d.count !== 1 ? "s" : ""}`}
            className="flex-1 rounded-sm cursor-default transition-opacity hover:opacity-70"
            style={{
              height: d.count === 0 ? "4px" : `${(d.count / max) * 100}%`,
              backgroundColor: d.count === 0 ? "hsl(var(--muted))" : "hsl(var(--primary))",
              opacity: d.count === 0 ? 0.3 : 0.85,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{days[0].date.slice(5).replace("-", "/")}</span>
        <span>hoje</span>
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect("/login")

  const { data: user } = await ensureUserExists({
    id: authUser.id,
    email: authUser.email!,
    user_metadata: authUser.user_metadata,
  })
  if (!user) redirect("/login")

  // ── Workspace forms ─────────────────────────────────────────────────────────
  const { data: allForms } = await getFormsByWorkspace(user.defaultWorkspace.id)
  const formList = allForms ?? []
  const formIds = formList.map((f) => f.id)

  // ── Aggregate stats ─────────────────────────────────────────────────────────
  const totalForms = formList.length
  const totalResponses = formList.reduce((s, f) => s + f.responseCount, 0)
  const totalViews = formList.reduce((s, f) => s + f.viewCount, 0)
  const publishedCount = formList.filter((f) => f.status === "published").length

  let completionRate = 0
  let avgCompletionTime = 0
  let responsesByDay: DayCount[] = []

  if (formIds.length > 0) {
    const [statsRows, dayRows] = await Promise.all([
      db
        .select({
          total: sql<number>`count(*)::int`,
          completed: sql<number>`count(case when ${responses.completedAt} is not null then 1 end)::int`,
          avgSeconds: sql<number | null>`avg(extract(epoch from (${responses.completedAt} - ${responses.startedAt})))`,
        })
        .from(responses)
        .where(inArray(responses.formId, formIds)),

      db
        .select({
          date: sql<string>`date(${responses.startedAt})::text`,
          count: sql<number>`count(*)::int`,
        })
        .from(responses)
        .where(
          and(
            inArray(responses.formId, formIds),
            sql`${responses.startedAt} >= now() - interval '30 days'`
          )
        )
        .groupBy(sql`date(${responses.startedAt})`)
        .orderBy(sql`date(${responses.startedAt})`),
    ])

    const stats = statsRows[0]
    if (stats && stats.total > 0) {
      completionRate = stats.completed / stats.total
      avgCompletionTime = Math.round(stats.avgSeconds ?? 0)
    }
    responsesByDay = dayRows
  }

  // ── Top forms ───────────────────────────────────────────────────────────────
  const topForms = [...formList]
    .sort((a, b) => b.responseCount - a.responseCount)
    .slice(0, 8)

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (totalForms === 0) {
    return (
      <div className="container py-24 flex flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-6">
          <BarChart3 className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Nenhum dado ainda</h1>
        <p className="text-muted-foreground max-w-md">
          Crie e publique seu primeiro formulário para começar a ver métricas aqui.
        </p>
        <Link href="/dashboard" className="mt-6 text-sm font-medium text-primary hover:underline">
          Ir para o Dashboard →
        </Link>
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-5xl">

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-heading">Analytics</h1>
        <p className="text-muted-foreground mt-1">Visão geral de todos os seus formulários</p>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={FileText}
          label="Formulários"
          value={totalForms.toLocaleString("pt-BR")}
          sub={`${publishedCount} publicado${publishedCount !== 1 ? "s" : ""}`}
        />
        <StatCard
          icon={Users}
          label="Respostas"
          value={totalResponses.toLocaleString("pt-BR")}
          sub="total acumulado"
        />
        <StatCard
          icon={Eye}
          label="Visualizações"
          value={totalViews.toLocaleString("pt-BR")}
          sub="total acumulado"
        />
        <StatCard
          icon={TrendingUp}
          label="Taxa de conclusão"
          value={pct(completionRate)}
          sub={avgCompletionTime > 0 ? `tempo médio ${formatDuration(avgCompletionTime)}` : undefined}
        />
      </div>

      {/* ── 30-day chart ── */}
      <div className="rounded-xl border bg-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Respostas nos últimos 30 dias</h2>
          <span className="text-xs text-muted-foreground">todos os formulários</span>
        </div>
        {responsesByDay.length === 0 && totalResponses === 0 ? (
          <div className="flex items-center justify-center h-28 text-sm text-muted-foreground">
            Sem respostas no período.
          </div>
        ) : (
          <ResponsesBarChart data={responsesByDay} />
        )}
      </div>

      {/* ── Top forms ── */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Formulários mais ativos</h2>
          <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Ver todos →
          </Link>
        </div>
        <div className="divide-y">
          {topForms.map((form) => {
            const themeId = (form.theme as { id?: string } | null)?.id ?? "midnight"
            const theme = PRESET_THEMES.find((t) => t.id === themeId) ?? PRESET_THEMES[0]
            return (
              <div key={form.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                {/* Color swatch */}
                <div
                  className="h-8 w-8 rounded-lg shrink-0"
                  style={{ backgroundColor: theme.colors.bg }}
                />
                {/* Title & status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{form.title}</p>
                    <Badge
                      variant={form.status === "published" ? "default" : "secondary"}
                      className={`text-[10px] px-1.5 py-0 h-4 ${form.status === "published" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : ""}`}
                    >
                      {form.status === "published" ? "Publicado" : "Rascunho"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />{form.responseCount} respostas
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />{form.viewCount} views
                    </span>
                  </p>
                </div>
                {/* Progress bar */}
                <div className="w-24 hidden sm:block">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: totalResponses > 0
                          ? `${Math.min(100, (form.responseCount / Math.max(...topForms.map(f => f.responseCount), 1)) * 100)}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
                {/* Links */}
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/responses/${form.id}`}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title="Ver respostas"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                  </Link>
                  {form.status === "published" && (
                    <Link
                      href={`/f/${form.slug}`}
                      target="_blank"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title="Ver formulário"
                    >
                      <Globe className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
