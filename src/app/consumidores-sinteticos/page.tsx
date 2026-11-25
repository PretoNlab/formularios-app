import type { Metadata } from "next"
import Link from "next/link"
import {
  Sparkles,
  ArrowRight,
  FlaskConical,
  CheckCircle2,
  X,
  MessageSquareQuote,
  BarChart3,
  Trash2,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SsrInteractiveShowcase } from "@/components/landing/ssr-interactive-showcase"

export const metadata: Metadata = {
  title: "Consumidores Sintéticos e Método SSR em Pesquisas | formularios.ia",
  description:
    "Simule 20 consumidores brasileiros com o método Semantic Similarity Rating (SSR) antes de publicar sua pesquisa ou gastar com tráfego. Encontre falhas nas perguntas e teste preços em segundos.",
  alternates: { canonical: "/consumidores-sinteticos" },
  openGraph: {
    title: "Consumidores Sintéticos com Método SSR | formularios.ia",
    description:
      "Teste seu formulário, oferta e preço com personas brasileiras céticas, pragmáticas e entusiastas antes de rodar anúncios.",
    url: "https://formularios.ia.br/consumidores-sinteticos",
    siteName: "formularios.ia",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Consumidores Sintéticos com Método SSR | formularios.ia",
    description:
      "Pré-teste pesquisas e ofertas com 20 consumidores sintéticos brasileiros antes de gastar com tráfego.",
  },
}

const FAQ_ITEMS = [
  {
    question: "O que é o método SSR (Semantic Similarity Rating)?",
    answer:
      "É uma técnica científica de pesquisa com modelos de linguagem (descrita no estudo arXiv:2510.08338). Em vez de pedir que a IA escolha um número frio de 1 a 5 — o que vicia as respostas em notas 3 e 4 — o modelo primeiro assume um perfil demográfico específico, escreve sua reação sincera em texto livre e só depois essa opinião é ancorada semanticamente na escala numérica.",
  },
  {
    question: "Consumidores sintéticos substituem clientes reais?",
    answer:
      "Não. A função do painel sintético é filtrar ideias fracas, testar faixas de preço e corrigir perguntas confusas em 30 segundos, antes de você gastar dinheiro com anúncios ou queimar sua lista de clientes. A validação final deve ser feita com pessoas reais no mesmo formulário.",
  },
  {
    question: "As respostas simuladas misturam com as respostas de humanos reais?",
    answer:
      "Não se misturam sem você saber. Toda resposta gerada entra identificada com a origem 'IA Sintética (SSR)' e um selo roxo na tabela. Você pode filtrar apenas as sintéticas para testar gráficos e cruzamentos e, quando for lançar a pesquisa oficial, apagar toda a simulação com 1 clique.",
  },
  {
    question: "O simulador respeita a lógica condicional do meu formulário?",
    answer:
      "Sim. O motor SSR percorre exatamente as regras de salto (jump_to), ocultação e encerramento configuradas no seu formulário. Se uma persona responde 'Não' em uma pergunta eliminatória, ela não responde às perguntas seguintes.",
  },
  {
    question: "Quanto custa rodar uma simulação?",
    answer:
      "Uma rodada com 10 consumidores sintéticos consome 5 créditos e uma rodada com 20 consumidores consome 8 créditos. Ao criar sua conta gratuita, você já recebe créditos de boas-vindas suficientes para testar seus primeiros formulários sem colocar cartão.",
  },
]

export default function SyntheticConsumersLandingPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Nav */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex bg-foreground text-background items-center justify-center p-1 rounded-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">formularios.ia</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/#recursos" className="text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </Link>
            <Link href="/vs/google-forms" className="text-muted-foreground hover:text-foreground transition-colors">
              vs Google Forms
            </Link>
            <Link href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Preços
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="rounded-full px-4 sm:px-5 bg-foreground text-background hover:bg-foreground/90 font-bold">
                Testar grátis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container flex flex-col items-center text-center pt-20 pb-16 gap-7">
        <Badge
          variant="secondary"
          className="rounded-full px-4 py-1.5 text-xs sm:text-sm gap-2 font-semibold text-violet-700 dark:text-violet-300 bg-violet-500/10 border border-violet-500/20"
        >
          <FlaskConical className="h-3.5 w-3.5" />
          Novo · Painel Sintético com Método SSR
        </Badge>

        <h1 className="max-w-4xl text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08] font-headline">
          Teste seu formulário e seu preço com{" "}
          <span className="text-violet-600">20 consumidores sintéticos</span>{" "}
          antes de gastar com tráfego.
        </h1>

        <p className="max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
          Descubra em 30 segundos quais perguntas confundem seu público e como perfis brasileiros céticos, pragmáticos e entusiastas reagem à sua oferta usando ancoragem semântica (SSR).
        </p>

        <div className="flex flex-col items-center gap-3 pt-1">
          <Link href="/signup">
            <Button
              size="lg"
              className="rounded-full px-9 text-base h-14 gap-2 bg-foreground text-background hover:bg-foreground/90 font-bold shadow-lg"
            >
              Simular meu formulário grátis
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground font-medium">
            Créditos grátis de boas-vindas inclusos · Sem cartão de crédito
          </p>
        </div>
      </section>

      {/* Why plain AI fails vs SSR */}
      <section className="border-y bg-muted/20 py-20">
        <div className="container max-w-5xl space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-headline">
              Por que pedir uma nota de 1 a 5 direto para uma IA comum não funciona
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Quando você pergunta diretamente a um modelo de linguagem se ele compraria algo de 1 a 5, ele responde de forma educada e segura: quase tudo vira nota 3 ou 4. Sem dispersão, você não separa uma oferta forte de uma ideia ruim.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Naive LLM */}
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                  Prompt comum (Nota direta)
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-500/10 px-2.5 py-0.5 rounded-full">
                  <X className="h-3.5 w-3.5" /> Viés de centralidade
                </span>
              </div>
              <div className="rounded-xl bg-muted/50 p-4 font-mono text-xs text-muted-foreground space-y-1.5">
                <p>&gt; Consumidor 1: Nota 4/5</p>
                <p>&gt; Consumidor 2: Nota 4/5</p>
                <p>&gt; Consumidor 3: Nota 3/5</p>
                <p>&gt; Consumidor 4: Nota 4/5</p>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <X className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Concentra tudo no meio da tabela e esconde rejeições reais de preço.</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Gera elogios genéricos que parecem texto de assessoria, não fala de cliente.</span>
                </li>
              </ul>
            </div>

            {/* SSR Method */}
            <div className="rounded-2xl border-2 border-violet-600/30 bg-card p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  Método SSR no formularios.ia
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Dispersão realista
                </span>
              </div>
              <div className="rounded-xl bg-violet-500/5 border border-violet-500/15 p-4 text-xs space-y-2">
                <p className="text-muted-foreground">
                  <strong className="text-foreground">1. Perfil + Voz aberta:</strong>{" "}
                  &ldquo;Já uso planilha grátis e R$ 297 pesa no meu caixa hoje...&rdquo;
                </p>
                <p className="text-violet-700 dark:text-violet-300 font-semibold">
                  2. Ancoragem semântica do texto → Âncora 2/5 (Resistência)
                </p>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>O número vira consequência do que a persona pensou e escreveu sem filtro.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Aponta exatamente qual pergunta ou opção faltando faria o respondente desistir.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="py-20">
        <div className="container max-w-5xl space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="outline" className="text-xs">
              Veja um exemplo real na prática
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight font-headline">
              Alterne entre 3 pesquisas e veja o diagnóstico SSR
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              É exatamente este relatório que você recebe dentro do seu painel antes de divulgar o formulário.
            </p>
          </div>

          <SsrInteractiveShowcase />
        </div>
      </section>

      {/* 3-Step Workflow */}
      <section className="border-y bg-muted/20 py-20">
        <div className="container max-w-5xl space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-headline">
              Do rascunho aos dados reais no mesmo lugar
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Use consumidores sintéticos para lapidar o formulário e humanos reais para bater o martelo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border bg-card p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                <MessageSquareQuote className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base">1. Crie ou importe do Google Forms</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Monte seu formulário do zero, gere por comando de texto ou traga um Google Forms pronto pela URL em poucos segundos.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base">2. Estresse com 10 ou 20 personas</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Defina o perfil do seu comprador brasileiro, receba o Score SSR, veja os alertas de perguntas travadas e teste os gráficos cruzados.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base">3. Limpe em 1 clique e publique</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ajustou as perguntas? Apague todas as respostas marcadas como SSR com 1 botão e compartilhe o link limpo com seus clientes reais.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container max-w-3xl space-y-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center font-headline">
            Perguntas frequentes sobre o método SSR
          </h2>

          <div className="divide-y rounded-2xl border bg-card px-6">
            {FAQ_ITEMS.map((item) => (
              <details key={item.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-sm sm:text-base">
                  <span>{item.question}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-foreground text-background py-20">
        <div className="container max-w-3xl text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-headline">
            Descubra onde seu formulário trava antes do primeiro clique pago.
          </h2>
          <p className="text-background/70 text-base sm:text-lg max-w-xl mx-auto">
            Crie sua conta gratuita em menos de 1 minuto e rode sua primeira simulação SSR com os créditos de boas-vindas.
          </p>
          <div className="pt-2">
            <Link href="/signup">
              <Button
                size="lg"
                className="rounded-full px-10 h-14 text-base bg-white text-foreground hover:bg-white/90 font-bold"
              >
                Testar Consumidores Sintéticos grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} formularios.ia</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/" className="hover:text-foreground transition-colors">Início</Link>
            <Link href="/vs/google-forms" className="hover:text-foreground transition-colors">vs Google Forms</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Termos</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
