"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Bell, Star, Settings, Users, BarChart2, FileText,
  TrendingUp, Eye, Download, Plus, Search, Trash2, Copy,
  CheckCircle2, AlertTriangle, Info, Zap,
} from "lucide-react"

// ─── Section wrapper ───────────────────────────────────────────────────────

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8 mb-16">
      <h2 className="text-xl font-bold font-heading mb-6 pb-3 border-b">{title}</h2>
      {children}
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">{title}</h3>
      {children}
    </div>
  )
}

function TokenRow({ name, value, cls }: { name: string; value: string; cls?: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-0">
      <div className={`h-8 w-8 rounded-md border shrink-0 ${cls ?? ""}`} />
      <code className="text-xs font-mono text-foreground flex-1">{name}</code>
      <span className="text-xs text-muted-foreground font-mono">{value}</span>
    </div>
  )
}

// ─── Color Swatches ────────────────────────────────────────────────────────

const semanticColors = [
  { name: "--background", value: "0 0% 100%", cls: "bg-background" },
  { name: "--foreground", value: "0 0% 3.9%", cls: "bg-foreground" },
  { name: "--card", value: "0 0% 100%", cls: "bg-card border" },
  { name: "--primary", value: "0 0% 9%", cls: "bg-primary" },
  { name: "--primary-foreground", value: "0 0% 98%", cls: "bg-primary-foreground border" },
  { name: "--secondary", value: "0 0% 96.1%", cls: "bg-secondary" },
  { name: "--muted", value: "0 0% 96.1%", cls: "bg-muted" },
  { name: "--muted-foreground", value: "0 0% 45.1%", cls: "bg-muted-foreground" },
  { name: "--accent", value: "0 0% 96.1%", cls: "bg-accent" },
  { name: "--destructive", value: "0 84.2% 60.2%", cls: "bg-destructive" },
  { name: "--border", value: "0 0% 89.8%", cls: "bg-border" },
  { name: "--input", value: "0 0% 89.8%", cls: "bg-input" },
  { name: "--ring", value: "0 0% 3.9%", cls: "bg-ring" },
]

const chartColors = [
  { name: "--chart-1", value: "12 76% 61%", cls: "bg-[hsl(12,76%,61%)]" },
  { name: "--chart-2", value: "173 58% 39%", cls: "bg-[hsl(173,58%,39%)]" },
  { name: "--chart-3", value: "197 37% 24%", cls: "bg-[hsl(197,37%,24%)]" },
  { name: "--chart-4", value: "43 74% 66%", cls: "bg-[hsl(43,74%,66%)]" },
  { name: "--chart-5", value: "27 87% 67%", cls: "bg-[hsl(27,87%,67%)]" },
]

// ─── Typography ────────────────────────────────────────────────────────────

const typeSizes = [
  { label: "text-xs", cls: "text-xs", size: "12px" },
  { label: "text-sm", cls: "text-sm", size: "14px" },
  { label: "text-base", cls: "text-base", size: "16px" },
  { label: "text-lg", cls: "text-lg", size: "18px" },
  { label: "text-xl", cls: "text-xl", size: "20px" },
  { label: "text-2xl", cls: "text-2xl", size: "24px" },
  { label: "text-3xl", cls: "text-3xl", size: "30px" },
  { label: "text-5xl", cls: "text-5xl", size: "48px" },
]

// ─── Patterns ─────────────────────────────────────────────────────────────

