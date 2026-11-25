"use client"

import { useState } from "react"
import {
  AlertTriangle,
  FlaskConical,
  MessageSquareQuote,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ScenarioBucket {
  anchor: 1 | 2 | 3 | 4 | 5
  label: string
  count: number
  percentage: number
}

interface ScenarioPersona {
  name: string
  meta: string
  archetype: "entusiasta" | "pragmatico" | "cetico"
  ssrAnchor: 1 | 2 | 3 | 4 | 5
  innerThought: string
}

interface ScenarioAlert {
  question: string
  issue: string
  fix: string
}

interface SsrScenario {
  id: string
  tabLabel: string
  formTitle: string
  audience: string
  ssrScore: string
  ssrVerdict: string
  favorablePct: number
  dispersion: string
  summary: string
  distribution: ScenarioBucket[]
  alerts: ScenarioAlert[]
  personas: ScenarioPersona[]
}

const SCENARIOS: SsrScenario[] = [
  {
    id: "clinicas",
    tabLabel: "SaaS para Clínicas (R$ 297/mês)",
    formTitle: "Pesquisa de Pré-Lançamento: Agenda Inteligente com Confirmação no WhatsApp",
    audience: "Sócios e gestores de clínicas médicas e odontológicas no Brasil (30 a 55 anos)",
    ssrScore: "3.9",
    ssrVerdict: "Boa aceitação",
    favorablePct: 65,
    dispersion: "1.14",
    summary:
      "Reduzir faltas pelo WhatsApp atrai interesse imediato, mas clínicas que já usam prontuário eletrônico travam por medo de ter que migrar histórico de pacientes.",
    distribution: [
      { anchor: 5, label: "Alta intenção", count: 7, percentage: 35 },
      { anchor: 4, label: "Favorável", count: 6, percentage: 30 },
      { anchor: 3, label: "Ambivalente", count: 3, percentage: 15 },
      { anchor: 2, label: "Resistência", count: 3, percentage: 15 },
      { anchor: 1, label: "Rejeição forte", count: 1, percentage: 5 },
    ],
    alerts: [
      {
        question: "Pergunta 3: Qual sistema de agenda você usa hoje?",
        issue: "Não há opção para quem controla agenda no papel ou planilha do Google.",
        fix: "Incluir 'Planilha / Papel' e 'Outro sistema' para não forçar resposta falsa.",
      },
      {
        question: "Pergunta 5: Você pagaria R$ 297/mês por essa solução?",
        issue: "Clínicas com apenas 1 profissional acharam o valor puxado sem saber o limite de mensagens.",
        fix: "Explicar na descrição da pergunta quantas confirmações mensais estão inclusas no valor.",
      },
    ],
    personas: [
      {
        name: "Dra. Camila Rocha",
        meta: "36 anos · Campinas, SP · Clínica odontológica com 3 cadeiras",
        archetype: "entusiasta",
        ssrAnchor: 5,
        innerThought:
          "Perco pelo menos uns quatro horários por semana com paciente que esquece e não avisa. Se confirmar sozinho no WhatsApp da clínica sem minha secretária ficar cobrando um por um, R$ 297 se paga na primeira semana.",
      },
      {
        name: "Marcos Tavares",
        meta: "44 anos · Curitiba, PR · Gestor de clínica de fisioterapia",
        archetype: "pragmatico",
        ssrAnchor: 4,
        innerThought:
          "O preço faz sentido para o tamanho da nossa operação, mas só assino se conversar com nosso prontuário atual. Não vou obrigar sete fisioterapeutas a preencherem duas agendas diferentes.",
      },
      {
        name: "Dr. Henrique Bastos",
        meta: "52 anos · Recife, PE · Consultório particular individual",
        archetype: "cetico",
        ssrAnchor: 2,
        innerThought:
          "Atendo poucos pacientes particulares por dia e minha secretária já manda mensagem na véspera. Pagar quase trezentos reais fixos todo mês só para disparar lembrete fica pesado pro meu volume.",
      },
    ],
  },
  {
    id: "cafe",
    tabLabel: "Clube de Café Especial (R$ 89/mês)",
    formTitle: "Validação de Assinatura Mensal: Cafés de Pequenos Produtores em Casa",
    audience: "Consumidores das classes A/B em capitais (24 a 45 anos) que preparam café em casa",
    ssrScore: "2.8",
    ssrVerdict: "Recepção dividida",
    favorablePct: 35,
    dispersion: "1.28",
    summary:
      "A curadoria agrada quem já mói grãos em casa, mas o frete não informado e o medo de acumular pacotes travam a assinatura recorrente.",
    distribution: [
      { anchor: 5, label: "Alta intenção", count: 2, percentage: 10 },
      { anchor: 4, label: "Favorável", count: 5, percentage: 25 },
      { anchor: 3, label: "Ambivalente", count: 5, percentage: 25 },
      { anchor: 2, label: "Resistência", count: 5, percentage: 25 },
      { anchor: 1, label: "Rejeição forte", count: 3, percentage: 15 },
    ],
    alerts: [
      {
        question: "Pergunta 2: Qual moagem você prefere receber?",
        issue: "Termos técnicos ('Prensa Francesa', 'V60') deixaram iniciantes inseguros para avançar.",
        fix: "Trocar para linguagem cotidiana: 'Em grãos', 'Moído para coador comum' ou 'Cafeteira italiana/prensa'.",
      },
      {
        question: "Pergunta 6: Assinaria hoje por R$ 89/mês (500g)?",
        issue: "Faltou deixar claro se o frete está embutido e se dá para pausar um mês sem multa.",
        fix: "Informar regra de frete e pausa em 1 clique antes de perguntar a intenção de compra.",
      },
    ],
    personas: [
      {
        name: "Lucas Andrade",
        meta: "29 anos · São Paulo, SP · Designer em trabalho remoto",
        archetype: "entusiasta",
        ssrAnchor: 5,
        innerThought:
          "Já gasto mais ou menos isso comprando dois pacotes de 250g em cafeteria todo mês. Receber torra fresca de produtor diferente sem sair de casa vale muito, desde que venha em grãos.",
      },
      {
        name: "Fernanda Lima",
        meta: "38 anos · Florianópolis, SC · Arquiteta",
        archetype: "pragmatico",
        ssrAnchor: 3,
        innerThought:
          "Gosto de café bom, mas moro sozinha e 500g todo mês acaba acumulando no armário. Se cobrar R$ 25 de frete por fora então, passa de R$ 110 e prefiro comprar avulso no mercado.",
      },
      {
        name: "Ricardo Menezes",
        meta: "41 anos · Salvador, BA · Analista financeiro",
        archetype: "cetico",
        ssrAnchor: 1,
        innerThought:
          "Assinatura mensal de comida e bebida sempre vira dor de cabeça para cancelar depois. Além disso, o frete pro Nordeste costuma dobrar o valor desse tipo de clube.",
      },
    ],
  },
  {
    id: "b2b",
    tabLabel: "Diagnóstico Comercial B2B",
    formTitle: "Aplicação para Assessoria de Tráfego Pago e Funil de Vendas",
    audience: "Empresários de serviços e e-commerce faturando entre R$ 30 mil e R$ 300 mil/mês",
    ssrScore: "3.4",
    ssrVerdict: "Recepção dividida",
    favorablePct: 50,
    dispersion: "1.21",
    summary:
      "Empresários qualificados demonstram interesse na análise gratuita, mas desistem quando o formulário pede faturamento exato e CNPJ logo nas primeiras telas.",
    distribution: [
      { anchor: 5, label: "Alta intenção", count: 4, percentage: 20 },
      { anchor: 4, label: "Favorável", count: 6, percentage: 30 },
      { anchor: 3, label: "Ambivalente", count: 4, percentage: 20 },
      { anchor: 2, label: "Resistência", count: 4, percentage: 20 },
      { anchor: 1, label: "Rejeição forte", count: 2, percentage: 10 },
    ],
    alerts: [
      {
        question: "Pergunta 2: Qual é o CNPJ e o faturamento mensal da empresa?",
        issue: "Pedir CNPJ antes de gerar valor fez 30% das personas céticas fecharem a página.",
        fix: "Mover o WhatsApp para o início e pedir faixa de faturamento em múltipla escolha no final.",
      },
    ],
    personas: [
      {
        name: "Patrícia Gomes",
        meta: "33 anos · Goiânia, GO · Dona de marca própria de moda feminina",
        archetype: "entusiasta",
        ssrAnchor: 5,
        innerThought:
          "Nossas campanhas no Instagram encareceram demais nos últimos dois meses. Quero conversar ainda hoje se tiverem experiência real com loja virtual.",
      },
      {
        name: "Eduardo Nunes",
        meta: "47 anos · Porto Alegre, RS · Diretor de distribuidora",
        archetype: "cetico",
        ssrAnchor: 2,
        innerThought:
          "Mal abri o link e já querem meu CNPJ e quanto eu faturo, sem nem mostrar um caso parecido com o meu setor. Cara de triagem para vendedor júnior ficar me ligando.",
      },
    ],
  },
]

const ARCHETYPE_STYLE: Record<
  ScenarioPersona["archetype"],
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

export function SsrInteractiveShowcase() {
  const [selectedId, setSelectedId] = useState<string>(SCENARIOS[0].id)
  const scenario = SCENARIOS.find((s) => s.id === selectedId) ?? SCENARIOS[0]

  return (
    <div className="space-y-6">
      {/* Scenario Switcher */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {SCENARIOS.map((item) => {
          const active = item.id === scenario.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={cn(
                "rounded-full px-4 py-2 text-xs sm:text-sm font-semibold border transition-all",
                active
                  ? "bg-foreground text-background border-foreground shadow-sm"
                  : "bg-card text-muted-foreground hover:text-foreground hover:border-foreground/30"
              )}
            >
              {item.tabLabel}
            </button>
          )
        })}
      </div>

      {/* Simulated Output Window */}
      <div className="rounded-2xl border bg-card shadow-xl overflow-hidden">
        <div className="border-b bg-muted/30 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-400">
              <FlaskConical className="h-3.5 w-3.5" />
              <span>Painel de 20 Consumidores Sintéticos · Método SSR</span>
            </div>
            <p className="text-sm font-bold text-foreground">{scenario.formTitle}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0" />
              {scenario.audience}
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            Executado em ~18s
          </Badge>
        </div>

        <div className="p-5 sm:p-7 space-y-7">
          {/* Top Metrics + Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 rounded-xl border bg-background p-5 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Índice Semântico de Intenção (SSR)
              </p>
              <div className="flex items-baseline gap-2.5">
                <span className="text-4xl font-extrabold tabular-nums">
                  {scenario.ssrScore}
                </span>
                <span className="text-sm text-muted-foreground font-medium">
                  / 5.0 · {scenario.ssrVerdict}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                <span className="rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 font-semibold">
                  {scenario.favorablePct}% notas 4 e 5
                </span>
                <span className="rounded-md bg-muted px-2.5 py-1 text-muted-foreground font-medium tabular-nums">
                  Dispersão σ = {scenario.dispersion}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t">
                {scenario.summary}
              </p>
            </div>

            <div className="lg:col-span-7 rounded-xl border bg-background p-5 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Distribuição nas 5 Âncoras Semânticas (20 personas)
              </p>
              <div className="space-y-2.5 pt-1">
                {scenario.distribution.map((b) => (
                  <div key={b.anchor} className="flex items-center gap-3 text-xs">
                    <span className="w-32 shrink-0 text-muted-foreground truncate">
                      <strong className="text-foreground">{b.anchor}.</strong> {b.label}
                    </span>
                    <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          b.anchor >= 4
                            ? "bg-emerald-500"
                            : b.anchor === 3
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        )}
                        style={{ width: `${b.percentage}%` }}
                      />
                    </div>
                    <span className="w-16 text-right tabular-nums text-muted-foreground">
                      {b.count} ({b.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Friction Alerts */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Falhas nas Perguntas Detectadas Antes de Publicar
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scenario.alerts.map((alert, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs space-y-1.5"
                >
                  <p className="font-bold text-foreground">{alert.question}</p>
                  <p className="text-muted-foreground">
                    <strong>Atrito:</strong> {alert.issue}
                  </p>
                  <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                    <strong>Correção sugerida:</strong> {alert.fix}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Inner Monologues */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MessageSquareQuote className="h-3.5 w-3.5 text-violet-600" />
              Amostra do Raciocínio em Texto Livre (Etapa Anterior à Nota)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {scenario.personas.map((p) => {
                const style = ARCHETYPE_STYLE[p.archetype]
                return (
                  <div
                    key={p.name}
                    className="rounded-xl border bg-background p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className={cn("text-[10px]", style.className)}>
                          {style.label}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] tabular-nums">
                          Âncora {p.ssrAnchor}/5
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground">{p.meta}</p>
                      </div>
                      <p className="text-xs text-foreground/85 italic leading-relaxed pt-1">
                        &ldquo;{p.innerThought}&rdquo;
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
