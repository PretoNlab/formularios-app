import type { QuestionType } from "@/lib/types/form"
import type { QuestionProperties } from "@/lib/db/schema"

export interface TemplateQuestion {
  type: QuestionType
  title: string
  description?: string
  required: boolean
  order: number
  properties?: QuestionProperties
}

export interface FormTemplate {
  id: string
  title: string
  description: string
  category: "pesquisa" | "feedback" | "cadastro" | "rh" | "vendas" | "saude" | "politica"
  color: string
  accent: string
  estimatedTime: string
  questions: TemplateQuestion[]
}

const opt = (labels: string[]): QuestionProperties => ({
  options: labels.map((label, i) => ({ id: String(i + 1), label })),
})

export const FORM_TEMPLATES: FormTemplate[] = [
  // ─── NPS ─────────────────────────────────────────────────────────────────
  {
    id: "nps",
    title: "NPS — Net Promoter Score",
    description: "Meça a lealdade dos seus clientes com a pergunta definitiva de recomendação.",
    category: "pesquisa",
    color: "from-violet-500 to-indigo-600",
    accent: "#7c3aed",
    estimatedTime: "~2 min",
    questions: [
      { type: "welcome", order: 0, required: false, title: "Pesquisa NPS", description: "Leva menos de 2 minutos. Sua opinião é muito importante para nós!" },
      { type: "nps", order: 1, required: true, title: "De 0 a 10, qual a probabilidade de você recomendar nossa empresa a um amigo ou colega?" },
      { type: "multiple_choice", order: 2, required: false, title: "Qual o principal motivo da sua nota?", properties: opt(["Qualidade do produto", "Atendimento ao cliente", "Preço e custo-benefício", "Facilidade de uso", "Outro motivo"]) },
      { type: "long_text", order: 3, required: false, title: "O que poderíamos melhorar para aumentar sua nota?", description: "Sua resposta nos ajuda a evoluir." },
      { type: "thank_you", order: 4, required: false, title: "Obrigado pelo feedback!", description: "Sua resposta foi registrada. Vamos continuar trabalhando para melhorar!" },
    ],
  },

  // ─── Satisfação do Cliente ────────────────────────────────────────────────
  {
    id: "csat",
    title: "Pesquisa de Satisfação (CSAT)",
    description: "Avalie a experiência do cliente após uma compra, atendimento ou entrega.",
    category: "feedback",
    color: "from-blue-500 to-cyan-500",
    accent: "#0ea5e9",
    estimatedTime: "~3 min",
    questions: [
      { type: "welcome", order: 0, required: false, title: "Como foi sua experiência?", description: "Conte como foi sua experiência conosco. Leva menos de 3 minutos." },
      { type: "rating", order: 1, required: true, title: "Como você avalia sua experiência geral?", properties: { ratingStyle: "stars", ratingMax: 5 } },
      { type: "multiple_choice", order: 2, required: true, title: "O que mais influenciou sua avaliação?", properties: opt(["Qualidade do produto", "Velocidade de entrega", "Atendimento", "Embalagem", "Preço"]) },
      { type: "yes_no", order: 3, required: true, title: "Você compraria novamente conosco?" },
      { type: "long_text", order: 4, required: false, title: "Deixe um comentário (opcional)", description: "Qualquer sugestão ou elogio é bem-vindo." },
      { type: "thank_you", order: 5, required: false, title: "Muito obrigado!", description: "Sua avaliação nos ajuda a melhorar cada vez mais." },
    ],
  },

  // ─── Feedback de Produto ──────────────────────────────────────────────────
  {
    id: "product-feedback",
    title: "Feedback de Produto",
    description: "Colete insights dos usuários para priorizar features e melhorias.",
    category: "feedback",
    color: "from-emerald-500 to-teal-600",
    accent: "#10b981",
    estimatedTime: "~5 min",
    questions: [
      { type: "welcome", order: 0, required: false, title: "Ajude-nos a melhorar o produto", description: "Suas respostas guiam nossas próximas decisões de produto." },
      { type: "multiple_choice", order: 1, required: true, title: "Com que frequência você usa nosso produto?", properties: opt(["Diariamente", "Algumas vezes por semana", "Uma vez por semana", "Raramente"]) },
      { type: "scale", order: 2, required: true, title: "O quanto o produto resolve seu problema principal?", properties: { scaleMin: 1, scaleMax: 7, scaleMinLabel: "Não resolve", scaleMaxLabel: "Resolve completamente" } },
      { type: "checkbox", order: 3, required: false, title: "Quais funcionalidades você mais usa?", properties: opt(["Dashboard", "Relatórios", "Integrações", "API", "Colaboração em equipe", "Notificações"]) },
      { type: "long_text", order: 4, required: false, title: "Qual feature você mais sente falta?", description: "Seja específico — isso nos ajuda muito." },
      { type: "multiple_choice", order: 5, required: true, title: "Como você ficou sabendo do produto?", properties: opt(["Indicação de amigo", "Google / Busca orgânica", "Redes sociais", "LinkedIn", "Evento ou conferência"]) },
      { type: "thank_you", order: 6, required: false, title: "Feedback recebido!", description: "Obrigado por dedicar seu tempo. Você nos ajuda a construir algo incrível." },
    ],
  },

  // ─── Formulário de Contato ────────────────────────────────────────────────
  {
    id: "contact",
    title: "Formulário de Contato",
    description: "Capture leads e solicitações de contato com um formulário simples e eficaz.",
    category: "cadastro",
    color: "from-orange-400 to-rose-500",
    accent: "#f97316",
    estimatedTime: "~1 min",
    questions: [
      { type: "welcome", order: 0, required: false, title: "Entre em contato", description: "Preencha o formulário e entraremos em contato em até 24 horas." },
      { type: "short_text", order: 1, required: true, title: "Qual é o seu nome?" },
      { type: "email", order: 2, required: true, title: "Qual é o seu e-mail?" },
      { type: "phone", order: 3, required: false, title: "Qual é o seu telefone? (opcional)" },
      { type: "multiple_choice", order: 4, required: true, title: "Qual é o assunto?", properties: opt(["Dúvida sobre produto", "Suporte técnico", "Parceria comercial", "Imprensa", "Outro"]) },
      { type: "long_text", order: 5, required: true, title: "Escreva sua mensagem" },
      { type: "thank_you", order: 6, required: false, title: "Mensagem enviada!", description: "Em breve nossa equipe entrará em contato." },
    ],
  },

  // ─── Candidatura de Emprego ───────────────────────────────────────────────
  {
    id: "job-application",
    title: "Candidatura de Emprego",
    description: "Receba candidaturas com informações estruturadas para agilizar o processo seletivo.",
    category: "rh",
    color: "from-slate-600 to-slate-800",
    accent: "#475569",
    estimatedTime: "~8 min",
    questions: [
      { type: "welcome", order: 0, required: false, title: "Candidate-se agora", description: "Preencha todas as informações com cuidado. Boa sorte!" },
      { type: "short_text", order: 1, required: true, title: "Qual é o seu nome completo?" },
      { type: "email", order: 2, required: true, title: "Qual é o seu e-mail?" },
      { type: "phone", order: 3, required: true, title: "Qual é o seu telefone?" },
      { type: "short_text", order: 4, required: true, title: "Para qual vaga você está se candidatando?" },
      { type: "multiple_choice", order: 5, required: true, title: "Qual é o seu nível de experiência?", properties: opt(["Sem experiência (Trainee/Estágio)", "Júnior (0–2 anos)", "Pleno (2–5 anos)", "Sênior (5+ anos)", "Especialista / Lead"]) },
      { type: "scale", order: 6, required: true, title: "Como você avalia seu inglês?", properties: { scaleMin: 1, scaleMax: 5, scaleMinLabel: "Básico", scaleMaxLabel: "Fluente" } },
      { type: "url", order: 7, required: false, title: "Cole o link do seu LinkedIn ou portfólio" },
      { type: "long_text", order: 8, required: true, title: "Por que você quer trabalhar conosco?" },
      { type: "thank_you", order: 9, required: false, title: "Candidatura recebida!", description: "Analisaremos seu perfil e entraremos em contato em até 5 dias úteis." },
    ],
  },

  // ─── Pesquisa de Clima ────────────────────────────────────────────────────
  {
    id: "employee-satisfaction",
    title: "Pesquisa de Clima Organizacional",
    description: "Entenda o engajamento e a satisfação do time de forma anônima.",
    category: "rh",
    color: "from-amber-400 to-orange-500",
    accent: "#f59e0b",
    estimatedTime: "~5 min",
    questions: [
      { type: "welcome", order: 0, required: false, title: "Pesquisa de clima", description: "Suas respostas são anônimas. Seja honesto — isso nos ajuda a melhorar!" },
      { type: "scale", order: 1, required: true, title: "O quanto você está satisfeito com a empresa?", properties: { scaleMin: 1, scaleMax: 10, scaleMinLabel: "Muito insatisfeito", scaleMaxLabel: "Muito satisfeito" } },
      { type: "scale", order: 2, required: true, title: "O quanto você se sente valorizado pelo seu gestor?", properties: { scaleMin: 1, scaleMax: 10, scaleMinLabel: "Nada valorizado", scaleMaxLabel: "Muito valorizado" } },
      { type: "checkbox", order: 3, required: false, title: "Quais aspectos da empresa você mais valoriza?", properties: opt(["Ambiente de trabalho", "Salário e benefícios", "Crescimento profissional", "Autonomia", "Propósito e missão", "Colegas de trabalho"]) },
      { type: "multiple_choice", order: 4, required: true, title: "Em qual departamento você atua?", properties: opt(["Produto / Tech", "Comercial / Vendas", "Marketing", "Operações", "RH / Pessoas", "Financeiro"]) },
      { type: "long_text", order: 5, required: false, title: "O que você mudaria na empresa se pudesse?" },
      { type: "thank_you", order: 6, required: false, title: "Obrigado pela sinceridade!", description: "Suas respostas são anônimas e serão usadas para melhorar nosso ambiente." },
    ],
  },

  // ─── Inscrição em Evento ──────────────────────────────────────────────────
  {
    id: "event-registration",
    title: "Inscrição em Evento",
    description: "Gerencie inscrições para workshops, webinars, meetups e conferências.",
    category: "cadastro",
    color: "from-pink-500 to-rose-600",
    accent: "#ec4899",
    estimatedTime: "~3 min",
    questions: [
      { type: "welcome", order: 0, required: false, title: "Garanta sua vaga!", description: "Preencha o formulário e confirme sua presença no evento." },
      { type: "short_text", order: 1, required: true, title: "Qual é o seu nome completo?" },
      { type: "email", order: 2, required: true, title: "Qual é o seu e-mail? (enviaremos a confirmação)" },
      { type: "phone", order: 3, required: false, title: "WhatsApp para atualizações (opcional)" },
      { type: "short_text", order: 4, required: false, title: "Empresa / Organização" },
      { type: "multiple_choice", order: 5, required: true, title: "Como você ficou sabendo do evento?", properties: opt(["E-mail marketing", "Redes sociais", "Indicação", "LinkedIn", "Site do evento"]) },
      { type: "yes_no", order: 6, required: true, title: "Você precisa de nota fiscal para participar?" },
      { type: "thank_you", order: 7, required: false, title: "Inscrição confirmada!", description: "Você receberá um e-mail de confirmação em breve. Nos vemos lá!" },
    ],
  },

  // ─── Avaliação de Atendimento ─────────────────────────────────────────────
  {
    id: "support-feedback",
    title: "Avaliação de Atendimento",
    description: "Colete feedback após tickets de suporte para medir a qualidade do atendimento.",
    category: "feedback",
    color: "from-teal-500 to-cyan-600",
    accent: "#14b8a6",
    estimatedTime: "~2 min",
    questions: [
      { type: "welcome", order: 0, required: false, title: "Como foi nosso atendimento?", description: "Leva menos de 2 minutos e nos ajuda a melhorar." },
      { type: "rating", order: 1, required: true, title: "Como você avalia o atendimento que recebeu?", properties: { ratingStyle: "stars", ratingMax: 5 } },
      { type: "yes_no", order: 2, required: true, title: "Seu problema foi resolvido?" },
      { type: "multiple_choice", order: 3, required: false, title: "O que mais te agradou no atendimento?", properties: opt(["Rapidez na resposta", "Simpatia do atendente", "Conhecimento técnico", "Solução completa do problema"]) },
      { type: "long_text", order: 4, required: false, title: "Alguma sugestão para melhorarmos?" },
      { type: "thank_you", order: 5, required: false, title: "Avaliação enviada!", description: "Obrigado pelo seu tempo. Vamos continuar melhorando!" },
    ],
  },

  // ─── Solicitação de Orçamento ─────────────────────────────────────────────
  {
    id: "quote-request",
    title: "Solicitação de Orçamento",
    description: "Qualifique leads e receba solicitações de orçamento com as informações certas.",
    category: "vendas",
    color: "from-green-500 to-emerald-600",
    accent: "#22c55e",
    estimatedTime: "~4 min",
    questions: [
      { type: "welcome", order: 0, required: false, title: "Solicite um orçamento", description: "Preencha as informações abaixo e entraremos em contato em até 1 dia útil." },
      { type: "short_text", order: 1, required: true, title: "Qual é o seu nome?" },
      { type: "email", order: 2, required: true, title: "E-mail para receber o orçamento" },
      { type: "phone", order: 3, required: true, title: "Telefone / WhatsApp" },
      { type: "short_text", order: 4, required: true, title: "Nome da sua empresa" },
      { type: "multiple_choice", order: 5, required: true, title: "Qual é o porte da sua empresa?", properties: opt(["MEI / Freelancer", "Pequena (1–50 funcionários)", "Média (50–500 funcionários)", "Grande (500+ funcionários)"]) },
      { type: "long_text", order: 6, required: true, title: "Descreva o que você precisa" },
      { type: "multiple_choice", order: 7, required: false, title: "Qual é o seu orçamento estimado?", properties: opt(["Até R$ 1.000", "R$ 1.000 – R$ 5.000", "R$ 5.000 – R$ 20.000", "Acima de R$ 20.000", "Ainda não sei"]) },
      { type: "thank_you", order: 8, required: false, title: "Solicitação recebida!", description: "Nossa equipe comercial entrará em contato em breve com uma proposta personalizada." },
    ],
  },

  // ─── Pesquisa de Mercado ──────────────────────────────────────────────────
  {
    id: "market-research",
    title: "Pesquisa de Mercado",
    description: "Valide hipóteses e entenda seu público antes de lançar um produto ou serviço.",
    category: "pesquisa",
    color: "from-indigo-500 to-purple-600",
    accent: "#6366f1",
    estimatedTime: "~5 min",
    questions: [
      { type: "welcome", order: 0, required: false, title: "Pesquisa de mercado", description: "Suas respostas são confidenciais e nos ajudam a criar produtos melhores." },
      { type: "multiple_choice", order: 1, required: true, title: "Qual é a sua faixa etária?", properties: opt(["18–24 anos", "25–34 anos", "35–44 anos", "45–54 anos", "55+ anos"]) },
      { type: "multiple_choice", order: 2, required: true, title: "Qual é a sua área de atuação profissional?", properties: opt(["Tecnologia", "Marketing / Vendas", "Saúde", "Educação", "Finanças", "Outra"]) },
      { type: "yes_no", order: 3, required: true, title: "Você já usou algum produto similar ao que estamos desenvolvendo?" },
      { type: "scale", order: 4, required: true, title: "O quanto esse problema te incomoda no dia a dia?", properties: { scaleMin: 1, scaleMax: 10, scaleMinLabel: "Não me incomoda", scaleMaxLabel: "Incomoda muito" } },
      { type: "multiple_choice", order: 5, required: false, title: "Quanto você pagaria por uma solução que resolve esse problema?", properties: opt(["Nada (solução gratuita)", "Até R$ 50/mês", "R$ 50 – R$ 150/mês", "R$ 150 – R$ 500/mês", "Mais de R$ 500/mês"]) },
      { type: "long_text", order: 6, required: false, title: "Algum comentário ou sugestão?" },
      { type: "thank_you", order: 7, required: false, title: "Muito obrigado!", description: "Suas respostas são valiosas para o nosso trabalho. Obrigado por participar!" },
    ],
  },

  // ─── Triagem Odontológica ─────────────────────────────────────────────────
  {
    id: "dental-triage",
    title: "Triagem de Clínica Odontológica",
    description: "Colete informações do paciente antes da consulta: queixa principal, histórico de saúde e urgência.",
    category: "saude",
    color: "from-sky-400 to-blue-500",
    accent: "#0ea5e9",
    estimatedTime: "~4 min",
    questions: [
      { type: "welcome", order: 0, required: false, title: "Triagem Odontológica", description: "Preencha antes de sua consulta. As informações são confidenciais." },
      { type: "short_text", order: 1, required: true, title: "Nome completo do paciente" },
      { type: "date", order: 2, required: true, title: "Data de nascimento" },
      { type: "phone", order: 3, required: true, title: "Telefone / WhatsApp para contato" },
      { type: "multiple_choice", order: 4, required: true, title: "Qual é o principal motivo da sua consulta?", properties: opt(["Dor de dente", "Sangramento na gengiva", "Dente quebrado ou lascado", "Revisão / Limpeza", "Aparelho ortodôntico", "Clareamento", "Outro"]) },
      { type: "scale", order: 5, required: false, title: "Se sentir dor, qual a intensidade?", properties: { scaleMin: 0, scaleMax: 10, scaleMinLabel: "Sem dor", scaleMaxLabel: "Dor insuportável" } },
      { type: "multiple_choice", order: 6, required: true, title: "Há quanto tempo apresenta esse problema?", properties: opt(["Menos de 24 horas", "1 a 3 dias", "1 semana", "Mais de 1 semana", "Não tenho dor"]) },
      { type: "checkbox", order: 7, required: false, title: "Possui alguma dessas condições de saúde?", properties: opt(["Diabetes", "Hipertensão", "Problemas cardíacos", "Alergia a anestesia ou medicamentos", "Gestante", "Usa anticoagulantes", "Nenhuma das anteriores"]) },
      { type: "yes_no", order: 8, required: true, title: "Já realizou algum tratamento odontológico anteriormente?" },
      { type: "long_text", order: 9, required: false, title: "Alguma informação adicional que o dentista deva saber?" },
      { type: "thank_you", order: 10, required: false, title: "Triagem concluída!", description: "Suas informações foram recebidas. Por favor, aguarde ser chamado." },
    ],
  },

  // ─── Triagem Médica ───────────────────────────────────────────────────────
  {
    id: "medical-triage",
    title: "Triagem de Clínica Médica",
    description: "Pré-atendimento completo para clínicas médicas: sintomas, histórico, medicamentos e urgência.",
    category: "saude",
    color: "from-red-400 to-rose-600",
    accent: "#ef4444",
    estimatedTime: "~5 min",
    questions: [
      { type: "welcome", order: 0, required: false, title: "Triagem Médica", description: "Preencha antes do atendimento. Suas informações são sigilosas." },
      { type: "short_text", order: 1, required: true, title: "Nome completo do paciente" },
      { type: "date", order: 2, required: true, title: "Data de nascimento" },
      { type: "phone", order: 3, required: true, title: "Telefone / WhatsApp" },
      { type: "multiple_choice", order: 4, required: true, title: "Qual é o motivo da consulta?", properties: opt(["Consulta de rotina / Check-up", "Sintomas agudos (febre, dor, etc.)", "Acompanhamento de doença crônica", "Renovação de receita", "Resultado de exame", "Outro"]) },
      { type: "long_text", order: 5, required: true, title: "Descreva seus sintomas principais", description: "Onde dói, quando começou, como é a dor." },
      { type: "scale", order: 6, required: false, title: "Qual a intensidade dos sintomas?", properties: { scaleMin: 1, scaleMax: 10, scaleMinLabel: "Leve", scaleMaxLabel: "Muito intenso" } },
      { type: "multiple_choice", order: 7, required: true, title: "Há quanto tempo apresenta esses sintomas?", properties: opt(["Menos de 24 horas", "1 a 3 dias", "4 a 7 dias", "Mais de 1 semana", "Mais de 1 mês"]) },
      { type: "checkbox", order: 8, required: false, title: "Possui alguma doença crônica diagnosticada?", properties: opt(["Diabetes", "Hipertensão", "Doença cardíaca", "Asma / DPOC", "Tireoide", "Depressão / Ansiedade", "Nenhuma"]) },
      { type: "yes_no", order: 9, required: true, title: "Está tomando algum medicamento atualmente?" },
      { type: "long_text", order: 10, required: false, title: "Se sim, quais medicamentos e doses?" },
      { type: "yes_no", order: 11, required: true, title: "Possui alergia a algum medicamento?" },
      { type: "thank_you", order: 12, required: false, title: "Triagem concluída!", description: "Em breve você será chamado para o atendimento." },
    ],
  },

  // ─── Triagem Oficina ──────────────────────────────────────────────────────
  {
    id: "auto-workshop-triage",
    title: "Triagem de Oficina Automotiva",
    description: "Receba ordem de serviço com dados do veículo, problema relatado e autorização do cliente.",
    category: "vendas",
    color: "from-zinc-600 to-slate-800",
    accent: "#52525b",
    estimatedTime: "~4 min",
    questions: [
      { type: "welcome", order: 0, required: false, title: "Triagem de Veículo", description: "Preencha as informações do seu veículo para agilizar o atendimento." },
      { type: "short_text", order: 1, required: true, title: "Nome do proprietário" },
      { type: "phone", order: 2, required: true, title: "Telefone / WhatsApp" },
      { type: "email", order: 3, required: false, title: "E-mail (para envio do orçamento)" },
      { type: "short_text", order: 4, required: true, title: "Marca e modelo do veículo", description: "Ex: Toyota Corolla, Volkswagen Gol" },
      { type: "short_text", order: 5, required: true, title: "Ano de fabricação" },
      { type: "short_text", order: 6, required: true, title: "Placa do veículo" },
      { type: "number", order: 7, required: false, title: "Quilometragem atual (km)" },
      { type: "multiple_choice", order: 8, required: true, title: "Qual é o tipo de serviço solicitado?", properties: opt(["Revisão preventiva", "Troca de óleo e filtros", "Freios", "Suspensão e direção", "Motor / Câmbio", "Elétrica / Eletrônica", "Funilaria e pintura", "Diagnóstico (não sei o problema)"]) },
      { type: "long_text", order: 9, required: true, title: "Descreva o problema ou o que está acontecendo com o veículo", description: "Quanto mais detalhes, melhor podemos ajudar." },
      { type: "multiple_choice", order: 10, required: true, title: "Quando o problema começou?", properties: opt(["Hoje", "Esta semana", "Este mês", "Faz mais de 1 mês", "Nunca reparei antes"]) },
      { type: "yes_no", order: 11, required: true, title: "Autoriza orçamento antes de executar o serviço?" },
      { type: "thank_you", order: 12, required: false, title: "Triagem recebida!", description: "Nossa equipe entrará em contato em breve com o diagnóstico e orçamento." },
    ],
  },

  // ─── Intenção de Voto ─────────────────────────────────────────────────────
  {
    id: "voting-intention",
    title: "Pesquisa de Intenção de Voto 2026",
    description: "Meça a intenção de voto e os temas prioritários para o eleitor nas eleições gerais de 2026.",
    category: "politica",
    color: "from-green-600 to-yellow-500",
    accent: "#16a34a",
    estimatedTime: "~4 min",
    questions: [
      { type: "welcome", order: 0, required: false, title: "Pesquisa Eleitoral 2026", description: "Suas respostas são anônimas e ajudam a entender o cenário político. Leva cerca de 4 minutos." },
      { type: "multiple_choice", order: 1, required: true, title: "Em qual estado você vota?", properties: opt(["São Paulo", "Minas Gerais", "Rio de Janeiro", "Bahia", "Rio Grande do Sul", "Paraná", "Pernambuco", "Ceará", "Outro estado"]) },
      { type: "multiple_choice", order: 2, required: true, title: "Qual cargo você considera mais importante nessa eleição?", properties: opt(["Presidente da República", "Governador do Estado", "Senador", "Deputado Federal", "Deputado Estadual"]) },
      { type: "multiple_choice", order: 3, required: true, title: "Sua intenção de voto para Presidente está:", properties: opt(["Definida — já sei em quem vou votar", "Parcialmente definida — tenho 2 ou 3 opções", "Indefinida — ainda não decidi", "Vou votar em branco ou nulo"]) },
      { type: "checkbox", order: 4, required: true, title: "Quais temas mais influenciam seu voto? (escolha até 3)", properties: opt(["Economia e emprego", "Saúde pública", "Segurança pública", "Educação", "Combate à corrupção", "Meio ambiente", "Habitação e moradia", "Direitos sociais"]) },
      { type: "scale", order: 5, required: true, title: "Como você avalia o cenário político atual do Brasil?", properties: { scaleMin: 1, scaleMax: 10, scaleMinLabel: "Muito ruim", scaleMaxLabel: "Muito bom" } },
      { type: "multiple_choice", order: 6, required: false, title: "Onde você busca informações sobre os candidatos?", properties: opt(["Redes sociais (Instagram, TikTok, X)", "TV / Rádio", "Sites de notícias", "Conversas com família/amigos", "Debates eleitorais", "WhatsApp"]) },
      { type: "long_text", order: 7, required: false, title: "O que você espera do próximo presidente?", description: "Escreva livremente." },
      { type: "thank_you", order: 8, required: false, title: "Obrigado pela sua participação!", description: "Sua opinião contribui para uma visão mais precisa do eleitorado brasileiro." },
    ],
  },

  // ─── Prioridades do Eleitor ───────────────────────────────────────────────
  {
    id: "voter-priorities",
    title: "Prioridades do Eleitor 2026",
    description: "Identifique quais pautas e problemas são mais urgentes para o eleitor nas eleições de 2026.",
    category: "politica",
    color: "from-blue-600 to-indigo-700",
    accent: "#2563eb",
    estimatedTime: "~5 min",
    questions: [
      { type: "welcome", order: 0, required: false, title: "O que mais importa para você nas eleições 2026?", description: "Pesquisa anônima sobre as prioridades do eleitor brasileiro." },
      { type: "multiple_choice", order: 1, required: true, title: "Qual é a sua faixa etária?", properties: opt(["16–24 anos", "25–34 anos", "35–44 anos", "45–59 anos", "60+ anos"]) },
      { type: "multiple_choice", order: 2, required: true, title: "Como você se identifica politicamente?", properties: opt(["Esquerda", "Centro-esquerda", "Centro", "Centro-direita", "Direita", "Prefiro não dizer"]) },
      { type: "scale", order: 3, required: true, title: "Qual a urgência de melhorias na saúde pública?", properties: { scaleMin: 1, scaleMax: 5, scaleMinLabel: "Pouco urgente", scaleMaxLabel: "Muito urgente" } },
      { type: "scale", order: 4, required: true, title: "Qual a urgência de melhorias na segurança pública?", properties: { scaleMin: 1, scaleMax: 5, scaleMinLabel: "Pouco urgente", scaleMaxLabel: "Muito urgente" } },
      { type: "scale", order: 5, required: true, title: "Qual a urgência de melhorias na economia e geração de empregos?", properties: { scaleMin: 1, scaleMax: 5, scaleMinLabel: "Pouco urgente", scaleMaxLabel: "Muito urgente" } },
      { type: "scale", order: 6, required: true, title: "Qual a urgência no combate à corrupção?", properties: { scaleMin: 1, scaleMax: 5, scaleMinLabel: "Pouco urgente", scaleMaxLabel: "Muito urgente" } },
      { type: "multiple_choice", order: 7, required: true, title: "O que mais pesa na hora de escolher um candidato?", properties: opt(["Propostas concretas para o país", "Histórico e ficha limpa", "Partido político", "Indicação de alguém de confiança", "Desempenho em debates", "Postura e valores pessoais"]) },
      { type: "yes_no", order: 8, required: true, title: "Você acredita que seu voto faz diferença?" },
      { type: "long_text", order: 9, required: false, title: "Qual o maior problema que o Brasil precisa resolver nos próximos 4 anos?" },
      { type: "thank_you", order: 10, required: false, title: "Participação registrada!", description: "Suas respostas ajudam a mapear as prioridades reais do eleitorado." },
    ],
  },

  // ─── Voluntários de Campanha ──────────────────────────────────────────────
  {
    id: "campaign-volunteers",
    title: "Cadastro de Voluntários de Campanha",
    description: "Recrute apoiadores e voluntários para sua campanha eleitoral com dados estruturados.",
    category: "politica",
    color: "from-yellow-400 to-orange-500",
    accent: "#f59e0b",
    estimatedTime: "~5 min",
    questions: [
      { type: "welcome", order: 0, required: false, title: "Faça parte da nossa campanha!", description: "Cadastre-se como voluntário e ajude a construir um futuro melhor para nossa cidade e estado." },
      { type: "short_text", order: 1, required: true, title: "Qual é o seu nome completo?" },
      { type: "email", order: 2, required: true, title: "Qual é o seu e-mail?" },
      { type: "phone", order: 3, required: true, title: "WhatsApp para contato" },
      { type: "short_text", order: 4, required: true, title: "Em qual cidade e estado você mora?" },
      { type: "multiple_choice", order: 5, required: true, title: "Qual é a sua disponibilidade para o voluntariado?", properties: opt(["Fins de semana", "Noites de semana", "Horário comercial", "Tempo integral", "Somente online"]) },
      { type: "checkbox", order: 6, required: true, title: "Como você quer ajudar? (pode marcar mais de um)", properties: opt(["Panfletagem e abordagem", "Redes sociais e conteúdo digital", "Organização de eventos", "Transporte de materiais", "Apoio administrativo", "Captação de recursos", "Boca a boca na comunidade"]) },
      { type: "checkbox", order: 7, required: false, title: "Quais habilidades você tem?", properties: opt(["Design gráfico", "Fotografia / Vídeo", "Comunicação e oratória", "Gestão de projetos", "Programação / Tecnologia", "Jornalismo / Redação", "Nenhuma específica"]) },
      { type: "short_text", order: 8, required: false, title: "Qual bairro ou região você pode cobrir?" },
      { type: "long_text", order: 9, required: false, title: "Por que você quer apoiar essa campanha?", description: "Conta um pouco sobre você e suas motivações." },
      { type: "thank_you", order: 10, required: false, title: "Bem-vindo ao time!", description: "Seu cadastro foi recebido. Em breve entraremos em contato com as próximas etapas." },
    ],
  },

  // ─── Avaliação de Candidato ───────────────────────────────────────────────
  {
    id: "candidate-evaluation",
    title: "Avaliação de Candidato",
    description: "Meça a percepção do eleitor sobre um candidato: aprovação, pontos fortes, fracos e pautas prioritárias.",
    category: "politica",
    color: "from-purple-600 to-fuchsia-600",
    accent: "#9333ea",
    estimatedTime: "~4 min",
    questions: [
      { type: "welcome", order: 0, required: false, title: "Avalie o candidato", description: "Pesquisa rápida e anônima para entender a percepção dos eleitores. Leva cerca de 4 minutos." },
      { type: "nps", order: 1, required: true, title: "De 0 a 10, qual a chance de você votar neste candidato?" },
      { type: "multiple_choice", order: 2, required: true, title: "Como você descreveria sua impressão geral do candidato?", properties: opt(["Muito positiva", "Positiva", "Neutra", "Negativa", "Muito negativa"]) },
      { type: "checkbox", order: 3, required: false, title: "Quais são os pontos fortes do candidato? (pode marcar mais de um)", properties: opt(["Experiência política", "Propostas concretas", "Honestidade e transparência", "Capacidade de diálogo", "Proximidade com o povo", "Gestão econômica"]) },
      { type: "checkbox", order: 4, required: false, title: "Quais são os pontos fracos? (pode marcar mais de um)", properties: opt(["Falta de experiência", "Propostas vagas", "Histórico questionável", "Distante da realidade", "Associação com partidos impopulares", "Comunicação ruim"]) },
      { type: "checkbox", order: 5, required: true, title: "Quais pautas você quer que o candidato priorize?", properties: opt(["Saúde pública", "Segurança", "Geração de empregos", "Educação de qualidade", "Combate à corrupção", "Infraestrutura", "Meio ambiente"]) },
      { type: "multiple_choice", order: 6, required: false, title: "Você já assistiu a algum debate com este candidato?", properties: opt(["Sim, assisti ao vivo", "Sim, vi trechos nas redes sociais", "Não assisti", "Não tinha conhecimento dos debates"]) },
      { type: "long_text", order: 7, required: false, title: "O que o candidato precisaria fazer para garantir seu voto?" },
      { type: "thank_you", order: 8, required: false, title: "Avaliação registrada!", description: "Obrigado pela participação. Sua opinião contribui para uma campanha mais alinhada com o eleitor." },
    ],
  },
]

export const TEMPLATE_CATEGORIES: Record<FormTemplate["category"], string> = {
  pesquisa: "Pesquisa",
  feedback: "Feedback",
  cadastro: "Cadastro",
  rh: "RH & Pessoas",
  vendas: "Vendas",
  saude: "Saúde",
  politica: "Política 2026",
}
