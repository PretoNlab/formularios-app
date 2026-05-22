import type { Metadata } from "next"
import Link from "next/link"
import {
  Sparkles, ArrowRight, CheckCircle2, X, Star, ChevronDown,
  MessageCircle, Brain, Palette, GitBranch, Lock, Globe,
  Upload, Zap, FileText, BarChart3, Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Alternativa ao Google Forms em português | formularios.ia",
  description:
    "Cansou das limitações do Google Forms? Conheça a alternativa brasileira: formulários conversacionais, lógica avançada, WhatsApp, IA, Brand Kit e import direto do Google Forms em 1 clique.",
  alternates: { canonical: "/vs/google-forms" },
  openGraph: {
    title: "Alternativa ao Google Forms em português | formularios.ia",
    description:
      "A alternativa brasileira ao Google Forms. Formulários conversacionais com IA, WhatsApp e import direto do seu form em segundos.",
    url: "https://formularios.ia.br/vs/google-forms",
    siteName: "formularios.ia",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alternativa ao Google Forms em português | formularios.ia",
    description: "Migre do Google Forms em 1 clique. Mais recursos, feito pro Brasil.",
  },
}

const FAQ_ITEMS = [
  {
    question: "Posso migrar meu Google Forms para o formularios.ia?",
    answer:
      "Sim, em 1 clique. Cole a URL do seu Google Forms no nosso importador e a estrutura completa (perguntas, opções, ordem, obrigatoriedade) é recriada automaticamente. Suas respostas anteriores permanecem no Google — você só traz o formulário em si.",
  },
  {
    question: "O Google Forms é grátis. Por que migrar?",
    answer:
      "O nosso plano gratuito também é. A diferença é o que você ganha: formulários conversacionais (uma pergunta por vez, aumenta conclusão em 20-40%), lógica condicional avançada, Brand Kit do workspace, campos WhatsApp/CPF/CNPJ nativos, exportação rica e (em breve) integração com WhatsApp para notificações automáticas. Google Forms continua bom para enquetes simples — mas trava rápido em qualquer caso de uso profissional.",
  },
  {
    question: "Os dados ficam no Brasil?",
    answer:
      "Sim. Servidores no Brasil, conformidade com LGPD, IPs anonimizados por padrão. Dados de respondentes pertencem exclusivamente a você e não são vendidos ou compartilhados.",
  },
  {
    question: "Funciona em celular?",
    answer:
      "Sim. Todos os formulários são responsivos e otimizados para mobile. Como muita gente acessa seu formulário pelo WhatsApp, isso é prioridade absoluta.",
  },
  {
    question: "Posso incorporar no meu site, como faço no Google Forms?",
    answer:
      "Sim. Clique em Compartilhar no Builder e copie o código iframe — cola em qualquer site, landing page ou portal. Sem perda de design, sem o cabeçalho azul do Google Forms.",
  },
  {
    question: "E se eu quiser voltar pro Google Forms?",
    answer:
      "Sem amarras. Você pode exportar todas as suas respostas em CSV ou JSON a qualquer momento. Seus dados são seus.",
  },
  {
    question: "Quanto custa o plano pago?",
    answer:
      "R$ 499 por 12 meses (pagamento único via Pix, sem renovação automática). Inclui até 10 formulários publicados, 2.500 respostas/ano, lógica condicional, temas, exportação e integrações. É o lote fundador — depois o preço sobe.",
  },
]

