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
      <LogoCloud />
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
    <div className="absolute top-0 left-0 right-0 z-50 p-4 sm:p-6">
      <header className="mx-auto max-w-6xl w-full rounded-full bg-white px-6 py-4 flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center gap-2 text-[#254f1a]">
          <Sparkles className="h-6 w-6" />
          <span className="font-bold text-xl tracking-tight">formularios.ia</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#254f1a]/80">
          <Link href="#features" className="hover:text-[#254f1a] transition-colors">Recursos</Link>
          <Link href="#how" className="hover:text-[#254f1a] transition-colors">Templates</Link>
          <Link href="#pricing" className="hover:text-[#254f1a] transition-colors">Preços</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-[#254f1a] hover:bg-black/5 font-semibold">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button className="rounded-full bg-[#254f1a] hover:bg-[#1a3a12] text-white px-6 font-semibold">
              Sign up free
            </Button>
          </Link>
        </div>
      </header>
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#d2e823] pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6">
      <div className="container max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Text & CTA */}
          <div className="flex flex-col gap-6 max-w-2xl mt-8">
            <h1 className="text-6xl sm:text-7xl lg:text-[6rem] font-black tracking-[-0.04em] text-[#254f1a] leading-[0.95]">
              Um form feito pra você.
            </h1>
            <p className="text-lg sm:text-xl text-[#254f1a]/80 font-medium leading-relaxed max-w-lg">
              Junte-se a milhares de pessoas usando formularios.ia para coletar dados, 
              pesquisas e leads. Tudo que você cria, curte e vende a partir do Instagram, TikTok, Twitter e YouTube.
            </p>
            
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex w-full max-w-md items-center rounded-lg bg-white p-2 focus-within:ring-2 focus-within:ring-[#254f1a]">
                <span className="pl-4 text-muted-foreground font-medium">form.ia/</span>
                <input 
                  type="text" 
                  placeholder="sua-marca" 
                  className="flex-1 bg-transparent px-2 py-3 text-black outline-none w-full placeholder:text-muted-foreground/50"
                />
              </div>
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto rounded-full bg-[#254f1a] hover:bg-[#1a3a12] text-white h-[60px] px-8 text-base font-semibold">
                  Get started for free
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Imagery mockups */}
          <div className="relative h-[600px] lg:h-[700px] w-full flex items-center justify-center">
             <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg z-10">
                <div className="grid grid-rows-2 gap-6 h-full">
                  <div className="rounded-[48px] bg-[#a97148] shadow-2xl relative overflow-hidden flex items-end justify-center pb-8 border-4 border-black/5">
                    {/* Fake phone mockup content */}
                    <div className="w-[280px] h-[580px] bg-[#d9a05b] rounded-[38px] shadow-2xl border-8 border-[#eccd93] relative flex flex-col items-center p-6 top-16">
                      <div className="w-1/3 h-5 bg-[#eccd93] rounded-full absolute top-0 -translate-y-1/2"></div>
                      <h2 className="text-[#643415] font-black text-4xl mb-4 text-center leading-tight mt-6" style={{ fontFamily: "serif" }}>
                        Perfect<br/>Person
                      </h2>
                      <div className="w-full space-y-3 mt-4">
                        <div className="bg-[#f0d8a8] h-12 rounded-xl w-full flex items-center px-4 shadow-sm">
                          <div className="h-4 w-4 bg-[#643415] rounded-full mr-3"></div>
                          <div className="h-2 w-24 bg-[#643415]/50 rounded-full"></div>
                        </div>
                        <div className="bg-[#f0d8a8] h-12 rounded-xl w-full flex items-center px-4 shadow-sm">
                          <div className="h-4 w-4 bg-[#643415] rounded-full mr-3"></div>
                          <div className="h-2 w-32 bg-[#643415]/50 rounded-full"></div>
                        </div>
                        <div className="bg-[#643415] h-32 rounded-xl w-full mt-4 flex items-center justify-center relative overflow-hidden">
                          <div className="w-12 h-12 rounded-full border-4 border-[#f0d8a8] flex items-center justify-center">
                             <div className="w-0 h-0 border-t-6 border-b-6 border-l-8 border-t-transparent border-b-transparent border-l-[#f0d8a8] ml-1"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[40px] bg-[#2a44c5] shadow-2xl relative overflow-hidden hidden sm:block">
                     {/* Blue styled bottom block */}
                     <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(0,0,0,0.5) 10px, rgba(0,0,0,0.5) 20px)' }}></div>
                  </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  )
}

// ─── Logo Cloud ───────────────────────────────────────────────────────────────

function LogoCloud() {
  const companies = ["Nubank", "iFood", "Hotmart", "RD Station", "Conta Azul", "Pipefy", "Gympass", "Loft"]
  return (
    <section className="border-y bg-muted/30 py-10">
      <div className="container">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Usado por times de produto e marketing das melhores empresas brasileiras
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {companies.map((name) => (
            <span key={name} className="text-lg font-bold text-muted-foreground/40 tracking-tight">{name}</span>
          ))}
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
  },
  {
    icon: MessageCircle,
    title: "WhatsApp nativo",
    description: "Envie notificações automáticas no WhatsApp quando alguém preencher seu formulário. Integração com Evolution API.",
    color: "text-green-600",
    bg: "bg-green-50",
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
          <div key={f.title} className="rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow">
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
    text: "A integração com WhatsApp é um diferencial enorme. Agora recebo notificação em tempo real quando um cliente preenche o NPS.",
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
      "WhatsApp + Webhooks",
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
