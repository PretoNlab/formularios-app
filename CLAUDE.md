# formularios.ia.br - Sistema de Formulários Inteligentes

## Visão do Projeto

formularios.ia.br é um form builder SaaS que compete com Typeform, Tally e Google Forms, focado no mercado brasileiro com diferenciais em WhatsApp, IA (geração e análise via Gemini), import de Google Forms / CSV / JSON e integração com Google Sheets, webhooks e e-mail.

Produção: [formularios.ia.br](https://formularios.ia.br)

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 16+ |
| React | React | 19 |
| Linguagem | TypeScript (strict mode) | 5+ |
| Estilização | Tailwind CSS | 3.4+ |
| Componentes UI | shadcn/ui (Radix primitives) | latest |
| Animações | Framer Motion | 12+ |
| Estado (client) | Zustand + immer | 5+ |
| Banco de Dados | Supabase (PostgreSQL) | - |
| ORM | Drizzle ORM | 0.45+ |
| Driver | postgres (postgres.js) | 3+ |
| Autenticação | Supabase Auth (email + Google OAuth) | - |
| Validação | Zod | 4+ |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable | latest |
| E-mail transacional | Resend | 6+ |
| IA (geração + análise) | Google Gemini (`@google/generative-ai`) | - |
| Pagamentos | AbacatePay (PIX) | - |
| Integrações | Google Sheets (`googleapis`), webhooks | - |
| Monitoramento | Sentry | 10+ |
| Deploy | Vercel | - |
| Testes | Vitest + Testing Library + jsdom | - |

---

## Estrutura de Pastas

```
/src
  /app                          # Next.js App Router
    /(auth-pages)               # Grupo de rotas públicas de auth
      /login
      /signup
      /reset-password
    /actions                    # Server Actions (mutations)
      ai.ts                     # Geração e análise com Gemini
      auth.ts
      forms.ts
      import.ts                 # Import de Google Forms / JSON
      import-responses.ts       # Import de CSV de respostas
      integrations.ts
      responses.ts
      workspace.ts
    /api                        # Route Handlers
      /auth/google-sheets       # OAuth do Google Sheets
      /auth/login               # (legado / utilitário)
      /credits/order            # Criar pedido de crédito
      /credits/purchase         # Confirmar compra
      /forms/check-slug         # Validação de slug único
      /responses/start          # Iniciar resposta (cria response parcial)
      /responses/progress       # Salvar progresso parcial
      /responses/submit         # Finalizar resposta
      /upload/response-file     # Upload de file_upload
      /upload/completion-file   # Upload de arquivo de download (criador)
      /upload/theme-asset       # Upload de logo / imagem do tema
      /webhooks/abacatepay      # Webhook de pagamento PIX
    /auth                       # Callback do Supabase OAuth
    /analytics/[formId]         # Dashboard de analytics
    /billing                    # Página de planos e recargas
    /builder/[formId]           # Editor do formulário
    /dashboard                  # Painel principal
    /design                     # Showcase do design system
    /f/[slug]                   # Formulário público (renderer)
    /f/[slug]/success           # Tela de sucesso
    /help                       # Central de ajuda
    /report                     # Página de relatório / report
    /responses/[formId]         # Lista de respostas + analytics
    /settings                   # Configurações da conta
    /templates                  # Galeria de templates
    /privacy, /terms            # Políticas legais
    /layout.tsx
    /page.tsx                   # Landing page
    /sitemap.ts, /robots.ts     # SEO

  /components
    /ui                         # shadcn/ui base (não editar diretamente)
    /builder                    # Componentes do editor
      /builder-client.tsx       # Container principal (Client Component)
      /builder-tour.tsx         # Onboarding tour
      /question-card.tsx
      /editors/                 # Editores específicos (options, media-url, download-url)
      /panels/                  # Painéis laterais (properties, theme, logic, webhooks, sheets, config)
    /renderer                   # Renderização do formulário público
      /form-renderer.tsx        # Container (navegação pergunta a pergunta)
      /question-renderer.tsx
      /fields/                  # Um componente por tipo de campo (ver lista abaixo)
    /dashboard
      /forms-section.tsx
      /responses-section.tsx
      /templates-section.tsx
      /ai-form-generator-dialog.tsx
      /import-form-dialog.tsx
      /public-share-dialog.tsx
      /plan-expiration-banner.tsx
      /support-widget.tsx
      /analytics/               # Cards e gráficos do analytics
    /responses                  # UI da lista/detalhe de respostas
    /billing                    # UI de planos e checkout PIX
    /settings                   # UI de configurações
    /help                       # UI da central de ajuda
    /design-system              # Tokens e showcase
    /layout                     # Header, footer, shells
    /shared                     # Reutilizáveis (logo, progress-bar, etc.)

  /lib
    /db
      /schema.ts                # Drizzle schema (fonte da verdade — 10 tabelas)
      /client.ts                # Cliente Drizzle (postgres.js)
      /queries/
        forms.ts
        questions.ts
        responses.ts
        workspaces.ts
        users.ts
        integrations.ts
        analytics-aggregation.ts
      (migrations vivem em /supabase/migrations no root)
    /supabase
      /client.ts                # Browser client (@supabase/ssr)
      /server.ts                # Server client (cookies)
    /types
      /form.ts                  # Form, Question, AnswerValue, IntegrationType, etc.
      /question-types.ts        # QUESTION_TYPES registry + QuestionType union
    /ai
      /google-ai.ts             # Wrapper do Gemini
    /import
      /google-forms.ts          # Parser do export do Google Forms
      /json-import.ts           # Import via JSON
      /csv-responses.ts         # Import de CSV de respostas
      /type-mapping.ts          # Mapeamento Google Forms → tipos internos
    /utils
      /slug.ts                  # Geração de slugs únicos
      /map-db-form.ts           # Conversão DB row → domínio (Date→string, null→undefined)
      /onboarding.ts
    /abacatepay.ts              # Cliente AbacatePay (PIX)
    /credits.ts                 # Lógica de créditos / quotas
    /email.ts                   # Resend wrappers
    /google-sheets.ts           # Cliente Google Sheets API
    /logic-engine.ts            # Motor de lógica condicional (puro)
    /submit-response-core.ts    # Núcleo de validação/persistência de resposta (testável)
    /auth.ts                    # Helpers de auth (server-side)
    /utils.ts                   # cn(), helpers gerais

  /stores
    /builder-store.ts           # Estado do editor (Zustand + immer)

  /config
    /themes.ts                  # Temas predefinidos
    /templates.ts               # Templates de formulário (galeria)

middleware.ts                   # Proteção de rotas autenticadas
/supabase
  /migrations/                  # Migrations Drizzle aplicadas
  /storage-setup.sql            # Setup dos buckets de storage
```

> Hooks: hoje vivem inline nos componentes ou nas páginas. Não há `/lib/hooks` populado — quando extrair um hook reusável, criar `/lib/hooks/use-*.ts`.

---

## Convenções de Código

### TypeScript
- **NUNCA usar `any`**. Use `unknown` + type guards quando necessário.
- **NUNCA usar `as` type assertions** a menos que seja absolutamente necessário e documentado.
- Todos os componentes devem ter types explícitos pra props.
- Usar `interface` pra objetos extensíveis, `type` pra unions e tipos utilitários.
- Enums: usar `as const` objects ao invés de `enum` do TypeScript (ver `QUESTION_TYPES` em `/lib/types/question-types.ts`).

### Componentes React
- Apenas function components com hooks.
- Props devem aceitar `className?: string` quando fizer sentido.
- Usar `forwardRef` pra componentes que encapsulam inputs.
- Separar lógica (hooks) da apresentação (componentes).
- Componentes puros de UI em `/components/ui`, lógica de negócio nos hooks ou Server Actions.

### Nomenclatura
- Arquivos: `kebab-case.ts` / `kebab-case.tsx`
- Componentes: `PascalCase`
- Hooks: `useCamelCase`
- Tipos/Interfaces: `PascalCase`
- Constantes: `UPPER_SNAKE_CASE`
- Funções utilitárias: `camelCase`
- Variáveis de ambiente: `NEXT_PUBLIC_` pra client, sem prefixo pra server

### Dados e Estado
- **Server Actions** pra todas as mutations (criar, editar, deletar). Vivem em `/app/actions/`.
- **Route Handlers** (em `/app/api/`) só pra coisas que precisam de HTTP (webhooks, OAuth callbacks, uploads, fluxos públicos do renderer).
- **Zustand + immer** pra estado do builder no client. O renderer público não usa Zustand — estado local com `useState`/`useReducer`.
- **React Query / SWR** NÃO — usar Server Components + revalidação do Next.js.
- Validação com **Zod** em toda fronteira de dados (API, forms, DB).
- Queries de banco encapsuladas em `/lib/db/queries/`.

### Estilização
- Tailwind CSS pra tudo. Sem CSS modules, sem styled-components.
- shadcn/ui como base. Customizar via Tailwind, não por override de CSS.
- Usar `cn()` (clsx + tailwind-merge) pra composição condicional de classes.
- Cores do tema do formulário via CSS custom properties injetadas em runtime no formulário público.
- Fontes carregadas via Google Fonts no formulário público.
- Animações com Framer Motion (transições entre perguntas, modais, microinterações).

### Testes
- Vitest pra unit tests, jsdom como ambiente DOM.
- Testing Library pra component tests.
- Todo componente de field (em `/components/renderer/fields/`) tem teste co-localizado.
- Lógica pura testável (`logic-engine.ts`, `submit-response-core.ts`, imports CSV/JSON, analytics aggregation) tem teste co-localizado.
- Nomenclatura: `*.test.ts` / `*.test.tsx` ao lado do arquivo.

### Segurança e privacidade
- IPs são salvos hashados com `IP_HASH_SALT` (LGPD). Sem o salt em produção, o servidor rejeita respostas.
- Toda Server Action / Route Handler que toca dados de um form valida ownership (workspace do usuário autenticado).
- Conteúdo enviado por usuário (perguntas, respostas, opções) é tratado como untrusted — sempre `escapeHtml` antes de injetar em e-mail/HTML.
- Uploads validados por extensão **e** MIME type. Buckets do Storage têm policies separadas por finalidade.
- Sem `--no-verify` em commits, sem destrutivos sem confirmação.

---

## Regras de Negócio

### Formulários
- Cada formulário tem um `slug` único, gerado automaticamente, editável pelo usuário.
- Status: `draft` → `published` → `closed`. Só `published` aceita respostas.
- Auto-save no builder com debounce de 2 segundos (server action `updateFormAction` + `upsertQuestionsAction`).
- Limite de formulários e respostas por plano (ver Planos).

### Perguntas
- Ordem controlada por campo `order` (integer). Reorder via @dnd-kit.
- Cada tipo tem seu `properties` schema (Zod) específico.
- Lógica condicional armazenada em `logicRules` na pergunta de destino, avaliada por `logic-engine.ts`.
- Welcome screen e Thank You screen são tipos especiais (máximo 1 de cada por form).

### Respostas
- Uma `Response` contém múltiplos `Answer` (1 por pergunta respondida).
- `Response.metadata` captura: IP hashado, user-agent, UTM params, timestamp de início.
- Validação server-side dos campos obrigatórios antes de marcar `completedAt`.
- Respostas parciais persistem (campo `completedAt = null`). O renderer salva progresso a cada pergunta via `/api/responses/progress`.
- O fluxo principal de submit/validação está em `lib/submit-response-core.ts` — função pura, testada, usada tanto pela Server Action quanto pelo Route Handler do renderer público.

### Planos e monetização
- Enum `plan`: `free` | `pro` | `business` | `founder`.
- Quotas: `responseQuota`, `responseUsed`, `formQuota`. Reset/expiração via `planExpiresAt`.
- Créditos: `creditBalance` (usado pra IA, exports premium, etc.). Compras registradas em `credit_orders` + `credit_transactions`.
- Pagamentos: PIX via AbacatePay. Webhook em `/api/webhooks/abacatepay` confirma pagamentos.
- Lote Fundador (plano `founder`): vitalício, comprado uma vez, ainda disponível enquanto a contagem permitir.

### Temas
- Temas predefinidos em `/config/themes.ts`. Usuário pode customizar cores/fontes/border-radius.
- Cores aplicadas via CSS custom properties no `<form>` público.
- Cada workspace tem `brandKit` opcional (cores e logo padrão).

### Integrações
- Webhooks (POST configurável por form).
- Google Sheets (OAuth + `googleapis`) — exporta novas respostas pra uma planilha.
- E-mail (Resend) — notificação por nova resposta.
- Tipo armazenado em `integrations.type` + config em `integrations.config` (JSONB).

### IA (Gemini)
- **Geração** de formulário a partir de descrição em linguagem natural (`/actions/ai.ts`).
- **Análise** de respostas (sumário, sentimento, padrões).
- Cobra créditos (`creditBalance`) por chamada.

---

## Padrões de Implementação

### Novo tipo de pergunta
1. Adicionar ao registry em `/lib/types/question-types.ts` (`QUESTION_TYPES`).
2. Criar Zod schema de `properties` em `/lib/types/form.ts` (ou validador específico).
3. Criar componente de field em `/components/renderer/fields/<tipo>.tsx` + teste co-localizado.
4. Adicionar ao map `FIELD_COMPONENTS` em `/components/renderer/fields/index.ts`.
5. Criar editor de propriedades no painel do builder (`/components/builder/panels/properties-panel.tsx` ou editor específico em `/editors/`).
6. Atualizar `submit-response-core.ts` se a validação server-side for específica do tipo.

### Nova integração
1. Adicionar tipo ao union `IntegrationType` em `/lib/types/form.ts`.
2. Criar painel de configuração em `/components/builder/panels/`.
3. Criar Server Action ou Route Handler conforme o caso (webhook → handler em `/app/api/webhooks/<provider>`; OAuth → handler em `/app/api/auth/<provider>`).
4. Adicionar dispatch no fluxo de `submit-response-core.ts` (ou em uma fila/post-processing).
5. Documentar formato do payload.

### Novo template
1. Adicionar entrada em `/config/templates.ts` (com `questions[]` no formato do domínio).
2. Aparece automaticamente em `/templates` e no dialog de criação.

### Server Action pattern
```typescript
"use server"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"

const schema = z.object({ /* ... */ })

export async function createForm(input: z.infer<typeof schema>) {
  const user = await requireUser()
  const validated = schema.parse(input)
  // ... lógica (com checagem de ownership/quota)
  revalidatePath("/dashboard")
  return { success: true, data: result }
}
```

---

## Comandos

```bash
# Dev
npm run dev                 # Servidor de desenvolvimento (porta 3000, --webpack)
npm run db:push             # Push schema pro Supabase (dev)
npm run db:generate         # Gerar migrations SQL
npm run db:migrate          # Aplicar migrations (produção)
npm run db:studio           # Abrir Drizzle Studio

# Build & Deploy
npm run build               # Build de produção (max-old-space-size=4096)
npm run start               # Inicia servidor de produção local
npm run lint                # ESLint

# Testes
npm test                    # Rodar todos os testes
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

> **Importante:** o flag `--webpack` em `npm run dev` é obrigatório. O Turbopack tem um bug com `performance.measure` no Next.js 16 que causa crash em dev. O script já inclui o flag.

---

## Variáveis de Ambiente

Lista canônica vive em `.env.example`. Resumo:

| Categoria | Variáveis |
|-----------|-----------|
| Supabase | `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| App | `NEXT_PUBLIC_APP_URL` |
| E-mail | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| Google Sheets | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| IA | `GOOGLE_GENERATIVE_AI_API_KEY` |
| Pagamentos | `ABACATEPAY_API_KEY`, `ABACATEPAY_WEBHOOK_PUBLIC_KEY` |
| Privacidade | `IP_HASH_SALT` (obrigatório em prod) |
| Monitoramento | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` |

### Supabase — atenção na URL do banco
Use **conexão direta** (não pooler):
- ✅ `db.[PROJECT-REF].supabase.co:5432`
- ❌ `aws-0-[region].pooler.supabase.com:6543`

### Supabase Storage — buckets
- `form-responses` — uploads do campo `file_upload` (público, INSERT anônimo + SELECT público).
- Outros buckets pra logos/temas/downloads do criador conforme necessidade.
- Setup SQL em `/supabase/storage-setup.sql`.

---

## Tipos de Pergunta (26)

**Input (10):** `short_text`, `long_text`, `email`, `number`, `phone`, `whatsapp`, `cpf`, `cnpj`, `date`, `url`

**Selection (4):** `multiple_choice`, `checkbox`, `dropdown`, `yes_no`

**Rating (3):** `rating`, `scale`, `nps`

**Layout (3):** `welcome`, `statement`, `thank_you`

**Advanced (6):** `file_upload`, `download`, `signature`, `matrix`, `ranking`, `opinion_scale`

Registry: `/lib/types/question-types.ts`. Map componente: `/components/renderer/fields/index.ts` (`FIELD_COMPONENTS`).

---

## Modelo de Dados (10 tabelas)

| Tabela | Função |
|--------|--------|
| `users` | Conta do usuário, plano, quotas, créditos |
| `workspaces` | Workspace (1:N forms), brand kit |
| `workspace_members` | Membros de um workspace (owner/admin/member) |
| `forms` | Formulário, theme, settings, status |
| `questions` | Perguntas do form (com `properties` JSONB e `logicRules`) |
| `responses` | Sessão de resposta (parcial ou completa) |
| `answers` | Resposta individual a uma pergunta |
| `integrations` | Webhooks / Sheets / e-mail config por form |
| `credit_orders` | Pedido de compra de créditos / plano (AbacatePay) |
| `credit_transactions` | Crédito/débito de saldo |

Schema completo: `/src/lib/db/schema.ts` (fonte da verdade).

---

## Decisões Arquiteturais (ADRs)

### ADR-001: JSON columns pra properties e values
**Contexto:** Tipos de pergunta têm schemas diferentes. Respostas variam por tipo.
**Decisão:** Usar colunas JSONB no PostgreSQL com validação Zod na aplicação.
**Consequência:** Flexibilidade máxima pra adicionar tipos sem migration. Trade-off: queries em JSON são mais lentas, mas pra nosso volume é irrelevante.

### ADR-002: Zustand + immer ao invés de Context pra estado do builder
**Contexto:** Builder tem estado complexo (perguntas, drag, undo/redo, preview).
**Decisão:** Zustand com immer. Permite selectors granulares e mutações ergonômicas.
**Consequência:** Performance melhor que Context (sem re-renders desnecessários), API simples.

### ADR-003: Formulário público como Single Page (não SSR)
**Contexto:** Formulários públicos são interativos (transições, keyboard nav).
**Decisão:** Client component com fetch inicial dos dados via Server Component wrapper.
**Consequência:** UX fluida tipo Typeform. SEO não é prioridade pra formulários — landing page e templates sim.

### ADR-004: Drizzle ao invés de Prisma
**Contexto:** Precisamos de type-safety com flexibilidade SQL.
**Decisão:** Drizzle ORM — mais leve, SQL-like, melhor DX com Supabase.
**Consequência:** Queries mais explícitas, bundle menor, sem overhead de engine.

### ADR-005: Núcleo de submit isolado em função pura
**Contexto:** Submissão de resposta acontece via Route Handler (renderer público) e via Server Action (preview/teste). Validação, sanitização, IP-hashing e dispatch de integrações precisam ser idênticos.
**Decisão:** `lib/submit-response-core.ts` é função pura testada com Vitest. Os dois entrypoints só fazem parsing/auth e delegam.
**Consequência:** Comportamento consistente, fácil de testar sem mockar HTTP. Mesma garantia pra `logic-engine.ts`.

### ADR-006: Monetização com quotas + créditos paralelos
**Contexto:** Diferenciar plano (acesso/limite) de feature consumível (IA, exports).
**Decisão:** Plano controla quotas duras (`responseQuota`, `formQuota`); créditos (`creditBalance`) são moeda paralela pra features pay-per-use.
**Consequência:** Lote Fundador pode dar plano vitalício + créditos iniciais sem confundir os dois eixos. AbacatePay processa ambos por webhook (`/api/webhooks/abacatepay`).

### ADR-007: Direct connection do Supabase (não pooler)
**Contexto:** Pooler de transação quebra com prepared statements do `postgres.js`. Pooler de sessão tem latência maior.
**Decisão:** `DATABASE_URL` aponta pra `db.[ref].supabase.co:5432` (direct, IPv6).
**Consequência:** Não dá pra rodar localmente em redes só-IPv4 sem fallback. Em produção (Vercel) funciona normalmente. Sem `prepare: false` no client.
