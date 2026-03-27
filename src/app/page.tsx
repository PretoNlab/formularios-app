import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import {
  Sparkles, ArrowRight, Zap, BarChart3, Globe, MessageCircle,
  CheckCircle2, Star, ChevronRight, MousePointer2, Shield, Layers,
  Target, Download, ChevronDown, LayoutTemplate, Code2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "formularios.ia — Formulários inteligentes para o Brasil",
  description: "Crie formulários conversacionais, colete respostas e descubra insights com IA. Analytics avançado, lógica condicional, integração com WhatsApp e muito mais — feito para o Brasil.",
  openGraph: {
    title: "formularios.ia — Formulários inteligentes para o Brasil",
    description: "Crie formulários conversacionais e descubra insights com IA.",
    url: "https://formularios.ia.br",
    siteName: "formularios.ia",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "formularios.ia — Formulários inteligentes para o Brasil",
    description: "Formulários conversacionais com analytics e IA para o mercado brasileiro.",
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
      <Features />
      <HowItWorks />
      <FounderOffer />
      <Testimonials />
      <Pricing />
      <ComparisonTable />
      <FAQ />
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
          <Link href="#comparativo" className="text-muted-foreground hover:text-foreground transition-colors">Comparativo</Link>
          <Link href="/settings/brand-kit" className="text-muted-foreground hover:text-foreground transition-colors">Brand Kit</Link>
          <Link href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="rounded-full px-5 bg-foreground text-background hover:bg-foreground/90 font-bold">Garantir minha vaga</Button>
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
        <Badge variant="secondary" className="rounded-full px-4 py-1.5 text-sm gap-1.5 border-violet-600/10 text-violet-600 font-bold uppercase tracking-wider">
          <Zap className="h-3.5 w-3.5 fill-violet-600" />
          Plano Fundador Aberto
        </Badge>

        <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl leading-[1.1] font-headline">
          Formulários que{" "}
          <span className="text-violet-600">
            convertem
          </span>
          .<br />Dados que{" "}
          <span className="text-violet-600 italic">
            inspiram
          </span>
          .
        </h1>

        <p className="max-w-2xl text-xl text-muted-foreground leading-relaxed">
          Pague 1 vez e use por 12 meses. Crie formulários, publique, colete respostas e use a plataforma ao longo do ano sem cobrança recorrente.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/signup?plan=founder">
            <Button size="lg" className="rounded-full px-10 text-base h-14 gap-2 bg-foreground text-background hover:bg-foreground/90 font-bold shadow-xl shadow-foreground/10 transition-transform hover:scale-[1.02]">
              Garantir minha vaga
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground">
          Lote Fundador disponível para apenas 50 usuários · Setup em 2 minutos
        </p>

        {/* Mock UI */}
        <div className="relative w-full max-w-5xl mt-8">
          <div className="rounded-[2.5rem] border bg-card shadow-2xl overflow-hidden ring-1 ring-border/50">
            <div className="flex items-center gap-2 px-6 py-4 border-b bg-muted/30">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <div className="mx-auto text-xs text-muted-foreground font-mono">formularios.ia/f/pesquisa-nps</div>
            </div>
            <div className="grid grid-cols-12 min-h-[400px]">
              {/* Sidebar preview */}
              <div className="col-span-3 border-r bg-muted/10 p-6 space-y-2 hidden md:block">
                {["Boas-vindas", "Nome", "E-mail", "NPS", "Detalhar", "Obrigado"].map((item, i) => (
                  <div key={item} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${i === 3 ? "bg-violet-600/10 text-violet-700 font-bold" : "text-muted-foreground opacity-60"}`}>
                    <span className="w-5 text-center font-mono text-xs">{i + 1}</span>
                    {item}
                  </div>
                ))}
              </div>
              {/* Form preview */}
              <div className="col-span-12 md:col-span-9 flex items-center justify-center p-8 md:p-16 text-foreground">
                <div className="w-full max-w-md space-y-10">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Pergunta 4 de 5</span>
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="w-[80%] h-full bg-violet-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold font-headline leading-tight">
                    Qual a probabilidade de você recomendar nosso serviço a um amigo?
                  </h3>
                  <div className="grid grid-cols-6 sm:grid-cols-11 gap-2">
                    {Array.from({ length: 11 }, (_, i) => (
                      <div
                        key={i}
                        className={`aspect-square border flex items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${i === 9 ? "bg-violet-600/10 border-violet-600 text-violet-600 ring-2 ring-violet-600/20" : "hover:bg-violet-600 hover:text-white border-border"}`}
                      >
                        {i}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Pouco provável</span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Muito provável</span>
                  </div>
                  <Button className="bg-violet-600 text-white px-12 py-6 rounded-full font-bold h-12 shadow-lg shadow-violet-600/20">
                    OK
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {/* Floating cards */}
          <div className="absolute -right-8 top-12 hidden lg:block translate-x-4">
            <div className="rounded-2xl border bg-card shadow-xl px-6 py-4 text-sm w-56 backdrop-blur-sm bg-card/95">
              <div className="flex items-center gap-2 text-green-600 font-bold mb-1">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                127 respostas hoje
              </div>
              <div className="text-xs text-muted-foreground font-medium">Taxa de conclusão: 84%</div>
            </div>
          </div>
          <div className="absolute -left-8 bottom-12 hidden lg:block -translate-x-4">
            <div className="rounded-2xl border bg-card shadow-xl px-6 py-4 text-sm w-48 backdrop-blur-sm bg-card/95">
              <div className="font-bold mb-1 uppercase text-[10px] text-muted-foreground tracking-widest">NPS Score</div>
              <div className="text-4xl font-extrabold text-violet-600 font-headline">72</div>
              <div className="text-xs text-green-600 font-bold mt-1">↑ 8 pts este mês</div>
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
    title: "24 tipos de campo",
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
    description: "8 temas prontos, Brand Kit do workspace e personalização total de cores, fontes e logo para combinar com a sua marca.",
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
  {
    icon: Target,
    title: "Captura de respostas parciais",
    description: "Saiba onde seus respondentes abandonam, pergunta por pergunta. Perfeito para times de produto e growth.",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    icon: Download,
    title: "Lead magnet nativo",
    description: "Entregue PDFs ou arquivos automaticamente ao final do form. Um diferencial real para captação de leads.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: LayoutTemplate,
    title: "Templates prontos",
    description: "Mais de 10 modelos organizados por categoria — NPS, feedback, cadastro, RH, vendas e mais. Comece em segundos.",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: Code2,
    title: "Incorpore no seu site",
    description: "Gere o código iframe com um clique e cole em qualquer site, landing page ou portal. Sem configuração extra.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
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
    description: "Escolha entre mais de 10 templates prontos ou comece do zero. Arraste e solte os campos, configure a lógica e personalize o visual em minutos.",
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
    text: "Após trocar de plataforma, a taxa de conclusão dos nossos formulários subiu 23%. A lógica condicional é muito mais intuitiva e o suporte em português faz toda a diferença.",
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
    description: "Para experimentar a plataforma sem compromisso.",
    features: [
      "Até 3 formulários publicados",
      "Rascunhos ilimitados",
      "50 respostas para testar",
      "24 tipos de campo",
      "Analytics básico",
      "Link público compartilhável",
    ],
    cta: "Começar grátis",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Lote Fundador",
    price: "R$ 499",
    period: "por 12 meses",
    description: "Pagamento único via Pix. Sem renovação automática.",
    features: [
      "Até 10 formulários publicados",
      "Rascunhos ilimitados",
      "Até 2.500 respostas por ano",
      "Lógica condicional",
      "Temas e customização",
      "Exportação CSV / JSON",
      "Webhooks e integrações",
      "Suporte por e-mail",
    ],
    cta: "Garantir minha vaga",
    href: "/signup?plan=founder",
    highlight: true,
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
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

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: "O que é o formularios.ia?",
    answer: "É uma plataforma de criação de formulários conversacionais — exibe uma pergunta por vez, como uma conversa. Diferente de planilhas de campos, o formato aumenta a taxa de conclusão e a qualidade das respostas."
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
        <Badge variant="secondary" className="rounded-full mb-4">Perguntas Frequentes</Badge>
        <h2 className="text-4xl font-bold tracking-tight mb-4">
          Ficou com alguma dúvida?
        </h2>
        <p className="text-xl text-muted-foreground">
          As respostas para as perguntas mais comuns sobre o formularios.ia.
        </p>
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
          Comece grátis · Sem cartão de crédito · Ao continuar, você concorda com nossos <Link href="/terms" className="underline hover:text-white">Termos</Link> e <Link href="/privacy" className="underline hover:text-white">Privacidade</Link>
        </p>
      </div>
    </section>
  )
}

// ─── Founder Offer ────────────────────────────────────────────────────────────

function FounderOffer() {
  return (
    <section className="py-24 bg-foreground text-background overflow-hidden">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-extrabold font-headline leading-tight text-white">
              Um modelo diferente da maioria das ferramentas
            </h2>
            <p className="text-xl text-background/70 leading-relaxed">
              Chega de ser refém de assinaturas recorrentes para ter o básico funcionando.
            </p>
            <div className="bg-violet-600/20 border border-violet-600/30 p-8 rounded-3xl">
              <p className="text-2xl font-bold font-headline leading-snug">
                O grande diferencial: <span className="text-violet-400">você paga R$ 499 uma vez e usa por 12 meses.</span>
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="bg-background rounded-[2.5rem] p-10 shadow-2xl text-foreground relative overflow-hidden">
              <div className="absolute top-6 right-6 bg-violet-600 text-white text-[10px] font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest animate-pulse">
                Lote Fundador
              </div>
              <div className="mb-8">
                <p className="text-5xl font-extrabold font-headline text-violet-600">R$ 499</p>
                <p className="text-muted-foreground font-medium">por 12 meses de acesso</p>
              </div>
              <ul className="space-y-4 mb-10">
                {[
                  "Até 10 formulários publicados",
                  "Rascunhos ilimitados",
                  "Até 2.500 respostas por ano",
                  "Personalização básica de temas",
                  "Exportação completa de respostas",
                  "Suporte padrão por e-mail",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 font-medium text-sm">
                    <CheckCircle2 className="h-5 w-5 text-violet-600 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup?plan=founder">
                <Button className="w-full bg-foreground text-background py-7 rounded-full font-extrabold text-lg transition-transform hover:scale-[1.02]">
                  Quero entrar no lote fundador
                </Button>
              </Link>
              <p className="text-center mt-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Pagamento único via Pix
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Comparison Table ─────────────────────────────────────────────────────────

function ComparisonTable() {
  const features = [
    { name: "Modelo de Cobrança", ia: "Pagamento único anual", respondi: "Assinatura mensal/anual", typeform: "Assinatura mensal/anual" },
    { name: "Preço Base", ia: "R$ 499/ano", respondi: "R$ 147/mês", typeform: "US$ 50-83/mês" },
    { name: "Funcionalidades", ia: "Essenciais completas", respondi: "Suíte robusta", typeform: "Operações globais" },
    { name: "Ideal para", ia: "Simplicidade e previsibilidade", respondi: "Times de marketing", typeform: "Enterprise e Global" },
  ]

  return (
    <section id="comparativo" className="py-24 container">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-extrabold font-headline">Compare pelo que importa</h2>
          <p className="text-lg text-muted-foreground">
            Transparência total para você decidir o que faz sentido para o seu momento.
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border bg-card/50">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-6 text-left text-sm font-bold text-muted-foreground uppercase tracking-widest">Recurso</th>
                <th className="p-6 text-center bg-violet-600/5">
                  <span className="text-violet-600 font-extrabold font-headline">formularios.ia</span>
                </th>
                <th className="p-6 text-center text-muted-foreground font-bold">Respondi</th>
                <th className="p-6 text-center text-muted-foreground font-bold">Typeform</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {features.map((f, i) => (
                <tr key={f.name} className={i !== features.length - 1 ? "border-b" : ""}>
                  <td className="p-6 font-medium">{f.name}</td>
                  <td className={`p-6 text-center bg-violet-600/5 font-bold text-violet-600 ${i === features.length - 1 ? "rounded-b-3xl" : ""}`}>
                    {f.ia}
                  </td>
                  <td className="p-6 text-center text-muted-foreground">{f.respondi}</td>
                  <td className="p-6 text-center text-muted-foreground">{f.typeform}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
