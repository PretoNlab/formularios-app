"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  FlaskConical,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Users,
  MessageSquareQuote,
  RefreshCw,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  simulateSyntheticRespondentsAction,
  type SyntheticSimulationResult,
} from "@/app/actions/ai"
import { AI_CREDIT_COSTS, SYNTHETIC_SOURCE_LABEL } from "@/lib/credits"
import { cn } from "@/lib/utils"

const AUDIENCE_PRESETS = [
  {
    label: "🏢 Decisores PME (B2B)",
    value:
      "Donos e gestores de pequenas e médias empresas no Brasil (28 a 55 anos), focados em retorno sobre investimento, sem tempo a perder e cautelosos com contratos longos.",
  },
  {
    label: "🛍️ Consumidores B2C Online",
    value:
      "Consumidores brasileiros das classes B e C (20 a 45 anos) acostumados a comprar pelo celular via Pix/cartão, sensíveis a frete, preço e prova social.",
  },
  {
    label: "🎯 Inferir pelo formulário",
    value: "",
  },
] as const

const ARCHETYPE_BADGE: Record<
  "entusiasta" | "pragmatico" | "cetico",
  { label: string; className: string }
> = {
  entusiasta: {
    label: "Entusiasta",
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  pragmatico: {
    label: "Pragmático",
    className:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  cetico: {
    label: "Cético",
    className:
      "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  },
}

export interface SyntheticPanelModalProps {
  formId: string
  formTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SyntheticPanelModal({
  formId,
  formTitle,
  open,
  onOpenChange,
}: SyntheticPanelModalProps) {
  const router = useRouter()
  const [audienceDescription, setAudienceDescription] = useState("")
  const [count, setCount] = useState<10 | 20>(10)
  const [saveToDashboard, setSaveToDashboard] = useState(true)
  const [result, setResult] = useState<SyntheticSimulationResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSimulating, startSimulation] = useTransition()

  const creditCost =
    count === 20
      ? AI_CREDIT_COSTS.SYNTHETIC_PANEL_20
      : AI_CREDIT_COSTS.SYNTHETIC_PANEL_10

  function handleSimulate() {
    setErrorMsg(null)
    startSimulation(async () => {
      const res = await simulateSyntheticRespondentsAction({
        formId,
        audienceDescription,
        count,
        saveToDashboard,
      })

      if (res.success && res.data) {
        setResult(res.data)
      } else {
        setErrorMsg(
          res.error?.message || "Falha ao executar simulação de consumidores."
        )
      }
    })
  }

  function handleReset() {
    setResult(null)
    setErrorMsg(null)
  }

  function handleFinishAndRefresh() {
    onOpenChange(false)
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/builder")) {
      router.push(`/responses/${formId}`)
    } else {
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-border/80 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-b from-violet-500/10 to-transparent shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-600/25 shrink-0">
                <FlaskConical className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-lg sm:text-xl font-bold font-heading">
                    Consumidores Sintéticos
                  </DialogTitle>
                  <Badge
                    variant="secondary"
                    className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5"
                  >
                    Método SSR
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] text-violet-700 dark:text-violet-300 border-violet-500/30 gap-1 bg-violet-500/5 font-medium"
                  >
                    <Sparkles className="h-2.5 w-2.5" /> {creditCost} créditos
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {result
                    ? `Pré-teste concluído para "${formTitle}" com ancoragem semântica de 1 a 5.`
                    : "Teste aceitação, sensibilidade a preço e falhas nas perguntas antes de gastar com tráfego."}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!result ? (
            <>
              <div className="rounded-xl border bg-muted/30 p-3.5 text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Como funciona o SSR:</strong>{" "}
                em vez de chutar notas aleatórias, cada persona brasileira escreve
                primeiro sua reação sincera em texto livre e só então é ancorada na
                escala numérica — reproduzindo ceticismo e variação real antes de
                você validar com clientes humanos.
              </div>

              {/* Audience description */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label
                    htmlFor="ssr-audience"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Perfil do público que você quer simular
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {AUDIENCE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setAudienceDescription(preset.value)}
                        className="text-[11px] px-2.5 py-1 rounded-full border bg-background hover:bg-muted transition-colors font-medium"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea
                  id="ssr-audience"
                  value={audienceDescription}
                  onChange={(e) => setAudienceDescription(e.target.value)}
                  placeholder="Ex: Mulheres de 25 a 45 anos em capitais, compram dermocosméticos, mas acham marcas premium caras. (Deixe em branco para a IA deduzir pelas perguntas do formulário)"
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>

              {/* Sample Size */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Tamanho do painel sintético
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([10, 20] as const).map((n) => {
                    const cost =
                      n === 20
                        ? AI_CREDIT_COSTS.SYNTHETIC_PANEL_20
                        : AI_CREDIT_COSTS.SYNTHETIC_PANEL_10
                    const active = count === n
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setCount(n)}
                        className={cn(
                          "rounded-xl border p-3.5 text-left transition-all",
                          active
                            ? "border-violet-600 bg-violet-500/5 ring-1 ring-violet-600"
                            : "hover:border-foreground/30 bg-card"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-violet-600" />
                            {n} consumidores
                          </span>
                          <Badge variant={active ? "default" : "secondary"} className="text-[10px]">
                            {cost} créditos
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {n === 10
                            ? "Triagem rápida de perguntas, objeções e clareza."
                            : "Amostra ampliada para medir sensibilidade a preço e dispersão."}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Save to dashboard option */}
              <label className="flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer hover:bg-muted/20 transition-colors">
                <input
                  type="checkbox"
                  checked={saveToDashboard}
                  onChange={(e) => setSaveToDashboard(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-input accent-violet-600"
                />
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-foreground">
                    Injetar respostas simuladas na tabela e nos gráficos deste formulário
                  </p>
                  <p className="text-muted-foreground">
                    Todas entram marcadas com a origem{" "}
                    <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">
                      {SYNTHETIC_SOURCE_LABEL}
                    </code>{" "}
                    e podem ser filtradas ou apagadas com 1 clique antes de divulgar o link real.
                  </p>
                </div>
              </label>

              {errorMsg && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-medium">
                  {errorMsg}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              {/* SSR Score + Distribution */}
              <div className="rounded-2xl border bg-card p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                      Índice de Intenção / Aceitação (SSR)
                    </p>
                    <div className="flex items-baseline gap-2.5 mt-1">
                      <span className="text-3xl font-extrabold tabular-nums">
                        {result.ssr.score.toFixed(1)}
                      </span>
                      <span className="text-sm text-muted-foreground font-medium">
                        / 5.0 · {result.ssr.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 font-semibold">
                      {result.ssr.highIntentPercentage}% favoráveis (4–5)
                    </div>
                    <div className="rounded-lg bg-muted px-3 py-1.5 text-muted-foreground font-medium">
                      Dispersão σ = {result.ssr.dispersion.toFixed(2)}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-foreground/90 leading-relaxed border-l-2 border-violet-500 pl-3">
                  {result.executiveSummary}
                </p>

                <div className="space-y-2 pt-2">
                  {result.ssr.distribution.map((bucket) => (
                    <div key={bucket.anchor} className="flex items-center gap-3 text-xs">
                      <span className="w-32 shrink-0 text-muted-foreground truncate">
                        <strong className="text-foreground">{bucket.anchor}.</strong>{" "}
                        {bucket.label}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            bucket.anchor >= 4
                              ? "bg-emerald-500"
                              : bucket.anchor === 3
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          )}
                          style={{ width: `${bucket.percentage}%` }}
                        />
                      </div>
                      <span className="w-16 text-right tabular-nums text-muted-foreground">
                        {bucket.count} ({bucket.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Friction Alerts */}
              {result.frictionAlerts.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    Pontos de Atrito Detectados nas Perguntas
                  </h4>
                  <div className="grid gap-2.5">
                    {result.frictionAlerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5 text-xs space-y-1"
                      >
                        <p className="font-bold text-foreground">
                          {alert.questionTitle}
                        </p>
                        <p className="text-muted-foreground">
                          <strong>Problema:</strong> {alert.issue}
                        </p>
                        <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                          <strong>Ajuste sugerido:</strong> {alert.suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Personas Inner Thoughts */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MessageSquareQuote className="h-3.5 w-3.5 text-violet-500" />
                  Reações Sem Filtro por Persona ({result.personas.length})
                </h4>
                <div className="space-y-2.5">
                  {result.personas.map((p, idx) => {
                    const badge = ARCHETYPE_BADGE[p.archetype]
                    return (
                      <div
                        key={idx}
                        className="rounded-xl border bg-card p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="text-xs">
                            <span className="font-bold text-foreground">
                              {p.name}
                            </span>{" "}
                            <span className="text-muted-foreground">
                              · {p.age} anos · {p.region} · {p.profile}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={cn("text-[10px]", badge.className)}
                            >
                              {badge.label}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px] tabular-nums">
                              SSR {p.ssrAnchor}/5
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                          &ldquo;{p.innerThought}&rdquo;
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 px-6 border-t bg-muted/20 flex items-center justify-between gap-3 shrink-0">
          {!result ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isSimulating}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSimulate}
                disabled={isSimulating}
                className="gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Simulando {count} personas com SSR...
                  </>
                ) : (
                  <>
                    <FlaskConical className="h-4 w-4" />
                    Simular {count} consumidores ({creditCost} créditos)
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Testar outro público
              </Button>
              <div className="flex items-center gap-2">
                {result.savedCount > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium mr-2">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {result.savedCount} respostas salvas
                  </span>
                )}
                <Button
                  size="sm"
                  onClick={handleFinishAndRefresh}
                  className="gap-1.5"
                >
                  Ver no painel de respostas
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