function StatCardExample({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className={`flex items-center gap-2 mb-3 ${color}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

function EmptyStateExample() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground rounded-xl border bg-card">
      <FileText className="h-10 w-10 mb-4 opacity-20" />
      <p className="font-medium text-foreground">Nenhum item ainda</p>
      <p className="text-sm mt-1">Crie o primeiro para começar.</p>
      <Button size="sm" className="mt-4">
        <Plus className="h-4 w-4" />Criar
      </Button>
    </div>
  )
}

function PageHeaderExample() {
  return (
    <div className="flex items-center justify-between py-4 px-6 border rounded-xl bg-card">
      <div>
        <h1 className="text-2xl font-bold font-heading">Título da Página</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Subtítulo ou descrição da seção.</p>
      </div>
      <Button>
        <Plus className="h-4 w-4" />Ação principal
      </Button>
    </div>
  )
}

function FilterChipsExample() {
  const [active, setActive] = useState("todos")
  const opts = ["todos", "draft", "publicado", "encerrado"]
  return (
    <div className="flex flex-wrap gap-2">
      {opts.map((opt) => (
        <button
          key={opt}
          onClick={() => setActive(opt)}
          className={[
            "px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize",
            active === opt
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:border-foreground/30",
          ].join(" ")}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function FormCardExample() {
  return (
    <div className="rounded-2xl border bg-card p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">Pesquisa de Satisfação</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Atualizado há 2 dias</p>
        </div>
        <Badge variant="secondary" className="ml-2 shrink-0">draft</Badge>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><FileText className="h-3 w-3" />8 perguntas</span>
        <span className="flex items-center gap-1"><Users className="h-3 w-3" />42 respostas</span>
        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />120 views</span>
      </div>
    </div>
  )
}

// ─── Sidebar nav ───────────────────────────────────────────────────────────

const NAV = [
  { id: "cores", label: "Cores" },
  { id: "tipografia", label: "Tipografia" },
  { id: "espacamento", label: "Espaçamento" },
  { id: "sombras", label: "Sombras" },
  { id: "componentes", label: "Componentes" },
  { id: "padroes", label: "Padrões" },
  { id: "icones", label: "Ícones" },
]

// ─── Main ──────────────────────────────────────────────────────────────────

export function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="h-6 w-6 rounded-md bg-primary" />
          <div>
            <span className="font-bold text-sm font-heading">formularios.ia</span>
            <span className="text-muted-foreground text-sm"> · Design System</span>
          </div>
          <Badge variant="outline" className="ml-auto text-xs">v1.0</Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 flex gap-10 py-10">
        {/* Sidebar */}
        <nav className="hidden md:flex flex-col gap-1 w-44 shrink-0 sticky top-24 self-start">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Conteúdo</p>
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* ── Intro ──────────────────────────────────────────────── */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold font-heading mb-2">Design System</h1>
            <p className="text-muted-foreground">
              Referência completa dos tokens, componentes e padrões utilizados no formularios.ia.
              Baseado em <strong>shadcn/ui</strong> + <strong>Tailwind CSS</strong> com temas via CSS custom properties.
            </p>
          </div>

          {/* ── Cores ──────────────────────────────────────────────── */}
          <Section id="cores" title="Cores">
            <SubSection title="Tokens semânticos">
              <p className="text-sm text-muted-foreground mb-4">
                Todas as cores são definidas via CSS custom properties em HSL. O dark mode inverte os valores automaticamente via classe <code className="text-xs bg-muted px-1 py-0.5 rounded">.dark</code>.
              </p>
              <div className="rounded-xl border bg-card divide-y overflow-hidden">
                {semanticColors.map((c) => (
                  <TokenRow key={c.name} name={c.name} value={c.value} cls={c.cls} />
                ))}
              </div>
            </SubSection>

            <SubSection title="Chart colors (visualizações)">
              <div className="rounded-xl border bg-card divide-y overflow-hidden">
                {chartColors.map((c) => (
                  <TokenRow key={c.name} name={c.name} value={c.value} cls={c.cls} />
                ))}
              </div>
            </SubSection>

            <SubSection title="Cores nomeadas (uso pontual)">
              <p className="text-sm text-muted-foreground mb-3">
                Usadas apenas para status e estados específicos que não têm token semântico equivalente.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "green-500", cls: "bg-green-500" },
                  { label: "green-50", cls: "bg-green-50 border" },
                  { label: "emerald-400", cls: "bg-emerald-400" },
                  { label: "red-500", cls: "bg-red-500" },
                  { label: "amber-400", cls: "bg-amber-400" },
                  { label: "violet-500", cls: "bg-violet-500" },
                  { label: "slate-400", cls: "bg-slate-400" },
                ].map((c) => (
                  <div key={c.label} className="flex flex-col items-center gap-1">
                    <div className={`h-10 w-10 rounded-lg ${c.cls}`} />
                    <span className="text-xs text-muted-foreground font-mono">{c.label}</span>
                  </div>
                ))}
              </div>
            </SubSection>
          </Section>

          {/* ── Tipografia ─────────────────────────────────────────── */}
          <Section id="tipografia" title="Tipografia">
            <SubSection title="Famílias tipográficas">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border bg-card p-5">
                  <p className="text-xs text-muted-foreground mb-2 font-mono">font-sans (var(--font-sans))</p>
                  <p className="text-2xl font-sans">Inter</p>
                  <p className="text-sm text-muted-foreground mt-1">Corpo de texto, labels, inputs, descrições</p>
                  <p className="text-base mt-3 font-sans">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br/>abcdefghijklmnopqrstuvwxyz<br/>0123456789</p>
                </div>
                <div className="rounded-xl border bg-card p-5">
                  <p className="text-xs text-muted-foreground mb-2 font-mono">font-heading (var(--font-jakarta))</p>
                  <p className="text-2xl font-heading">Plus Jakarta Sans</p>
                  <p className="text-sm text-muted-foreground mt-1">Títulos, headings, hero sections</p>
                  <p className="text-base mt-3 font-heading">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br/>abcdefghijklmnopqrstuvwxyz<br/>0123456789</p>
                </div>
              </div>
            </SubSection>

            <SubSection title="Escala de tamanhos">
              <div className="rounded-xl border bg-card divide-y overflow-hidden">
                {typeSizes.map(({ label, cls, size }) => (
                  <div key={label} className="flex items-center gap-4 px-5 py-3">
                    <code className="text-xs font-mono text-muted-foreground w-20 shrink-0">{label}</code>
                    <span className="text-xs text-muted-foreground w-12 shrink-0">{size}</span>
                    <span className={`${cls} leading-tight`}>O formulário foi enviado com sucesso.</span>
                  </div>
                ))}
              </div>
            </SubSection>

            <SubSection title="Pesos">
              <div className="rounded-xl border bg-card divide-y overflow-hidden">
                {[
                  { label: "font-medium", weight: "500", cls: "font-medium" },
                  { label: "font-semibold", weight: "600", cls: "font-semibold" },
                  { label: "font-bold", weight: "700", cls: "font-bold" },
                ].map(({ label, weight, cls }) => (
                  <div key={label} className="flex items-center gap-4 px-5 py-3">
                    <code className="text-xs font-mono text-muted-foreground w-32 shrink-0">{label}</code>
                    <span className="text-xs text-muted-foreground w-8 shrink-0">{weight}</span>
                    <span className={`text-base ${cls}`}>Pesquisa de satisfação do cliente</span>
                  </div>
                ))}
              </div>
            </SubSection>
          </Section>

          {/* ── Espaçamento ────────────────────────────────────────── */}
          <Section id="espacamento" title="Espaçamento & Raio">
            <SubSection title="Escala de gap/padding (mais usados)">
              <div className="rounded-xl border bg-card overflow-hidden">
                {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                  <div key={n} className="flex items-center gap-4 px-5 py-3 border-b last:border-0">
                    <code className="text-xs font-mono text-muted-foreground w-16 shrink-0">gap-{n} / p-{n}</code>
                    <span className="text-xs text-muted-foreground w-12 shrink-0">{n * 4}px</span>
                    <div className="flex items-center gap-1">
                      <div className="h-4 bg-primary/20 rounded" style={{ width: n * 4 }} />
                      <div className="h-4 bg-primary rounded w-8" />
                    </div>
                  </div>
                ))}
              </div>
            </SubSection>

            <SubSection title="Border radius">
              <div className="flex flex-wrap gap-6 items-end">
                {[
                  { label: "rounded-sm", cls: "rounded-sm", px: "2px" },
                  { label: "rounded-md", cls: "rounded-md", px: "6px" },
                  { label: "rounded-lg", cls: "rounded-lg", px: "8px" },
                  { label: "rounded-xl", cls: "rounded-xl", px: "12px" },
                  { label: "rounded-2xl", cls: "rounded-2xl", px: "16px" },
                  { label: "rounded-full", cls: "rounded-full", px: "9999px" },
                ].map(({ label, cls, px }) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <div className={`h-12 w-12 bg-primary/20 border border-primary/30 ${cls}`} />
                    <span className="text-xs font-mono text-muted-foreground">{label}</span>
                    <span className="text-xs text-muted-foreground">{px}</span>
                  </div>
                ))}
              </div>
            </SubSection>
          </Section>

          {/* ── Sombras ────────────────────────────────────────────── */}
          <Section id="sombras" title="Sombras">
            <div className="flex flex-wrap gap-6 items-end">
              {[
                { label: "shadow-sm", cls: "shadow-sm" },
                { label: "shadow-md", cls: "shadow-md" },
                { label: "shadow-lg", cls: "shadow-lg" },
                { label: "shadow-xl", cls: "shadow-xl" },
              ].map(({ label, cls }) => (
                <div key={label} className="flex flex-col items-center gap-3">
                  <div className={`h-16 w-24 bg-card border rounded-xl ${cls}`} />
                  <code className="text-xs font-mono text-muted-foreground">{label}</code>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Componentes ────────────────────────────────────────── */}
          <Section id="componentes" title="Componentes Base">

            <SubSection title="Button — variantes">
              <div className="flex flex-wrap gap-3 p-5 rounded-xl border bg-card">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </SubSection>

            <SubSection title="Button — tamanhos">
              <div className="flex flex-wrap gap-3 items-center p-5 rounded-xl border bg-card">
                <Button size="lg">Large</Button>
                <Button size="default">Default</Button>
                <Button size="sm">Small</Button>
                <Button size="icon"><Star className="h-4 w-4" /></Button>
              </div>
            </SubSection>

            <SubSection title="Button — com ícone">
              <div className="flex flex-wrap gap-3 p-5 rounded-xl border bg-card">
                <Button><Plus className="h-4 w-4" />Criar formulário</Button>
                <Button variant="outline"><Download className="h-4 w-4" />Exportar CSV</Button>
                <Button variant="secondary"><Copy className="h-4 w-4" />Duplicar</Button>
                <Button variant="destructive"><Trash2 className="h-4 w-4" />Excluir</Button>
              </div>
            </SubSection>

            <SubSection title="Badge — variantes">
              <div className="flex flex-wrap gap-3 p-5 rounded-xl border bg-card">
                <Badge variant="default">default</Badge>
                <Badge variant="secondary">secondary</Badge>
                <Badge variant="outline">outline</Badge>
                <Badge variant="destructive">destructive</Badge>
              </div>
            </SubSection>

            <SubSection title="Badge — uso contextual">
              <div className="flex flex-wrap gap-3 p-5 rounded-xl border bg-card">
                <Badge variant="outline" className="text-green-600 border-green-300">publicado</Badge>
                <Badge variant="secondary">draft</Badge>
                <Badge variant="outline" className="text-muted-foreground">encerrado</Badge>
                <Badge variant="destructive">erro</Badge>
              </div>
            </SubSection>

            <SubSection title="Input">
              <div className="flex flex-col gap-3 max-w-sm p-5 rounded-xl border bg-card">
                <Input placeholder="Placeholder padrão" />
                <Input defaultValue="Com valor preenchido" />
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Com ícone à esquerda" />
                </div>
                <Input disabled placeholder="Desabilitado" />
              </div>
            </SubSection>

            <SubSection title="Switch">
              <div className="flex flex-col gap-3 p-5 rounded-xl border bg-card">
                <div className="flex items-center gap-3">
                  <Switch id="s1" />
                  <label htmlFor="s1" className="text-sm">Desabilitado (padrão off)</label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch id="s2" defaultChecked />
                  <label htmlFor="s2" className="text-sm">Habilitado (padrão on)</label>
                </div>
              </div>
            </SubSection>

            <SubSection title="Progress">
              <div className="flex flex-col gap-4 p-5 rounded-xl border bg-card max-w-sm">
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>25%</span><span>Respostas usadas</span>
                  </div>
                  <Progress value={25} />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>60%</span><span>Quota de formulários</span>
                  </div>
                  <Progress value={60} />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>95%</span><span>Limite atingindo</span>
                  </div>
                  <Progress value={95} />
                </div>
              </div>
            </SubSection>

            <SubSection title="Tabs">
              <div className="p-5 rounded-xl border bg-card">
                <Tabs defaultValue="respostas">
                  <TabsList>
                    <TabsTrigger value="respostas">Respostas</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="config">Configurações</TabsTrigger>
                  </TabsList>
                  <TabsContent value="respostas" className="mt-4 text-sm text-muted-foreground">
                    Conteúdo da aba Respostas.
                  </TabsContent>
                  <TabsContent value="analytics" className="mt-4 text-sm text-muted-foreground">
                    Conteúdo da aba Analytics.
                  </TabsContent>
                  <TabsContent value="config" className="mt-4 text-sm text-muted-foreground">
                    Conteúdo da aba Configurações.
                  </TabsContent>
                </Tabs>
              </div>
            </SubSection>

            <SubSection title="Avatar">
              <div className="flex gap-4 items-end p-5 rounded-xl border bg-card">
                {["SM", "MD", "LG"].map((size, i) => (
                  <div key={size} className="flex flex-col items-center gap-2">
                    <Avatar className={i === 0 ? "h-8 w-8" : i === 1 ? "h-10 w-10" : "h-12 w-12"}>
                      <AvatarFallback className="text-xs">DS</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{size}</span>
                  </div>
                ))}
              </div>
            </SubSection>

            <SubSection title="Separator">
              <div className="p-5 rounded-xl border bg-card space-y-4">
                <p className="text-sm">Conteúdo acima</p>
                <Separator />
                <p className="text-sm">Conteúdo abaixo</p>
              </div>
            </SubSection>
          </Section>

          {/* ── Padrões ────────────────────────────────────────────── */}
          <Section id="padroes" title="Padrões de Layout">

            <SubSection title="Stat Card">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCardExample icon={Users} label="Respostas" value="1.284" sub="+12 hoje" color="text-muted-foreground" />
                <StatCardExample icon={Eye} label="Views" value="4.320" sub="últimos 30 dias" color="text-muted-foreground" />
                <StatCardExample icon={TrendingUp} label="Conclusão" value="87%" sub="acima da média" color="text-green-600" />
                <StatCardExample icon={BarChart2} label="Formulários" value="3 / 5" sub="2 disponíveis" color="text-muted-foreground" />
              </div>
            </SubSection>

            <SubSection title="Form Card">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormCardExample />
                <FormCardExample />
              </div>
            </SubSection>

            <SubSection title="Empty State">
              <EmptyStateExample />
            </SubSection>

            <SubSection title="Page Header">
              <PageHeaderExample />
            </SubSection>

            <SubSection title="Filter Chips">
              <div className="p-5 rounded-xl border bg-card">
                <FilterChipsExample />
              </div>
            </SubSection>

            <SubSection title="Alert / Feedback banners">
              <div className="flex flex-col gap-3">
                {[
                  { icon: CheckCircle2, color: "text-green-700", bg: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800", label: "Sucesso", msg: "Formulário publicado com sucesso." },
                  { icon: AlertTriangle, color: "text-amber-700", bg: "bg-amber-50 border-amber-200", label: "Atenção", msg: "Você está próximo do limite de respostas." },
                  { icon: Info, color: "text-blue-700", bg: "bg-blue-50 border-blue-200", label: "Info", msg: "Novas respostas são processadas em tempo real." },
                  { icon: Zap, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20", label: "Erro", msg: "Falha ao salvar. Verifique sua conexão." },
                ].map(({ icon: Icon, color, bg, label, msg }) => (
                  <div key={label} className={`flex items-start gap-3 rounded-lg border p-4 ${bg}`}>
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                    <div>
                      <p className={`text-sm font-semibold ${color}`}>{label}</p>
                      <p className="text-sm mt-0.5">{msg}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SubSection>
          </Section>

          {/* ── Ícones ─────────────────────────────────────────────── */}
          <Section id="icones" title="Ícones">
            <p className="text-sm text-muted-foreground mb-4">
              Todos os ícones são do <strong>lucide-react</strong>. Tamanho padrão: <code className="text-xs bg-muted px-1 py-0.5 rounded">h-4 w-4</code> (16px). Dentro de botões icon: <code className="text-xs bg-muted px-1 py-0.5 rounded">h-5 w-5</code>.
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 p-5 rounded-xl border bg-card">
              {[
                { icon: Bell, name: "Bell" },
                { icon: Settings, name: "Settings" },
                { icon: Users, name: "Users" },
                { icon: FileText, name: "FileText" },
                { icon: BarChart2, name: "BarChart2" },
                { icon: TrendingUp, name: "TrendingUp" },
                { icon: Eye, name: "Eye" },
                { icon: Download, name: "Download" },
                { icon: Plus, name: "Plus" },
                { icon: Search, name: "Search" },
                { icon: Trash2, name: "Trash2" },
                { icon: Copy, name: "Copy" },
                { icon: Star, name: "Star" },
                { icon: CheckCircle2, name: "CheckCircle2" },
                { icon: AlertTriangle, name: "AlertTriangle" },
                { icon: Info, name: "Info" },
              ].map(({ icon: Icon, name }) => (
                <div key={name} className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground text-center leading-tight">{name}</span>
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>
    </div>
  )
}
