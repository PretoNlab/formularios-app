import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import {
  Sparkles, ArrowRight, Zap, BarChart3, Globe, MessageCircle,
  CheckCircle2, Star, ChevronRight, MousePointer2, Shield, Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
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
          <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Recursos</Link>
          <Link href="#how" className="text-muted-foreground hover:text-foreground transition-colors">Como funciona</Link>
          <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Preços</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="rounded-full px-5">Começar grátis</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#ede9fe_100%)]" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 -z-10 h-[600px] w-[600px] rounded-full bg-violet-100/60 blur-3xl" />

      <div className="container flex flex-col items-center text-center pt-24 pb-20 gap-8">
        <Badge variant="secondary" className="rounded-full px-4 py-1.5 text-sm gap-1.5">
          <Zap className="h-3.5 w-3.5 text-violet-600" />
          Formulários inteligentes para o Brasil
        </Badge>

        <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl leading-[1.1]">
          Formulários que{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600">
            convertem
          </span>
          .<br />Dados que{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
            inspiram
          </span>
          .
        </h1>

        <p className="max-w-2xl text-xl text-muted-foreground leading-relaxed">
          Crie formulários bonitos em minutos, colete respostas e descubra insights com IA.
          A alternativa brasileira ao Typeform, com analytics avançado, lógica condicional e muito mais.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="rounded-full px-8 text-base h-12 gap-2">
              Começar grátis
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="rounded-full px-8 text-base h-12">
              Ver demonstração
            </Button>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground">
          Grátis para sempre · Sem cartão de crédito · Setup em 2 minutos
        </p>

        {/* Mock UI */}
        <div className="relative w-full max-w-5xl mt-8">
          <div className="rounded-2xl border bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <div className="mx-auto text-xs text-muted-foreground font-mono">formularios.ia/f/pesquisa-nps</div>
            </div>
            <div className="grid grid-cols-5 min-h-[340px]">
              {/* Sidebar preview */}
              <div className="col-span-1 border-r bg-muted/20 p-3 space-y-1 hidden md:block">
                {["Boas-vindas", "Nome", "E-mail", "NPS", "Detalhar", "Obrigado"].map((item, i) => (
                  <div key={item} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${i === 3 ? "bg-violet-100 text-violet-700 font-medium" : "text-muted-foreground"}`}>
                    <span className="w-4 text-center">{i + 1}</span>
                    {item}
                  </div>
                ))}
              </div>
              {/* Form preview */}
              <div className="col-span-5 md:col-span-4 flex items-center justify-center p-8 bg-[#0f0f1a]">
                <div className="w-full max-w-sm space-y-6 text-white">
                  <div className="space-y-2">
                    <p className="text-xs text-violet-400 font-medium tracking-wider uppercase">Pergunta 4 de 5</p>
                    <h3 className="text-2xl font-bold">
                      De 0 a 10, qual a probabilidade de você recomendar nossa empresa a um amigo?
                    </h3>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {Array.from({ length: 11 }, (_, i) => (
                      <button
                        key={i}
                        className={`h-10 w-10 rounded-lg text-sm font-medium transition-colors ${i === 9 ? "bg-violet-600 text-white" : "bg-white/10 text-white/70 hover:bg-white/20"}`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/40">
                    <span>Improvável</span>
                    <span>Muito provável</span>
                  </div>
                  <button className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors">
                    OK <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Floating cards */}
          <div className="absolute -right-4 top-8 hidden lg:block">
            <div className="rounded-xl border bg-card shadow-lg px-4 py-3 text-sm w-48">
              <div className="flex items-center gap-2 text-green-600 font-medium mb-1">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                127 respostas hoje
              </div>
              <div className="text-xs text-muted-foreground">Taxa de conclusão: 84%</div>
            </div>
          </div>
          <div className="absolute -left-4 bottom-8 hidden lg:block">
            <div className="rounded-xl border bg-card shadow-lg px-4 py-3 text-sm w-44">
              <div className="font-semibold mb-1">NPS Score</div>
              <div className="text-3xl font-bold text-violet-600">72</div>
              <div className="text-xs text-muted-foreground">↑ 8 pts este mês</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: MousePointer2,
    title: "19 tipos de campo",
    description: "Texto, NPS, escala, múltipla escolha, upload de arquivo, assinatura e muito mais. Tudo que você precisa num só lugar.",
    color: "text-violet-600",
    bg: "bg-violet-50",
    comingSoon: false,
  },
  {
    icon: MessageCircle,
    title: "WhatsApp nativo",
    description: "Envie notificações automáticas no WhatsApp quando alguém preencher seu formulário. Integração com Evolution API.",
    color: "text-green-600",
    bg: "bg-green-50",
    comingSoon: true,
  },
  {
    icon: BarChart3,
    title: "Analytics com IA",
    description: "Descubra padrões nas respostas automaticamente. Dashboard de conversão, tempo médio e muito mais.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Zap,
    title: "Lógica condicional",
    description: "Mostre ou oculte perguntas com base nas respostas anteriores. Crie fluxos personalizados sem código.",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: Globe,
    title: "Temas e customização",
    description: "8 temas profissionais prontos ou crie o seu. Fontes, cores e gradientes para combinar com a sua marca.",
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
  {
    icon: Shield,
    title: "LGPD compliant",
    description: "Dados armazenados no Brasil, criptografia em trânsito e em repouso, conformidade com a LGPD.",
    color: "text-slate-600",
    bg: "bg-slate-50",
  },
]

function Features() {
  return (
    <section id="features" className="py-24 container">
      <div className="text-center mb-16">
        <Badge variant="secondary" className="rounded-full mb-4">Recursos</Badge>
        <h2 className="text-4xl font-bold tracking-tight mb-4">
          Tudo que você precisa,<br />nada que você não precisa
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Construído para times de produto e marketing que valorizam dados de qualidade.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((f) => (
          <div key={f.title} className="relative rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow">
            {f.comingSoon && (
              <span className="absolute top-4 right-4 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Em breve
              </span>
            )}
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${f.bg} mb-4`}>
              <f.icon className={`h-5 w-5 ${f.color}`} />
            </div>
            <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: "01",
    title: "Crie seu formulário",
    description: "Escolha um template ou comece do zero. Arraste e solte os campos, configure a lógica e personalize o visual em minutos.",
  },
  {
    number: "02",
    title: "Compartilhe o link",
    description: "Copie o link e envie por WhatsApp, e-mail, ou incorpore no seu site. Seu formulário funciona perfeitamente em qualquer dispositivo.",
  },
  {
    number: "03",
    title: "Analise os dados",
    description: "Acompanhe as respostas em tempo real. Exporte para CSV, conecte com seu CRM ou receba notificações automáticas.",
  },
]

function HowItWorks() {
  return (
    <section id="how" className="py-24 bg-muted/30">
      <div className="container">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="rounded-full mb-4">Como funciona</Badge>
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            De zero a dados em 3 passos
          </h2>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            Setup rápido, resultados imediatos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          {STEPS.map((step, i) => (
            <div key={step.number} className="relative flex flex-col items-center text-center gap-4">
              <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-foreground text-background text-2xl font-bold shadow-lg">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: "Ana Lima",
    role: "Head de Produto · Fintech",
    text: "Migramos do Typeform e a taxa de conclusão dos nossos formulários subiu 23%. A lógica condicional é muito mais intuitiva.",
    stars: 5,
  },
  {
    name: "Carlos Mendes",
    role: "Growth · SaaS B2B",
    text: "O Analytics com IA nos ajudou a descobrir que 40% dos leads abandonavam na pergunta de empresa. Corrigimos e a conversão dobrou.",
    stars: 5,
  },
  {
    name: "Fernanda Costa",
    role: "CX Manager · E-commerce",
    text: "A exportação de respostas em CSV salvou horas de trabalho manual toda semana. Agora minha equipe analisa os dados diretamente no Excel.",
    stars: 5,
  },
]

function Testimonials() {
  return (
    <section className="py-24 container">
      <div className="text-center mb-16">
        <Badge variant="secondary" className="rounded-full mb-4">Depoimentos</Badge>
        <h2 className="text-4xl font-bold tracking-tight mb-4">
          Quem usa, recomenda
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="rounded-2xl border bg-card p-6 space-y-4">
            <div className="flex gap-0.5">
              {Array.from({ length: t.stars }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
            <div>
              <p className="font-semibold text-sm">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "para sempre",
    description: "Para começar e experimentar.",
    features: [
      "Formulários ilimitados",
      "Até 10 perguntas por form",
      "100 respostas / mês",
      "19 tipos de campo",
      "Analytics básico",
      "Link público compartilhável",
    ],
    cta: "Começar grátis",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Pro",
    price: "R$ 49",
    period: "por mês",
    description: "Para times que levam dados a sério.",
    features: [
      "Tudo do Gratuito",
      "Perguntas ilimitadas",
      "Respostas ilimitadas",
      "Analytics com IA",
      "Lógica condicional avançada",
      "Webhooks (Zapier, Make, n8n)",
      "WhatsApp (em breve)",
      "Remoção do branding",
      "Exportação CSV / JSON",
      "Suporte prioritário",
    ],
    cta: "Assinar Pro",
    href: "/signup?plan=pro",
    highlight: true,
  },
  {
    name: "Business",
    price: "R$ 149",
    period: "por mês",
    description: "Para empresas com múltiplos times.",
    features: [
      "Tudo do Pro",
      "Múltiplos workspaces",
      "Colaboração em equipe",
      "SSO / SAML",
      "SLA de uptime 99.9%",
      "Onboarding dedicado",
      "Faturamento em nota fiscal",
    ],
    cta: "Falar com vendas",
    href: "mailto:contato@formularios.ia",
    highlight: false,
  },
]

function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="container">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="rounded-full mb-4">Preços</Badge>
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Simples, transparente, justo
          </h2>
          <p className="text-xl text-muted-foreground">
            Sem surpresas. Cancele quando quiser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 flex flex-col gap-6 ${plan.highlight
                  ? "bg-foreground text-background border-foreground shadow-2xl scale-105"
                  : "bg-card"
                }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-violet-600 text-white rounded-full px-4">Mais popular</Badge>
                </div>
              )}

              <div>
                <p className={`text-sm font-medium mb-1 ${plan.highlight ? "text-background/60" : "text-muted-foreground"}`}>
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? "text-background/60" : "text-muted-foreground"}`}>
                    /{plan.period}
                  </span>
                </div>
                <p className={`text-sm mt-2 ${plan.highlight ? "text-background/70" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-2.5 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${plan.highlight ? "text-violet-400" : "text-green-500"}`} />
                    <span className={plan.highlight ? "text-background/80" : ""}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href}>
                <Button
                  className={`w-full rounded-full ${plan.highlight
                      ? "bg-white text-foreground hover:bg-white/90"
                      : ""
                    }`}
                  variant={plan.highlight ? "outline" : "default"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="py-24 container">
      <div className="relative rounded-3xl bg-foreground text-background overflow-hidden p-12 md:p-20 text-center">
        <div className="absolute inset-0 -z-10 [background:radial-gradient(ellipse_at_top,#4c1d95,transparent_60%)]" />
        <Layers className="h-12 w-12 mx-auto mb-6 text-violet-400" />
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          Comece a coletar dados<br />que realmente importam
        </h2>
        <p className="text-xl text-background/70 mb-10 max-w-xl mx-auto">
          Junte-se a centenas de times brasileiros que já usam o formularios.ia para tomar decisões melhores.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="rounded-full px-10 h-12 text-base bg-white text-foreground hover:bg-white/90">
              Criar conta grátis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <p className="text-sm text-background/40 mt-6">
          Grátis para sempre · Sem cartão de crédito
        </p>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t py-12">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="flex bg-foreground text-background items-center justify-center p-1 rounded-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm">formularios.ia</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <Link href="/login" className="hover:text-foreground transition-colors">Entrar</Link>
          <Link href="/signup" className="hover:text-foreground transition-colors">Criar conta</Link>
          <Link href="#pricing" className="hover:text-foreground transition-colors">Preços</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Termos</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacidade</Link>
        </div>

        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} formularios.ia
        </p>
      </div>
    </footer>
  )
}
