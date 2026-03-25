"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

// ─── Sidebar sections ─────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "primeiros-passos", label: "Primeiros passos" },
  { id: "builder", label: "Builder" },
  { id: "tipos-de-campos", label: "Tipos de campos" },
  { id: "logica-condicional", label: "Lógica condicional" },
  { id: "temas", label: "Temas e personalização" },
  { id: "configuracoes", label: "Configurações" },
  { id: "compartilhar", label: "Compartilhar" },
  { id: "integracoes", label: "Integrações" },
  { id: "analytics", label: "Respostas e Analytics" },
  { id: "faq", label: "FAQ" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 mb-16">
      <h2 className="text-2xl font-bold font-heading mb-6 pb-3 border-b">{title}</h2>
      {children}
    </section>
  )
}

function Step({ number, title, children }: { number: number; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex gap-4 mb-5">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold mt-0.5">
        {number}
      </div>
      <div>
        <p className="font-semibold mb-1">{title}</p>
        {children && <div className="text-muted-foreground text-sm leading-relaxed">{children}</div>}
      </div>
    </div>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
      <span className="font-semibold">Dica: </span>{children}
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left font-medium hover:text-foreground/80 transition-colors"
      >
        <span>{question}</span>
        {open ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <div className="pb-4 text-sm text-muted-foreground leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  )
}

// ─── Field types table data ────────────────────────────────────────────────────

const FIELD_TYPES = [
  { category: "Texto", types: [
    { name: "Texto curto", icon: "Aa", description: "Resposta em uma linha. Ideal para nome, título ou resposta breve." },
    { name: "Texto longo", icon: "¶", description: "Caixa de texto expandida. Ideal para comentários, feedback livre ou descrições." },
    { name: "E-mail", icon: "@", description: "Valida automaticamente o formato de e-mail." },
    { name: "Número", icon: "#", description: "Aceita apenas valores numéricos. Suporta mínimo, máximo e incremento." },
    { name: "Telefone", icon: "☎", description: "Campo de telefone com seletor de país." },
    { name: "WhatsApp", icon: "📱", description: "Igual ao telefone, formatado para contato via WhatsApp." },
    { name: "CPF", icon: "🪪", description: "Valida automaticamente o CPF brasileiro (formato 000.000.000-00)." },
    { name: "CNPJ", icon: "🏢", description: "Valida automaticamente o CNPJ (formato 00.000.000/0000-00)." },
    { name: "Data", icon: "📅", description: "Seletor de data." },
    { name: "URL", icon: "🔗", description: "Valida o formato de uma URL (http/https)." },
  ]},
  { category: "Seleção", types: [
    { name: "Múltipla escolha", icon: "◉", description: "Escolha única entre opções (radio). Suporta opção 'Outro' e ordem aleatória." },
    { name: "Caixas de seleção", icon: "☑", description: "Múltipla seleção (checkbox). Suporta opção 'Outro'." },
    { name: "Lista suspensa", icon: "▾", description: "Dropdown com opções. Bom para listas longas." },
    { name: "Sim / Não", icon: "✓✗", description: "Escolha binária com ícones visuais." },
  ]},
  { category: "Avaliação", types: [
    { name: "Avaliação", icon: "★", description: "Escala visual com estrelas, corações, polegares ou números. Padrão: 5 estrelas." },
    { name: "Escala", icon: "◀▶", description: "Escala de 1 a 10 (tipo Likert) com rótulos configuráveis nas pontas." },
    { name: "NPS", icon: "📊", description: "Net Promoter Score. Escala 0–10 com cálculo automático de Promotores, Neutros e Detratores." },
  ]},
  { category: "Layout", types: [
    { name: "Tela de boas-vindas", icon: "👋", description: "Primeira tela do formulário. Não coleta dados — apresenta o form." },
    { name: "Declaração", icon: "📢", description: "Tela informativa no meio do formulário (sem input)." },
    { name: "Tela de agradecimento", icon: "🎉", description: "Última tela. Exibida após o envio." },
  ]},
  { category: "Avançado", types: [
    { name: "Upload de arquivo", icon: "📎", description: "Permite que o respondente anexe um arquivo (PDF, imagem, doc, zip — máx. 10MB)." },
    { name: "Assinatura", icon: "✍", description: "Canvas para assinatura digital." },
    { name: "Download", icon: "⬇", description: "Exibe um botão de download para um arquivo configurado pelo criador." },
  ]},
]

// ─── Main component ────────────────────────────────────────────────────────────

export function HelpClient() {
  const [activeSection, setActiveSection] = useState("primeiros-passos")
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    )

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observerRef.current?.observe(el)
    })

    return () => observerRef.current?.disconnect()
  }, [])

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="container max-w-5xl py-10">
      <h1 className="text-3xl font-bold font-heading mb-2">Central de Ajuda</h1>
      <p className="text-muted-foreground mb-10">Tudo o que você precisa saber para criar e gerenciar formulários no formularios.ia.</p>

      <div className="flex gap-10 items-start">

        {/* Sidebar */}
        <aside className="hidden lg:block w-52 flex-shrink-0 sticky top-24">
          <nav className="space-y-1">
            {SECTIONS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`w-full text-left text-sm px-3 py-2 rounded-md transition-colors ${
                  activeSection === id
                    ? "bg-foreground text-background font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">

          {/* ── 1. Primeiros passos ────────────────────────────────────── */}
          <Section id="primeiros-passos" title="Primeiros passos">
            <p className="text-muted-foreground mb-6">Do cadastro ao primeiro formulário publicado em menos de 5 minutos.</p>

            <h3 className="font-semibold text-lg mb-4">Criar uma conta</h3>
            <Step number={1} title='Acesse a página inicial e clique em "Começar grátis"' />
            <Step number={2} title="Entre com sua conta Google ou cadastre-se com e-mail e senha" />
            <Step number={3} title="Você será redirecionado automaticamente para o Dashboard" />

            <h3 className="font-semibold text-lg mt-8 mb-4">Criar seu primeiro formulário</h3>
            <Step number={1} title='No Dashboard, clique no botão "Novo form"'>
              Uma janela de criação aparecerá com duas opções: em branco ou a partir de um template.
            </Step>
            <Step number={2} title="Escolha entre começar em branco ou usar um template">
              Templates já vêm com perguntas prontas para casos de uso comuns (NPS, cadastro, feedback de produto etc.).
            </Step>
            <Step number={3} title="O Builder será aberto com seu formulário pronto para editar" />

            <h3 className="font-semibold text-lg mt-8 mb-4">Publicar e compartilhar</h3>
            <Step number={1} title='No Builder, clique em "Publicar" no canto superior direito'>
              Você pode personalizar o slug (endereço) do seu formulário antes de publicar.
            </Step>
            <Step number={2} title="Copie o link público e compartilhe onde quiser">
              O link tem o formato <code className="text-xs bg-muted px-1 py-0.5 rounded">seudominio.com/f/slug-do-form</code>
            </Step>
            <Tip>Formulários ficam no status <strong>Rascunho</strong> até você publicar. Apenas formulários publicados aceitam respostas.</Tip>
          </Section>

          {/* ── 2. Builder ─────────────────────────────────────────────── */}
          <Section id="builder" title="Builder">
            <p className="text-muted-foreground mb-6">O editor onde você constrói seu formulário. Tudo salva automaticamente.</p>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {[
                { title: "Painel esquerdo", desc: "Biblioteca de tipos de campo. Clique em qualquer tipo para adicioná-lo ao formulário." },
                { title: "Canvas central", desc: "Lista de perguntas do formulário. Arraste pelo ícone de seis pontos para reordenar." },
                { title: "Painel direito", desc: "Propriedades da pergunta selecionada: título, obrigatório, opções, placeholder etc." },
                { title: "Barra superior", desc: "Undo/Redo, Preview, botão de Publicar e indicador de salvamento automático." },
              ].map(({ title, desc }) => (
                <div key={title} className="rounded-lg border bg-card p-4">
                  <p className="font-semibold mb-1">{title}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>

            <h3 className="font-semibold text-lg mb-4">Principais ações</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><span className="font-medium text-foreground">Adicionar campo:</span> Clique no tipo desejado no painel esquerdo — ele é inserido ao final do formulário.</li>
              <li><span className="font-medium text-foreground">Reordenar:</span> Arraste pelo ícone de seis pontos (⠿) à esquerda de cada pergunta.</li>
              <li><span className="font-medium text-foreground">Editar:</span> Clique em qualquer pergunta para selecioná-la e editar no painel direito.</li>
              <li><span className="font-medium text-foreground">Deletar:</span> Selecione a pergunta e clique no ícone de lixeira no painel direito.</li>
              <li><span className="font-medium text-foreground">Undo / Redo:</span> Use os botões na barra superior ou <kbd className="border rounded px-1 text-xs">Ctrl Z</kbd> / <kbd className="border rounded px-1 text-xs">Ctrl Y</kbd>.</li>
              <li><span className="font-medium text-foreground">Preview:</span> Clique em "Preview" para ver como o formulário aparece para os respondentes em tempo real.</li>
              <li><span className="font-medium text-foreground">Auto-save:</span> Todas as alterações são salvas automaticamente em 2 segundos. Um indicador aparece na barra quando há mudanças pendentes.</li>
            </ul>

            <Tip>O campo <strong>Tela de boas-vindas</strong> e a <strong>Tela de agradecimento</strong> são campos especiais — só pode existir um de cada por formulário.</Tip>
          </Section>

          {/* ── 3. Tipos de campos ─────────────────────────────────────── */}
          <Section id="tipos-de-campos" title="Tipos de campos">
            <p className="text-muted-foreground mb-6">Cada tipo de campo coleta um tipo diferente de dado. Escolha o mais adequado para cada pergunta.</p>

            {FIELD_TYPES.map(({ category, types }) => (
              <div key={category} className="mb-8">
                <h3 className="font-semibold text-base mb-3 text-muted-foreground uppercase text-xs tracking-wider">{category}</h3>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {types.map((t, i) => (
                        <tr key={t.name} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                          <td className="px-4 py-3 w-8 text-center text-lg">{t.icon}</td>
                          <td className="px-4 py-3 font-medium w-44">{t.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{t.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </Section>

          {/* ── 4. Lógica condicional ──────────────────────────────────── */}
          <Section id="logica-condicional" title="Lógica condicional">
            <p className="text-muted-foreground mb-6">Crie formulários inteligentes que mudam de acordo com as respostas do usuário.</p>

            <h3 className="font-semibold text-lg mb-4">O que é possível fazer</h3>
            <div className="grid sm:grid-cols-3 gap-3 mb-6">
              {[
                { action: "Pular para pergunta", desc: "Leva o respondente diretamente a uma pergunta específica, pulando as intermediárias." },
                { action: "Ocultar pergunta", desc: "Esconde uma pergunta com base na resposta de outra. O respondente nem sabe que existe." },
                { action: "Encerrar formulário", desc: "Finaliza o preenchimento antecipadamente, exibindo a tela de agradecimento." },
              ].map(({ action, desc }) => (
                <div key={action} className="rounded-lg border bg-card p-4">
                  <p className="font-semibold text-sm mb-1">{action}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>

            <h3 className="font-semibold text-lg mb-4">Como criar uma regra</h3>
            <Step number={1} title="Selecione a pergunta de destino (a que será afetada)" />
            <Step number={2} title='No painel direito, clique em "Lógica condicional"' />
            <Step number={3} title="Clique em + Adicionar regra" />
            <Step number={4} title="Defina a condição: qual pergunta, qual operador, qual valor">
              Operadores disponíveis: <em>é igual a, não é igual a, contém, não contém, maior que, menor que, está vazio, não está vazio</em>.
            </Step>
            <Step number={5} title="Escolha a ação: Pular para, Ocultar ou Encerrar formulário" />
            <Step number={6} title="Salve — a lógica é aplicada imediatamente no preview" />

            <h3 className="font-semibold text-lg mt-6 mb-3">Múltiplas condições (AND / OR)</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Você pode combinar várias condições em uma mesma regra usando <strong>E</strong> (todas precisam ser verdadeiras) ou <strong>OU</strong> (basta uma ser verdadeira).
            </p>

            <Tip>Exemplo prático: Se a pergunta "Como você nos conheceu?" for igual a "Indicação" → pule para "Quem te indicou?". Caso contrário, o formulário segue o fluxo normal.</Tip>
          </Section>

          {/* ── 5. Temas ───────────────────────────────────────────────── */}
          <Section id="temas" title="Temas e personalização">
            <p className="text-muted-foreground mb-6">Dê a identidade visual da sua marca ao formulário.</p>

            <h3 className="font-semibold text-lg mb-4">Temas prontos</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Existem 8 temas pré-definidos: <strong>Midnight, Ocean, Sunset, Forest, Cream, Lavender, Minimal e Neon</strong>. Selecione qualquer um na aba <em>Tema</em> do Builder para aplicar instantaneamente.
            </p>

            <h3 className="font-semibold text-lg mt-6 mb-4">Personalização avançada</h3>
            <div className="space-y-3 text-sm">
              {[
                { opt: "Cores", desc: "Personalize individualmente: fundo, card, cor de destaque, texto, texto secundário e fundo dos inputs." },
                { opt: "Tipografia", desc: "Escolha a fonte do título e do corpo separadamente. Mais de 25 fontes Google disponíveis." },
                { opt: "Bordas", desc: "Ajuste o arredondamento dos cantos (border-radius) dos cards e inputs." },
                { opt: "Logo", desc: "Faça upload da logo da sua empresa para exibi-la no topo do formulário." },
                { opt: "Imagem de fundo", desc: "Defina uma imagem de fundo para a tela do formulário." },
              ].map(({ opt, desc }) => (
                <div key={opt} className="flex gap-3">
                  <span className="font-semibold text-foreground min-w-28">{opt}</span>
                  <span className="text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>

            <Tip>Todas as alterações de tema aparecem em tempo real no Preview. Ative o Preview ao lado para ver o formulário enquanto você edita as cores.</Tip>
          </Section>

          {/* ── 6. Configurações ───────────────────────────────────────── */}
          <Section id="configuracoes" title="Configurações do formulário">
            <p className="text-muted-foreground mb-6">Controle o comportamento do formulário — acesso, limites e notificações.</p>

            <div className="space-y-5">
              {[
                {
                  title: "Limite de respostas",
                  desc: "Define um número máximo de respostas. Quando atingido, o formulário fecha automaticamente e exibe a mensagem de encerramento.",
                },
                {
                  title: "Data de encerramento",
                  desc: "O formulário para de aceitar respostas automaticamente na data e hora definidas.",
                },
                {
                  title: "Respostas parciais",
                  desc: "Quando ativado, respostas incompletas (usuário fechou sem enviar) são salvas e ficam visíveis no painel de Analytics.",
                },
                {
                  title: "Barra de progresso",
                  desc: "Exibe uma barra no topo do formulário mostrando o percentual de conclusão.",
                },
                {
                  title: "Numeração de perguntas",
                  desc: "Exibe o número da pergunta atual (ex: 3/10) durante o preenchimento.",
                },
                {
                  title: "Notificação por e-mail",
                  desc: "Envie um e-mail automaticamente para um endereço configurado cada vez que uma nova resposta for recebida.",
                },
                {
                  title: "Mensagem de encerramento",
                  desc: "Texto exibido quando o formulário está fechado (por limite ou data). Personalize para orientar o respondente.",
                },
                {
                  title: "Arquivo para download",
                  desc: "Exibe um botão de download na tela de agradecimento. Útil para entregar um e-book, certificado ou material após o preenchimento.",
                },
              ].map(({ title, desc }) => (
                <div key={title} className="rounded-lg border p-4">
                  <p className="font-semibold mb-1">{title}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 7. Compartilhar ────────────────────────────────────────── */}
          <Section id="compartilhar" title="Compartilhar">
            <p className="text-muted-foreground mb-6">Diferentes formas de distribuir seu formulário.</p>

            <h3 className="font-semibold text-lg mb-4">Link direto</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Após publicar, o formulário fica acessível em:
            </p>
            <div className="rounded-md bg-muted px-4 py-3 text-sm font-mono mb-4">
              https://formularios.ia/f/<span className="text-foreground font-bold">seu-slug</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Copie e cole em e-mails, WhatsApp, redes sociais, QR Code ou qualquer outro canal.
            </p>

            <h3 className="font-semibold text-lg mb-4">Slug personalizado</h3>
            <p className="text-sm text-muted-foreground mb-6">
              No modal de publicação, você pode editar o slug para algo mais fácil de lembrar (ex: <code className="text-xs bg-muted px-1 py-0.5 rounded">pesquisa-clientes-2025</code>). O slug precisa ser único na plataforma.
            </p>

            <h3 className="font-semibold text-lg mb-4">Embed (incorporar)</h3>
            <p className="text-sm text-muted-foreground mb-3">Para incorporar o formulário em seu site, use um iframe:</p>
            <div className="rounded-md bg-muted px-4 py-3 text-xs font-mono break-all">
              {`<iframe src="https://formularios.ia/f/seu-slug" width="100%" height="600" frameborder="0"></iframe>`}
            </div>

            <Tip>Para que o formulário apareça em iframe em outro site, o domínio de destino precisa permitir frames. Nosso <code className="text-xs bg-muted/80 px-1 py-0.5 rounded">X-Frame-Options</code> está configurado como DENY para páginas autenticadas — mas formulários públicos (/f/*) podem ser embedados normalmente.</Tip>
          </Section>

          {/* ── 8. Integrações ─────────────────────────────────────────── */}
          <Section id="integracoes" title="Integrações">
            <p className="text-muted-foreground mb-6">Envie as respostas automaticamente para outras ferramentas.</p>

            <h3 className="font-semibold text-lg mb-4">Google Sheets</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Cada nova resposta é adicionada como uma linha na planilha escolhida, com cabeçalhos automáticos.
            </p>
            <Step number={1} title='No Builder, acesse a aba "Integrações"' />
            <Step number={2} title='Clique em "Conectar Google Sheets"'>
              Você será redirecionado para autorizar o acesso à sua conta Google. Isso é necessário apenas uma vez.
            </Step>
            <Step number={3} title="Cole o link ou ID da planilha de destino" />
            <Step number={4} title="Selecione a aba (tab) da planilha onde os dados serão inseridos" />
            <Step number={5} title='Clique em "Salvar". A integração está ativa!' />
            <Tip>Na primeira resposta recebida, a linha de cabeçalhos é criada automaticamente com os títulos das perguntas.</Tip>

            <h3 className="font-semibold text-lg mt-8 mb-4">Webhooks</h3>
            <p className="text-sm text-muted-foreground mb-4">
              A cada nova resposta, um <code className="text-xs bg-muted px-1 py-0.5 rounded">POST</code> é enviado para a URL configurada com o payload abaixo. Compatível com n8n, Zapier, Make e qualquer endpoint HTTP.
            </p>
            <Step number={1} title='Na aba "Integrações", clique em "+ Novo Webhook"' />
            <Step number={2} title="Cole a URL do endpoint que vai receber os dados" />
            <Step number={3} title='Ative com o toggle e clique em "Salvar"' />

            <div className="mt-4 rounded-md bg-muted px-4 py-3 text-xs font-mono">
              <pre>{`{
  "event": "response.completed",
  "formId": "uuid-do-form",
  "responseId": "uuid-da-resposta",
  "answers": {
    "uuid-da-pergunta-1": "valor da resposta",
    "uuid-da-pergunta-2": ["opção A", "opção B"]
  },
  "submittedAt": "2025-03-24T14:30:00.000Z"
}`}</pre>
            </div>
          </Section>

          {/* ── 9. Analytics ───────────────────────────────────────────── */}
          <Section id="analytics" title="Respostas e Analytics">
            <p className="text-muted-foreground mb-6">Tudo o que você precisa para entender os dados coletados.</p>

            <h3 className="font-semibold text-lg mb-4">Acessar respostas</h3>
            <p className="text-sm text-muted-foreground mb-4">
              No Dashboard, clique em <strong>Ver respostas</strong> no card do formulário. A página de Analytics tem três abas:
            </p>

            <div className="space-y-3 mb-6">
              {[
                { tab: "Respostas", desc: "Tabela com todas as respostas individuais. Clique em qualquer linha para expandir e ver todas as respostas daquele preenchimento. Filtre por status (completo/parcial) e dispositivo." },
                { tab: "Perguntas", desc: "Visão analítica por pergunta: distribuição de opções para seleção, média para avaliações, amostras de texto com análise de IA." },
                { tab: "Visão geral", desc: "KPIs, gráfico de 30 dias, taxa de conclusão, tempo médio, breakdown por dispositivo, origem do tráfego e mapa de calor por hora/dia." },
              ].map(({ tab, desc }) => (
                <div key={tab} className="rounded-lg border p-4">
                  <p className="font-semibold mb-1">{tab}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>

            <h3 className="font-semibold text-lg mb-4">Análise com IA</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Para campos de texto longo, clique em <strong>"Analisar com IA"</strong> na aba Perguntas. Em segundos você recebe:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-6">
              <li>Temas mais mencionados (com exemplos reais)</li>
              <li>Distribuição de sentimento (positivo / neutro / negativo)</li>
              <li>Palavras-chave mais frequentes</li>
              <li>Resumo executivo do conjunto de respostas</li>
            </ul>

            <h3 className="font-semibold text-lg mb-4">Exportar dados</h3>
            <p className="text-sm text-muted-foreground">
              Clique em <strong>Exportar</strong> na aba Respostas para baixar todas as respostas em <strong>CSV</strong> (abre no Excel/Sheets) ou <strong>JSON</strong> (para integrações técnicas).
            </p>
          </Section>

          {/* ── 10. FAQ ────────────────────────────────────────────────── */}
          <Section id="faq" title="FAQ">
            <div className="rounded-lg border px-4">
              {[
                {
                  q: "Posso editar um formulário depois de publicá-lo?",
                  a: "Sim. Você pode editar o formulário a qualquer momento, mesmo após publicado. As alterações são salvas automaticamente. Porém, mudanças em perguntas já respondidas (como renomear opções) podem afetar a consistência dos dados históricos.",
                },
                {
                  q: "O que acontece com as respostas se eu fechar o formulário?",
                  a: "As respostas já coletadas ficam salvas e acessíveis normalmente no painel de Analytics. Fechar o formulário apenas impede novas submissões.",
                },
                {
                  q: "Posso ter mais de uma tela de boas-vindas ou agradecimento?",
                  a: "Não. Cada formulário suporta no máximo uma Tela de boas-vindas e uma Tela de agradecimento. O Builder bloqueia a adição de um segundo.",
                },
                {
                  q: "Como funciona o limite de respostas?",
                  a: "Você define um número máximo nas configurações do formulário. Quando a contagem de respostas completas atingir esse número, o formulário fecha automaticamente e exibe a mensagem de encerramento personalizada.",
                },
                {
                  q: "Meus dados de IP são armazenados?",
                  a: "Não armazenamos o IP diretamente. O endereço IP é usado apenas para controle de rate limit (limite de 5 envios por hora) e é convertido em um hash criptográfico anônimo antes de ser salvo. Não é possível reverter o hash para o IP original.",
                },
                {
                  q: "O formulário funciona no celular?",
                  a: "Sim. O renderer é responsivo e otimizado para mobile. O tipo de dispositivo (desktop, mobile, tablet) também é registrado nas respostas para análise.",
                },
                {
                  q: "Posso redirecionar o respondente para outro site após o envio?",
                  a: "Ainda não existe um campo de redirect automático. A tela de agradecimento é totalmente personalizável e suporta um botão de download de arquivo como call-to-action.",
                },
                {
                  q: "O que são respostas parciais?",
                  a: "Quando 'Permitir respostas parciais' está ativado nas configurações, cada resposta é salva progressivamente. Se o usuário fechar o formulário no meio, as respostas já dadas são registradas como 'Parcial' (sem data de conclusão). Você pode ver essas respostas na aba Respostas filtrada por status.",
                },
                {
                  q: "Posso usar um domínio próprio para os formulários?",
                  a: "Esta funcionalidade está no roadmap mas ainda não está disponível. Por enquanto, todos os formulários ficam em formularios.ia/f/slug.",
                },
                {
                  q: "Como funciona a integração com Google Sheets se o token expirar?",
                  a: "O sistema atualiza o token de acesso automaticamente usando o refresh token armazenado. Você não precisa reconectar periodicamente — a integração se mantém ativa indefinidamente enquanto você não revogar o acesso no painel do Google.",
                },
              ].map((item) => (
                <FaqItem key={item.q} question={item.q} answer={item.a} />
              ))}
            </div>
          </Section>

        </main>
      </div>
    </div>
  )
}