export default function GoogleFormsAlternativePage() {
  // JSON-LD para SEO (FAQ + comparação de produtos)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  }
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "formularios.ia",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "499",
      priceCurrency: "BRL",
      description: "Lote Fundador — pagamento único por 12 meses de acesso",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "127",
    },
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <Nav />
      <Hero />
      <TldrSection />
      <ComparisonTable />
      <KillerFeatures />
      <MigrationSection />
      <UseCases />
      <PricingCallout />
      <FAQ items={FAQ_ITEMS} />
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
          <Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">Recursos</Link>
          <Link href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Preços</Link>
          <Link href="/templates" className="text-muted-foreground hover:text-foreground transition-colors">Templates</Link>
          <Link href="/#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="rounded-full px-4 sm:px-5 bg-foreground text-background hover:bg-foreground/90 font-bold">
              <span className="sm:hidden">Criar conta</span>
              <span className="hidden sm:inline">Criar conta grátis</span>
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
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#ede9fe_100%)]" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 -z-10 h-[600px] w-[600px] rounded-full bg-violet-100/60 blur-3xl" />

      <div className="container flex flex-col items-center text-center pt-24 pb-16 gap-8">
        <Badge variant="secondary" className="rounded-full px-4 py-1.5 text-sm gap-1.5 border-violet-600/10 text-violet-600 font-bold uppercase tracking-wider">
          <Zap className="h-3.5 w-3.5 fill-violet-600" />
          Comparação detalhada
        </Badge>

        <h1 className="max-w-4xl text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] font-headline">
          A alternativa{" "}
          <span className="text-violet-600">brasileira</span>{" "}
          ao Google Forms.
        </h1>

        <p className="max-w-2xl text-xl text-muted-foreground leading-relaxed">
          Google Forms é ótimo pra começar — mas trava rápido. Importe seu formulário em 1 clique e desbloqueie lógica condicional avançada, Brand Kit, WhatsApp, IA e formato conversacional que aumenta a conclusão em até 40%.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="rounded-full px-10 text-base h-14 gap-2 bg-foreground text-background hover:bg-foreground/90 font-bold shadow-xl shadow-foreground/10 transition-transform hover:scale-[1.02]">
              Migrar do Google Forms grátis
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="#comparativo">
            <Button variant="ghost" size="lg" className="rounded-full text-base h-14 gap-2">
              Ver comparação completa
            </Button>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground">
          Plano gratuito · Sem cartão · Migração em 30 segundos
        </p>
      </div>
    </section>
  )
}

// ─── TL;DR ────────────────────────────────────────────────────────────────────

