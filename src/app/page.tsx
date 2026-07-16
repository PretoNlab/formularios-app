import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import {
  Sparkles, ArrowRight, CheckCircle2, ChevronDown, ChevronRight,
  MessageCircle, Brain, Palette, ShieldCheck, Upload, Layers,
  FileText, BarChart3, Globe, Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "formularios.ia — Formulários profissionais, do jeito brasileiro",
  description: "Crie formulários com a sua marca, valide CPF, CNPJ e WhatsApp e descubra insights com IA. Em português, com dados no Brasil, LGPD por padrão — e grátis pra começar.",
  openGraph: {
    title: "formularios.ia — Formulários profissionais, do jeito brasileiro",
    description: "Formulários com a sua marca, campos brasileiros e IA. Grátis pra começar, dados no Brasil.",
    url: "https://formularios.ia.br",
    siteName: "formularios.ia",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "formularios.ia — Formulários profissionais, do jeito brasileiro",
    description: "Formulários com a sua marca, WhatsApp e IA. Grátis pra começar.",
  },
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Nav />
      <Hero />
      <ProofBar />
      <Problem />
      <Solution />
      <HowItWorks />
      <Templates />
      <Migration />
      <Pricing />
      <FAQ />
      <FounderNote />
      <FinalCTA />
      <Footer />
    </div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex bg-foreground text-background items-center justify-center p-1 rounded-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">formularios.ia</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="#recursos" className="text-muted-foreground hover:text-foreground transition-colors">Recursos</Link>
          <Link href="#templates" className="text-muted-foreground hover:text-foreground transition-colors">Templates</Link>
          <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Preços</Link>
          <Link href="/vs/google-forms" className="text-muted-foreground hover:text-foreground transition-colors">vs Google Forms</Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="rounded-full px-4 sm:px-5 bg-foreground text-background hover:bg-foreground/90 font-bold">
              Criar grátis
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative">
      <div className="container flex flex-col items-center text-center pt-24 pb-16 gap-8">
        <Badge variant="secondary" className="rounded-full px-4 py-1.5 text-sm gap-2 font-medium text-muted-foreground">
          🇧🇷 Feito no Brasil · LGPD · Grátis pra começar
        </Badge>

        <h1 className="max-w-4xl text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] font-headline">
          Formulários profissionais,<br />
          <span className="text-violet-600">do jeito brasileiro.</span>
        </h1>

        <p className="max-w-2xl text-xl text-muted-foreground leading-relaxed">
          Crie formulários com a sua marca, valide CPF, CNPJ e WhatsApp de verdade e descubra insights com IA. Em português, com seus dados no Brasil — e grátis pra começar.
        </p>

        <div className="flex flex-col items-center gap-3">
          <Link href="/signup">
            <Button size="lg" className="rounded-full px-10 text-base h-14 gap-2 bg-foreground text-background hover:bg-foreground/90 font-bold shadow-lg transition-transform hover:scale-[1.02]">
              Criar formulário grátis
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground">
            Sem cartão de crédito · Pronto em 2 minutos
          </p>
        </div>

        {/* Product preview */}
        <div className="relative w-full max-w-4xl mt-10">
          <div className="rounded-3xl border bg-card shadow-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/30">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <div className="mx-auto text-xs text-muted-foreground font-mono">formularios.ia/f/pesquisa-de-clientes</div>
            </div>
            <div className="flex items-center justify-center p-10 md:p-16 bg-background">
              <div className="w-full max-w-md space-y-8 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pergunta 3 de 5</span>
                  <div className="w-28 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="w-[60%] h-full bg-violet-600" />
                  </div>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold font-headline leading-tight">
                  Qual o seu WhatsApp pra gente te enviar a proposta?
                </h3>
                <div className="rounded-2xl border-2 border-violet-600/30 bg-violet-50/50 px-5 py-4 flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-green-600 shrink-0" />
                  <span className="text-lg font-medium text-foreground/70 tracking-wide">(11) 9 8765-43__</span>
                  <span className="ml-auto text-[10px] font-bold text-violet-600 uppercase tracking-wider">máscara automática</span>
                </div>
                <Button className="bg-violet-600 hover:bg-violet-700 text-white px-10 rounded-full font-bold h-12 shadow-md">
                  OK
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Proof Bar ────────────────────────────────────────────────────────────────

function ProofBar() {
  const items = [
    { icon: Globe, label: "Dados hospedados no Brasil" },
    { icon: ShieldCheck, label: "LGPD por padrão" },
    { icon: MessageCircle, label: "Suporte em português" },
    { icon: Zap, label: "24 tipos de campo" },
  ]
  return (
    <section className="border-y bg-muted/30">
      <div className="container py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-center gap-2.5 text-sm font-medium text-muted-foreground">
            <item.icon className="h-4 w-4 text-violet-600 shrink-0" />
            {item.label}
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Problem ──────────────────────────────────────────────────────────────────

const PAINS = [
  {
    title: "Cara de improviso.",
    description: "Cabeçalho roxo do Google, fonte padrão, zero marca sua. Quem recebe percebe — e leva menos a sério.",
    icon: Palette,
  },
  {
    title: "Você não vê quem desistiu.",
    description: "Alguém abriu, respondeu metade e fechou? O Google Forms não te conta. Você só vê quem terminou — e perde todo o resto.",
    icon: BarChart3,
  },
  {
    title: "O Brasil não existe lá.",
    description: "Sem CPF ou CNPJ validado, sem WhatsApp formatado, sem aviso de resposta no celular. Você cola gambiarra com planilha e extensão.",
    icon: FileText,
  },
]

function Problem() {
  return (
    <section className="py-24 container">
      <div className="max-w-3xl mx-auto text-center mb-14">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-headline mb-4">
          Seu Google Forms está te<br />custando respostas.
        </h2>
        <p className="text-xl text-muted-foreground">
          Ele é grátis e quebra um galho. Mas tem um preço escondido:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PAINS.map((pain) => (
          <div key={pain.title} className="rounded-2xl border bg-card p-8">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted mb-5">
              <pain.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg mb-2">{pain.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{pain.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Solution ─────────────────────────────────────────────────────────────────

function Solution() {
  return (
    <section id="recursos" className="py-24 bg-muted/30">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-headline">
            Troque em 1 clique.<br />Ganhe tudo isso.
          </h2>
        </div>

        <div className="space-y-24 max-w-5xl mx-auto">
          {/* Bloco A — Marca */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50">
                <Palette className="h-5 w-5 text-pink-600" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold font-headline">Formulários com a sua cara.</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Suba seu logo, defina suas cores e fontes uma vez no Brand Kit — todo formulário novo já nasce com a sua identidade. Formato conversacional, uma pergunta por vez, que prende a atenção até o fim.
              </p>
            </div>
            <div className="rounded-2xl border bg-card shadow-sm p-8">
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-violet-600 flex items-center justify-center text-white text-xs font-bold">SM</div>
                  <div>
                    <div className="h-2.5 w-28 rounded-full bg-foreground/80" />
                    <div className="h-2 w-20 rounded-full bg-muted mt-1.5" />
                  </div>
                </div>
                <div className="rounded-xl bg-violet-50 border border-violet-100 p-5 space-y-3">
                  <div className="h-2.5 w-3/4 rounded-full bg-violet-200" />
                  <div className="h-2.5 w-1/2 rounded-full bg-violet-200" />
                  <div className="flex gap-2 pt-1">
                    <div className="h-8 w-20 rounded-full bg-violet-600" />
                    <div className="h-8 w-20 rounded-full bg-white border border-violet-200" />
                  </div>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Seu logo · Suas cores · Sua fonte</p>
              </div>
            </div>
          </div>

          {/* Bloco B — Brasil */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4 md:order-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold font-headline">CPF, CNPJ e WhatsApp nativos.</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Campos com máscara e validação de verdade — chega de "digite seu CPF" em campo de texto livre. Seus leads chegam com telefone formatado, prontos pra você chamar no WhatsApp.
              </p>
              <Badge variant="secondary" className="rounded-full text-xs">Notificação por WhatsApp: em breve</Badge>
            </div>
            <div className="rounded-2xl border bg-card shadow-sm p-8 md:order-1 space-y-4">
              <div className="rounded-xl border px-4 py-3.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">CPF</p>
                <p className="font-mono text-sm">123.456.789-__</p>
              </div>
              <div className="rounded-xl border px-4 py-3.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">CNPJ</p>
                <p className="font-mono text-sm">12.345.678/0001-__</p>
              </div>
              <div className="rounded-xl border-2 border-green-200 bg-green-50/50 px-4 py-3.5">
                <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1">WhatsApp</p>
                <p className="font-mono text-sm">(11) 9 8765-43__</p>
              </div>
            </div>
          </div>

          {/* Bloco C — Analytics */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Brain className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold font-headline">Cada resposta conta. Até as incompletas.</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Veja pergunta por pergunta onde as pessoas abandonam. Respostas parciais ficam salvas. E a IA lê centenas de respostas abertas por você e resume os temas em segundos.
              </p>
            </div>
            <div className="rounded-2xl border bg-card shadow-sm p-8 space-y-3">
              {[
                { label: "1. Nome", pct: 100 },
                { label: "2. E-mail", pct: 92 },
                { label: "3. WhatsApp", pct: 87 },
                { label: "4. Orçamento", pct: 61 },
                { label: "5. Detalhes", pct: 58 },
              ].map((row) => (
                <div key={row.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{row.label}</span>
                    <span className={row.pct < 70 ? "text-red-500 font-bold" : "text-muted-foreground"}>{row.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${row.pct < 70 ? "bg-red-400" : "bg-violet-600"}`}
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center pt-2">
                31% abandonam na pergunta de orçamento ↑
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: "01",
    title: "Crie ou importe.",
    description: "Comece de um template, do zero, ou importe seu Google Forms em 1 clique.",
  },
  {
    number: "02",
    title: "Deixe com a sua cara.",
    description: "Aplique seu Brand Kit, ajuste o tema, ative a lógica condicional se precisar.",
  },
  {
    number: "03",
    title: "Compartilhe e acompanhe.",
    description: "Mande o link por WhatsApp, incorpore no site e veja as respostas chegarem em tempo real.",
  },
]

function HowItWorks() {
  return (
    <section className="py-24 container">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-headline">
          Do zero ao link em 3 passos.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
        <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        {STEPS.map((step) => (
          <div key={step.number} className="relative flex flex-col items-center text-center gap-4">
            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-foreground text-background text-2xl font-bold shadow-lg">
              {step.number}
            </div>
            <h3 className="text-xl font-semibold">{step.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Templates ────────────────────────────────────────────────────────────────

const TEMPLATE_HIGHLIGHTS = [
  { title: "Captura de leads", emoji: "🎯" },
  { title: "NPS — Net Promoter Score", emoji: "📊" },
  { title: "Inscrição em evento", emoji: "🎟️" },
  { title: "Solicitação de orçamento", emoji: "💰" },
  { title: "Pesquisa de satisfação", emoji: "⭐" },
  { title: "Feedback de produto", emoji: "💬" },
  { title: "Pesquisa de mercado", emoji: "🔍" },
  { title: "Formulário de contato", emoji: "✉️" },
]

function Templates() {
  return (
    <section id="templates" className="py-24 bg-muted/30">
      <div className="container">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-headline mb-4">
            Comece com um template pronto.
          </h2>
          <p className="text-xl text-muted-foreground">
            Feitos pra quem vive de captar leads, vender e ouvir a audiência.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {TEMPLATE_HIGHLIGHTS.map((t) => (
            <Link
              key={t.title}
              href="/signup"
              className="group rounded-2xl border bg-card p-6 text-center hover:border-violet-300 hover:shadow-md transition-all"
            >
              <span className="text-3xl block mb-3">{t.emoji}</span>
              <span className="text-sm font-semibold group-hover:text-violet-600 transition-colors">{t.title}</span>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/signup">
            <Button variant="outline" className="rounded-full gap-1 font-semibold">
              Ver todos os templates <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Migration ────────────────────────────────────────────────────────────────

function Migration() {
  return (
    <section className="py-16 container">
      <div className="max-w-4xl mx-auto rounded-3xl border bg-violet-600/5 border-violet-600/20 p-8 md:p-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-violet-600 font-bold text-sm uppercase tracking-wider">
              <Upload className="h-4 w-4" />
              Migração em 1 clique
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold font-headline">Vem do Google Forms?</h2>
            <p className="text-muted-foreground max-w-md">
              Cole o link do seu formulário e importe tudo em 30 segundos — perguntas, opções e ordem.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <Link href="/signup">
              <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-bold px-8 h-12 w-full">
                Importar meu Google Forms
              </Button>
            </Link>
            <Link href="/vs/google-forms" className="text-center text-sm font-medium text-violet-600 hover:underline">
              Ver comparação completa →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-headline mb-4">
            Comece grátis.<br />Evolua quando fizer sentido.
          </h2>
          <p className="text-xl text-muted-foreground">
            Sem assinatura mensal. Sem surpresa na fatura.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Grátis */}
          <div className="rounded-2xl border bg-card p-8 flex flex-col gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Grátis</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">R$ 0</span>
                <span className="text-sm text-muted-foreground">/ pra sempre</span>
              </div>
              <p className="text-sm mt-2 text-muted-foreground">
                Pra criar seus primeiros formulários e sentir a diferença.
              </p>
            </div>
            <ul className="space-y-2.5 flex-1 text-sm">
              {[
                "Até 3 formulários publicados",
                "Rascunhos ilimitados",
                "50 respostas pra testar",
                "Todos os 24 tipos de campo (CPF e CNPJ incluídos)",
                "Formato conversacional",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/signup">
              <Button className="w-full rounded-full font-semibold" variant="outline">
                Criar conta grátis
              </Button>
            </Link>
          </div>

          {/* Lote Fundador */}
          <div className="relative rounded-2xl border p-8 flex flex-col gap-6 bg-foreground text-background border-foreground shadow-2xl">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-violet-600 text-white rounded-full px-4">Só 50 vagas</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-background/60 mb-1">Lote Fundador</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">R$ 499</span>
                <span className="text-sm text-background/60">/ 12 meses</span>
              </div>
              <p className="text-sm mt-2 text-background/70">
                Pagamento único via Pix. Pra quem já vive de formulário — depois vira assinatura normal, mais cara.
              </p>
            </div>
            <ul className="space-y-2.5 flex-1 text-sm">
              {[
                "Até 10 formulários publicados",
                "2.500 respostas por ano",
                "Lógica condicional avançada",
                "Análise com IA",
                "Webhooks e integrações",
                "Suporte por e-mail em português",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-background/80">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-violet-400" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/signup?plan=founder">
              <Button className="w-full rounded-full bg-white text-foreground hover:bg-white/90 font-bold">
                Garantir vaga de fundador
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Sem renovação automática. Exporte seus dados quando quiser.
        </p>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: "O que é o formularios.ia?",
    answer: "É uma plataforma de criação de formulários conversacionais — exibe uma pergunta por vez, como uma conversa. Diferente de planilhas de campos, o formato aumenta a taxa de conclusão e a qualidade das respostas."
  },
  {
    question: "Posso trazer meu formulário do Google Forms?",
    answer: "Sim — cole a URL no importador e a estrutura inteira (perguntas, opções, ordem, obrigatoriedade) é recriada em segundos. Você também pode importar de CSV ou JSON."
  },
  {
    question: "Preciso instalar alguma coisa?",
    answer: "Não. A plataforma roda inteiramente no navegador. Não há extensão, plugin ou app para instalar."
  },
  {
    question: "O que acontece quando publico um formulário?",
    answer: "O formulário fica acessível publicamente pela URL formularios.ia/f/seu-slug. Respostas começam a ser aceitas imediatamente."
  },
  {
    question: "O que são respostas parciais?",
    answer: "São respostas de usuários que começaram a preencher o formulário mas não chegaram até o fim. Cada pergunta respondida é salva no banco à medida que o usuário avança — mesmo que ele feche o navegador."
  },
  {
    question: "Por quanto tempo as respostas ficam disponíveis?",
    answer: "Indefinidamente, enquanto sua conta estiver ativa. E você pode exportá-las para CSV ou JSON a qualquer momento."
  },
  {
    question: "Como ofereço um arquivo ou PDF ao respondente?",
    answer: "No builder, basta preencher o campo 'Arquivo para download' ou fazer upload do seu arquivo. Um botão de download aparecerá automaticamente na tela de conclusão do formulário."
  },
  {
    question: "Posso incorporar o formulário no meu site?",
    answer: "Sim. No Builder, clique em Compartilhar e copie o código iframe gerado automaticamente. Cole em qualquer site, landing page ou portal — o formulário funciona perfeitamente embedado, sem configuração extra."
  },
  {
    question: "Os dados dos respondentes são vendidos ou compartilhados?",
    answer: "Não. Seus dados e os dados dos seus respondentes pertencem exclusivamente a você. Não vendemos dados em hipótese alguma."
  },
  {
    question: "O formularios.ia é compatível com a LGPD?",
    answer: "Sim. A plataforma foi desenvolvida com boas práticas de privacidade: IPs anonimizados, dados armazenados em servidores no Brasil com criptografia e controle total do criador sobre seus dados."
  }
]

function FAQ() {
  return (
    <section id="faq" className="py-24 container max-w-4xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-headline mb-4">
          Ficou com alguma dúvida?
        </h2>
      </div>

      <div className="space-y-4">
        {FAQ_ITEMS.map((item, i) => (
          <details key={i} className="group rounded-2xl border bg-card/50 p-6 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between font-semibold text-lg">
              {item.question}
              <span className="ml-4 shrink-0 transition-transform duration-200 group-open:rotate-180">
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </span>
            </summary>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}

// ─── Founder Note ─────────────────────────────────────────────────────────────

function FounderNote() {
  return (
    <section className="py-16 container">
      <div className="max-w-2xl mx-auto rounded-3xl border bg-card p-8 md:p-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 shrink-0 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
            DM
          </div>
          <div>
            <p className="font-bold leading-tight">Diego Machado</p>
            <p className="text-sm text-muted-foreground">Fundador do formularios.ia</p>
          </div>
        </div>
        <p className="text-lg leading-relaxed text-foreground/90">
          Eu vivia trocando de ferramenta de formulário. O Google Forms fazia o trabalho, mas parecia amador — sem a minha marca, sem WhatsApp, sem eu saber onde as pessoas desistiam. O Typeform resolvia o visual, mas cobrava em dólar e não falava a língua de quem eu atendia.
        </p>
        <p className="text-lg leading-relaxed text-foreground/90 mt-4">
          Criei o formularios.ia pra ser a ferramenta que eu mesmo queria usar: bonita, em português, com WhatsApp de verdade — e grátis pra começar.
        </p>
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="py-24 container">
      <div className="relative rounded-3xl bg-foreground text-background overflow-hidden p-8 sm:p-12 md:p-20 text-center">
        <Layers className="h-12 w-12 mx-auto mb-6 text-violet-400" />
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 font-headline">
          Seu próximo formulário pode ser<br />o melhor que você já fez.
        </h2>
        <p className="text-xl text-background/70 mb-10 max-w-xl mx-auto">
          Grátis, em português, pronto em 2 minutos.
        </p>
        <Link href="/signup">
          <Button size="lg" className="rounded-full px-10 h-14 text-base bg-white text-foreground hover:bg-white/90 font-bold">
            Criar formulário grátis
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <p className="text-sm text-background/40 mt-6">
          Sem cartão · Seus dados são seus · Exporte quando quiser
        </p>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

const FOOTER_COLUMNS = [
  {
    title: "Produto",
    links: [
      { label: "Recursos", href: "#recursos" },
      { label: "Preços", href: "#pricing" },
      { label: "Criar conta", href: "/signup" },
      { label: "Entrar", href: "/login" },
    ],
  },
  {
    title: "Compare",
    links: [
      { label: "vs Google Forms", href: "/vs/google-forms" },
    ],
  },
  {
    title: "Recursos",
    links: [
      { label: "Templates", href: "#templates" },
      { label: "Central de ajuda", href: "/help" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Termos", href: "/terms" },
      { label: "Privacidade", href: "/privacy" },
    ],
  },
]

function Footer() {
  return (
    <footer className="border-t py-16">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-2xl md:text-3xl font-bold font-headline tracking-tight leading-snug">
            Google Forms é grátis.<br />A impressão que ele passa, não.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex bg-foreground text-background items-center justify-center p-1 rounded-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-bold text-sm">formularios.ia</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Formulários profissionais, do jeito brasileiro.
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t mt-12 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} formularios.ia
          </p>
        </div>
      </div>
    </footer>
  )
}
