# formularios.ia.br

Form builder SaaS para o mercado brasileiro — alternativa ao Typeform/Tally com foco em WhatsApp, IA generativa, import de Google Forms e analytics avançados.

**Produto ao vivo:** [formularios.ia.br](https://formularios.ia.br)

---

## Features

- **26 tipos de pergunta** — texto, seleção, rating, NPS, CPF/CNPJ, WhatsApp, assinatura, ranking, matriz, upload, download de arquivo, e mais.
- **Builder visual** com drag & drop, undo/redo, auto-save (2s), preview ao vivo e onboarding tour.
- **Lógica condicional** — pular/mostrar perguntas baseado em respostas anteriores (motor próprio em `lib/logic-engine.ts`).
- **Renderer estilo Typeform** — uma pergunta por vez, navegação por teclado, transições, salvamento de progresso parcial.
- **Temas customizáveis** — cores, fontes (Google Fonts) e border-radius por formulário; brand kit por workspace.
- **IA com Gemini** — geração de formulário a partir de descrição em linguagem natural + análise de respostas.
- **Import** — Google Forms (export do Google), JSON e CSV de respostas.
- **Integrações** — webhooks, Google Sheets (OAuth), notificação por e-mail (Resend).
- **Analytics** — completion rate, tempo médio, drop-off por pergunta, séries temporais.
- **Monetização PIX** — planos via AbacatePay, créditos consumíveis pra features de IA, Lote Fundador vitalício.
- **LGPD** — IPs hashados, consentimento, anonimização configurável.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| React | 19 |
| Linguagem | TypeScript strict |
| Estilização | Tailwind CSS + shadcn/ui (Radix) |
| Animações | Framer Motion |
| Estado client | Zustand + immer |
| Banco de dados | Supabase (PostgreSQL) |
| ORM | Drizzle ORM (`postgres.js`) |
| Autenticação | Supabase Auth (e-mail + Google OAuth) |
| Validação | Zod |
| Drag & Drop | @dnd-kit |
| E-mail | Resend |
| IA | Google Gemini (`@google/generative-ai`) |
| Pagamentos | AbacatePay (PIX) |
| Google Sheets | `googleapis` |
| Monitoramento | Sentry |
| Testes | Vitest + Testing Library + jsdom |
| Deploy atual | Vercel |

---

## Pré-requisitos

- Node.js 18+
- npm
- Conta no [Supabase](https://supabase.com)
- Conta no [Resend](https://resend.com) (e-mails transacionais)
- Conta no [Google Cloud Console](https://console.cloud.google.com) (OAuth + Sheets + Gemini)
- Conta no [AbacatePay](https://abacatepay.com) (opcional — só pra testar pagamento PIX)
- Conta no [Sentry](https://sentry.io) (opcional — monitoramento)

---

## Setup local

### 1. Clone e instale

```bash
git clone https://github.com/PretoNlab/formularios-app.git
cd formularios-app
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha `.env.local`. Lista completa na seção [Variáveis de ambiente](#variáveis-de-ambiente).

### 3. Aplique o schema no banco

```bash
npm run db:push
```

> Em produção, use `npm run db:generate` + `npm run db:migrate` (gera arquivo SQL e aplica versionado).

### 4. Suba o dev server

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

> O flag `--webpack` é obrigatório (Turbopack tem bug com `performance.measure` no Next.js 16). O script já inclui o flag.

---

## Scripts

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (porta 3000, webpack) |
| `npm run build` | Build de produção (`max-old-space-size=4096`) |
| `npm run start` | Servidor de produção local |
| `npm run lint` | ESLint |
| `npm test` | Roda os testes (Vitest) |
| `npm run test:watch` | Vitest em watch mode |
| `npm run test:coverage` | Coverage report |
| `npm run db:push` | Aplica schema no banco (dev — sem migration file) |
| `npm run db:generate` | Gera arquivos de migration SQL |
| `npm run db:migrate` | Aplica migrations geradas (produção) |
| `npm run db:studio` | Drizzle Studio (GUI do banco) |

---

## Variáveis de ambiente

Todas estão documentadas em [`.env.example`](.env.example).

| Variável | Obrigatório | Descrição |
|----------|:-:|-----------|
| `DATABASE_URL` | ✅ | PostgreSQL (Supabase, **conexão direta** porta 5432) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Chave anon do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Chave service role (server-only) |
| `NEXT_PUBLIC_APP_URL` | ✅ | URL base da aplicação |
| `RESEND_API_KEY` | ✅ | Chave da API do Resend |
| `RESEND_FROM_EMAIL` | ✅ | Remetente verificado no Resend |
| `IP_HASH_SALT` | ✅ (prod) | Salt pra hash de IPs (LGPD). Sem isso em prod, o servidor rejeita respostas. |
| `GOOGLE_CLIENT_ID` | ⬜ | OAuth do Google Sheets |
| `GOOGLE_CLIENT_SECRET` | ⬜ | OAuth do Google Sheets |
| `GOOGLE_REDIRECT_URI` | ⬜ | Callback do OAuth Google Sheets |
| `GOOGLE_GENERATIVE_AI_API_KEY` | ⬜ | Gemini (geração + análise de respostas) |
| `ABACATEPAY_API_KEY` | ⬜ | API key do AbacatePay (PIX) |
| `ABACATEPAY_WEBHOOK_PUBLIC_KEY` | ⬜ | Chave pública pra validar webhook AbacatePay |
| `NEXT_PUBLIC_SENTRY_DSN` | ⬜ | DSN do Sentry (browser + server) |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | ⬜ | Upload de source maps em CI |

### Supabase — atenção na URL do banco

Use **conexão direta** (não pooler):
- ✅ `db.[PROJECT-REF].supabase.co:5432`
- ❌ `aws-0-[region].pooler.supabase.com:6543`

### Supabase Auth — configuração necessária

No Supabase Dashboard → Authentication → URL Configuration:
- **Site URL:** `https://seudominio.com.br`
- **Redirect URLs:** `https://seudominio.com.br/auth/callback`

Para Google OAuth → Authentication → Providers → Google:
- Client ID e Secret do [Google Cloud Console](https://console.cloud.google.com)
- Authorized redirect URI: `https://[SEU-PROJECT-REF].supabase.co/auth/v1/callback`

### Supabase Storage

Bucket `form-responses` (público, INSERT anônimo + SELECT público) precisa existir pra o campo `file_upload` funcionar. Setup SQL em [`supabase/storage-setup.sql`](./supabase/storage-setup.sql).

### AbacatePay — webhook

Configure no painel do AbacatePay apontando pra:
```
https://seudominio.com.br/api/webhooks/abacatepay
```

---

## Estrutura do projeto

```
src/
├── app/                          # Next.js App Router
│   ├── (auth-pages)/             # Login, signup, reset
│   ├── actions/                  # Server Actions (forms, ai, import, integrations…)
│   ├── api/                      # Route Handlers
│   │   ├── auth/google-sheets/   # OAuth Sheets
│   │   ├── credits/              # Pedido + confirmação de compra
│   │   ├── responses/            # start / progress / submit
│   │   ├── upload/               # Uploads (response, completion, theme)
│   │   └── webhooks/abacatepay/  # PIX
│   ├── analytics/[formId]/       # Dashboard de analytics
│   ├── billing/                  # Planos e recargas
│   ├── builder/[formId]/         # Editor
│   ├── dashboard/                # Painel
│   ├── f/[slug]/                 # Formulário público
│   ├── responses/[formId]/       # Lista + detalhe de respostas
│   ├── settings/                 # Configurações da conta
│   ├── templates/                # Galeria de templates
│   ├── help/                     # Central de ajuda
│   └── page.tsx                  # Landing
│
├── components/
│   ├── builder/                  # Editor (panels, editors, builder-client)
│   ├── dashboard/                # Painel + analytics
│   ├── renderer/
│   │   └── fields/               # 26 fields (1 por tipo) + testes
│   ├── responses/                # Lista/detalhe
│   ├── billing/, settings/, help/, layout/, design-system/, shared/
│   └── ui/                       # shadcn/ui (não editar)
│
├── lib/
│   ├── db/
│   │   ├── schema.ts             # Drizzle schema (10 tabelas)
│   │   ├── client.ts
│   │   └── queries/              # forms, questions, responses, workspaces, users, integrations, analytics-aggregation
│   ├── supabase/                 # Browser e server clients
│   ├── ai/google-ai.ts           # Wrapper Gemini
│   ├── import/                   # Google Forms / JSON / CSV
│   ├── types/                    # Form, Question, QuestionType, etc.
│   ├── utils/                    # slug, map-db-form, onboarding
│   ├── abacatepay.ts             # Cliente AbacatePay
│   ├── credits.ts                # Lógica de créditos / quotas
│   ├── email.ts                  # Resend
│   ├── google-sheets.ts          # Cliente Google Sheets
│   ├── logic-engine.ts           # Motor de lógica condicional (puro, testado)
│   ├── submit-response-core.ts   # Núcleo de submit (puro, testado)
│   └── auth.ts                   # Helpers de auth server-side
│
├── config/                       # themes.ts, templates.ts
├── stores/                       # builder-store.ts (Zustand + immer)
└── middleware.ts                 # Proteção de rotas autenticadas

supabase/
├── migrations/                   # Migrations Drizzle
└── storage-setup.sql             # Buckets de storage
```

Documentação detalhada em [`/docs`](./docs/):
- [Arquitetura e decisões de design](./docs/ARQUITETURA.md)
- [Banco de dados e migrations](./docs/BANCO-DE-DADOS.md)
- [Deploy em diferentes plataformas](./docs/DEPLOY.md)
- [FAQ](./docs/faq.md), [Manual](./docs/manual.md), [Onboarding](./docs/onboarding.md)

---

## Tipos de pergunta (26)

**Texto e identificação (10):** `short_text`, `long_text`, `email`, `number`, `phone`, `whatsapp`, `cpf`, `cnpj`, `date`, `url`

**Seleção (4):** `multiple_choice`, `checkbox`, `dropdown`, `yes_no`

**Avaliação (3):** `rating`, `scale`, `nps`

**Layout (3):** `welcome`, `statement`, `thank_you`

**Avançado (6):** `file_upload`, `download`, `signature`, `matrix`, `ranking`, `opinion_scale`

Adicionar um novo tipo: ver passo a passo no [`CLAUDE.md`](./CLAUDE.md#padrões-de-implementação).

---

## Modelo de dados

10 tabelas: `users`, `workspaces`, `workspace_members`, `forms`, `questions`, `responses`, `answers`, `integrations`, `credit_orders`, `credit_transactions`. Fonte da verdade: [`src/lib/db/schema.ts`](./src/lib/db/schema.ts).

**Planos (`plan` enum):** `free` · `pro` · `business` · `founder` (Lote Fundador, vitalício).

---

## Convenções de código

[`CLAUDE.md`](./CLAUDE.md) contém as convenções completas:
- Regras TypeScript (sem `any`, sem `as` casuais, `interface` vs `type`)
- Padrão de componentes React e Server Actions
- Nomenclatura de arquivos e variáveis
- Como adicionar um novo tipo de pergunta / nova integração / novo template
- ADRs (decisões arquiteturais)

---

## Deploy

Ver [`docs/DEPLOY.md`](./docs/DEPLOY.md) para Vercel (atual), Railway, Render e VPS com Docker.

---

## Contato

- Produto: [formularios.ia.br](https://formularios.ia.br)
- Repositório: [github.com/PretoNlab/formularios-app](https://github.com/PretoNlab/formularios-app)