function TldrSection() {
  return (
    <section className="py-16 container">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="rounded-full mb-4">Resumo honesto</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Quando ficar no Google Forms — e quando migrar
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border bg-card p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-slate-600" />
              </div>
              <h3 className="font-bold text-lg">Fique no Google Forms se…</h3>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="text-muted-foreground">•</span>Você cria 1 ou 2 enquetes simples por ano.</li>
              <li className="flex gap-2"><span className="text-muted-foreground">•</span>Não precisa de design ou identidade visual no formulário.</li>
              <li className="flex gap-2"><span className="text-muted-foreground">•</span>Suas perguntas não dependem de respostas anteriores.</li>
              <li className="flex gap-2"><span className="text-muted-foreground">•</span>Seus respondentes não vão se importar com cabeçalho do Google Forms.</li>
              <li className="flex gap-2"><span className="text-muted-foreground">•</span>Você não precisa de CPF, CNPJ, WhatsApp formatado ou validações brasileiras.</li>
            </ul>
          </div>

          <div className="rounded-2xl border-2 border-violet-600 bg-violet-600/5 p-8 space-y-4 relative">
            <div className="absolute -top-3 left-8">
              <Badge className="bg-violet-600 text-white rounded-full px-4">Você está aqui →</Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-violet-600" />
              </div>
              <h3 className="font-bold text-lg">Migre pra formularios.ia se…</h3>
            </div>
            <ul className="space-y-3 text-sm text-foreground">
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />Coleta leads, faz NPS, recebe inscrições ou faz pesquisas que importam.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />Quer um formulário com a sua marca, não com cabeçalho azul do Google.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />Precisa de lógica condicional de verdade (não só "ir para seção X").</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />Quer notificação no WhatsApp quando alguém responde.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />Trabalha com público brasileiro e precisa de CPF/CNPJ válidos.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />Quer entender por que as pessoas abandonam o formulário.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Comparison Table ─────────────────────────────────────────────────────────

function ComparisonTable() {
  type FeatureRow =
    | { type: "section"; label: string }
    | { type: "row"; name: string; us: string | boolean; them: string | boolean; highlight?: boolean }

  const features: FeatureRow[] = [
    { type: "section", label: "🎨 Design e marca" },
    { type: "row", name: "Personalização visual (cores, fontes, logo)", us: "Brand Kit completo", them: "Limitado a 4 cabeçalhos", highlight: true },
    { type: "row", name: "Sem logo/marca da plataforma no formulário", us: "Plano pago", them: "Nunca (sempre tem Google Forms)" },
    { type: "row", name: "Formato conversacional (uma pergunta por vez)", us: true, them: false, highlight: true },
    { type: "row", name: "Temas prontos profissionais", us: "8 temas", them: "11 cabeçalhos genéricos" },

    { type: "section", label: "🧠 Lógica e fluxos" },
    { type: "row", name: "Lógica condicional avançada (mostrar/ocultar perguntas)", us: true, them: "Apenas pular seções", highlight: true },
    { type: "row", name: "Cálculos e variáveis em runtime", us: true, them: false },
    { type: "row", name: "Tela de boas-vindas e conclusão customizáveis", us: true, them: "Texto simples" },
    { type: "row", name: "Lead magnet (entregar PDF/arquivo no final)", us: true, them: false, highlight: true },

    { type: "section", label: "🇧🇷 Feito para o Brasil" },
    { type: "row", name: "Interface e suporte em português", us: true, them: "Inglês traduzido" },
    { type: "row", name: "Campo CPF com validação", us: true, them: false, highlight: true },
    { type: "row", name: "Campo CNPJ com validação", us: true, them: false, highlight: true },
    { type: "row", name: "Campo WhatsApp com máscara brasileira", us: true, them: false, highlight: true },
    { type: "row", name: "Conformidade LGPD com dados no Brasil", us: true, them: "Dados nos EUA" },
    { type: "row", name: "Notificação no WhatsApp quando recebe resposta", us: "Em breve", them: false, highlight: true },

    { type: "section", label: "📊 Análise de dados" },
    { type: "row", name: "Analytics de conversão por pergunta", us: true, them: false, highlight: true },
    { type: "row", name: "Respostas parciais (sabe onde abandonaram)", us: true, them: false, highlight: true },
    { type: "row", name: "Análise com IA (clusters, sentimentos, padrões)", us: true, them: false, highlight: true },
    { type: "row", name: "Exportação CSV / JSON", us: true, them: "Só CSV" },
    { type: "row", name: "Integração com Google Sheets", us: true, them: true },

    { type: "section", label: "🔌 Integrações" },
    { type: "row", name: "Webhooks", us: true, them: "Add-ons pagos" },
    { type: "row", name: "Notificação por e-mail customizada", us: true, them: "Notificação fixa do Google" },
    { type: "row", name: "Iframe embed sem cabeçalho do Google", us: true, them: false },
    { type: "row", name: "Import do Google Forms em 1 clique", us: true, them: "—" },

    { type: "section", label: "💰 Preço" },
    { type: "row", name: "Plano gratuito real", us: "3 forms publicados", them: "Sem limite (mas trava em recursos)" },
    { type: "row", name: "Plano pago em Real", us: "R$ 499/ano (pago 1x)", them: "Workspace inteiro (R$ 100+/mês/usuário)" },
  ]

  function Cell({ val, ours }: { val: string | boolean; ours?: boolean }) {
    if (val === true) return <span className={`text-lg font-bold ${ours ? "text-violet-600" : "text-green-500"}`}>✓</span>
    if (val === false) return <span className="text-red-400 inline-flex"><X className="h-4 w-4" /></span>
    return <span className="text-xs sm:text-sm">{val}</span>
  }

  return (
    <section id="comparativo" className="py-24 container">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="secondary" className="rounded-full mb-2">Comparativo recurso por recurso</Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold font-headline">
            Google Forms vs formularios.ia
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Comparação honesta. Onde o Google Forms ganha (preço e familiaridade), reconhecemos. Onde perde, mostramos o porquê.
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border bg-card/50">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-4 md:p-6 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest min-w-[180px]">Recurso</th>
                <th className="p-4 md:p-6 text-center bg-violet-600/5 min-w-[160px]">
                  <span className="text-violet-600 font-extrabold font-headline text-sm md:text-base">formularios.ia</span>
                  <div className="mt-1">
                    <span className="inline-block bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Recomendado</span>
                  </div>
                </th>
                <th className="p-4 md:p-6 text-center text-muted-foreground font-bold min-w-[160px]">Google Forms</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => {
                if (f.type === "section") {
                  return (
                    <tr key={`section-${i}`} className="border-b border-t bg-muted/30">
                      <td colSpan={3} className="px-4 md:px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {f.label}
                      </td>
                    </tr>
                  )
                }
                const isLast = i === features.length - 1
                return (
                  <tr key={f.name} className={`${!isLast ? "border-b" : ""} ${f.highlight ? "bg-violet-50/40 dark:bg-violet-950/10" : ""}`}>
                    <td className="p-4 md:p-5 font-medium">{f.name}</td>
                    <td className="p-4 md:p-5 text-center bg-violet-600/5 font-bold">
                      <Cell val={f.us} ours />
                    </td>
                    <td className="p-4 md:p-5 text-center text-muted-foreground"><Cell val={f.them} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6 max-w-2xl mx-auto">
          Comparação baseada em recursos públicos do Google Forms em {new Date().getFullYear()}. Algumas features citadas como "pagas" se referem ao Google Workspace.
        </p>
      </div>
    </section>
  )
}

// ─── Killer Features ──────────────────────────────────────────────────────────

const KILLERS = [
  {
    icon: GitBranch,
    title: "Lógica condicional de verdade",
    description: "No Google Forms, você só consegue pular seções inteiras. Aqui, cada pergunta pode aparecer ou sumir baseada em qualquer combinação de respostas anteriores. Crie experiências adaptativas reais.",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: MessageCircle,
    title: "Notificação no WhatsApp",
    description: "Receba (e envie ao respondente) mensagens automáticas no WhatsApp quando um formulário é preenchido. Não precisa abrir o e-mail, não precisa de Zapier.",
    color: "text-green-600",
    bg: "bg-green-50",
    badge: "Em breve",
  },
  {
    icon: Brain,
    title: "Análise com IA",
    description: "Cole 500 respostas abertas e descubra os 5 temas dominantes em segundos. Detecta padrões, sentimentos e outliers. Nada disso existe no Google Forms.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Palette,
    title: "Brand Kit do workspace",
    description: "Defina cores, fontes e logo do seu workspace uma vez. Todo formulário criado já sai com a sua identidade visual — não com o cabeçalho azul do Google.",
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
  {
    icon: BarChart3,
    title: "Respostas parciais e drop-off",
    description: "Sabe a pergunta exata onde 40% das pessoas desistem? Google Forms não. Aqui, cada pergunta respondida é salva — mesmo que o respondente feche o navegador.",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    icon: Lock,
    title: "CPF, CNPJ e WhatsApp validados",
    description: "Campos nativos com máscara e validação reais. Acabou o respondente digitando 'meu CPF' no campo de CPF. Feito pra negócios brasileiros.",
    color: "text-slate-700",
    bg: "bg-slate-100",
  },
]

function KillerFeatures() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="rounded-full mb-4">O que o Google Forms não tem</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            6 recursos que mudam tudo
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Cada um sozinho já justifica a migração. Juntos, transformam o formulário de uma planilha de campos numa experiência de verdade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {KILLERS.map((f) => (
            <div key={f.title} className="relative rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow">
              {f.badge && (
                <span className="absolute top-4 right-4 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {f.badge}
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
      </div>
    </section>
  )
}

// ─── Migration ────────────────────────────────────────────────────────────────

function MigrationSection() {
  return (
    <section className="py-24 container">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="rounded-full mb-4 bg-green-50 text-green-700 border-green-200">
            <Upload className="h-3.5 w-3.5 mr-1" />
            Sem trabalho manual
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Migre seu Google Forms em 30 segundos
          </h2>
          <p className="text-xl text-muted-foreground">
            Cola a URL, importa, pronto. A estrutura completa do seu formulário é recriada.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { num: "1", title: "Cole a URL", desc: "Copie o link de edição do seu Google Forms e cole no nosso importador." },
            { num: "2", title: "Aguarde 5 segundos", desc: "Lemos todas as perguntas, opções, ordem e obrigatoriedade automaticamente." },
            { num: "3", title: "Publique", desc: "Ajuste o tema, ative lógica condicional ou recursos brasileiros e publique." },
          ].map((s) => (
            <div key={s.num} className="rounded-2xl border bg-card p-6 space-y-3 relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background text-xl font-bold">
                {s.num}
              </div>
              <h3 className="font-bold text-lg">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border bg-violet-600/5 border-violet-600/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-base mb-1">Pronto pra migrar?</p>
            <p className="text-sm text-muted-foreground">Plano gratuito, sem cartão de crédito.</p>
          </div>
          <Link href="/signup">
            <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-bold px-6">
              Importar Google Forms <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Use Cases ────────────────────────────────────────────────────────────────

const USE_CASES = [
  {
    title: "Captura de leads",
    google: "Cabeçalho do Google reduz confiança. Sem lógica para qualificar. Sem WhatsApp.",
    us: "Formulário com sua marca, lógica de qualificação, notificação no WhatsApp instantânea.",
  },
  {
    title: "NPS e satisfação",
    google: "Pergunta NPS de 0–10 em formato planilha. Sem análise visual.",
    us: "Formato conversacional aumenta conclusão. Dashboard de NPS com tendências e análise de comentários por IA.",
  },
  {
    title: "Inscrição em curso ou evento",
    google: "Sem CPF validado, sem WhatsApp formatado, sem lead magnet automático no final.",
    us: "CPF/CNPJ validados, WhatsApp formatado, PDF do contrato entregue automaticamente ao final.",
  },
  {
    title: "Pesquisa de mercado",
    google: "500 respostas abertas viram um trabalho de horas analisando manualmente.",
    us: "IA agrupa respostas em temas, identifica padrões e sumariza em segundos.",
  },
]

function UseCases() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="rounded-full mb-4">Caso por caso</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Onde a diferença aparece na prática
          </h2>
        </div>

        <div className="space-y-4">
          {USE_CASES.map((c) => (
            <div key={c.title} className="rounded-2xl border bg-card p-6 md:p-8">
              <h3 className="font-bold text-lg mb-4">{c.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/50 border">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Com Google Forms</p>
                  <p className="text-sm text-muted-foreground">{c.google}</p>
                </div>
                <div className="p-4 rounded-xl bg-violet-50 border border-violet-200">
                  <p className="text-xs font-bold text-violet-700 uppercase tracking-wider mb-2">Com formularios.ia</p>
                  <p className="text-sm text-foreground">{c.us}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing Callout ──────────────────────────────────────────────────────────

function PricingCallout() {
  return (
    <section className="py-24 container">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="rounded-full mb-4">Preço</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Comece grátis. Cresce quando precisar.
          </h2>
          <p className="text-xl text-muted-foreground">
            Sem cartão de crédito, sem renovação automática.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border bg-card p-8 flex flex-col gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Gratuito</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">R$ 0</span>
                <span className="text-sm text-muted-foreground">/ pra sempre</span>
              </div>
              <p className="text-sm mt-2 text-muted-foreground">
                Tudo que o Google Forms não te dá, no plano grátis.
              </p>
            </div>
            <ul className="space-y-2.5 flex-1 text-sm">
              {[
                "Até 3 formulários publicados",
                "Rascunhos ilimitados",
                "50 respostas para testar",
                "24 tipos de campo (incluindo CPF/CNPJ)",
                "Formato conversacional",
                "Brand Kit básico",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/signup">
              <Button className="w-full rounded-full" variant="outline">
                Começar grátis
              </Button>
            </Link>
          </div>

          <div className="relative rounded-2xl border p-8 flex flex-col gap-6 bg-foreground text-background border-foreground shadow-2xl">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-violet-600 text-white rounded-full px-4">Lote Fundador</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-background/60 mb-1">Lote Fundador</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">R$ 499</span>
                <span className="text-sm text-background/60">/ 12 meses</span>
              </div>
              <p className="text-sm mt-2 text-background/70">
                Pagamento único via Pix. Sem renovação automática.
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
                Garantir minha vaga
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FAQ({ items }: { items: typeof FAQ_ITEMS }) {
  return (
    <section id="faq" className="py-24 container max-w-4xl mx-auto">
      <div className="text-center mb-16">
        <Badge variant="secondary" className="rounded-full mb-4">Perguntas frequentes</Badge>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Dúvidas sobre migrar do Google Forms
        </h2>
      </div>

      <div className="space-y-4">
        {items.map((item, i) => (
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
      <div className="relative rounded-3xl bg-foreground text-background overflow-hidden p-8 sm:p-12 md:p-20 text-center">
        <div className="absolute inset-0 -z-10 [background:radial-gradient(ellipse_at_top,#4c1d95,transparent_60%)]" />
        <Layers className="h-12 w-12 mx-auto mb-6 text-violet-400" />
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
          Seu próximo formulário<br />merece mais que o Google Forms
        </h2>
        <p className="text-xl text-background/70 mb-10 max-w-xl mx-auto">
          Importe em 1 clique. Use os recursos brasileiros que faltam no Google. Cancele quando quiser.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="rounded-full px-10 h-12 text-base bg-white text-foreground hover:bg-white/90 font-bold">
              Migrar agora — grátis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <p className="text-sm text-background/40 mt-6">
          Sem cartão · Sem amarras · Exporte seus dados quando quiser
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
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link href="/login" className="hover:text-foreground transition-colors">Entrar</Link>
          <Link href="/signup" className="hover:text-foreground transition-colors">Criar conta</Link>
          <Link href="/#pricing" className="hover:text-foreground transition-colors">Preços</Link>
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
