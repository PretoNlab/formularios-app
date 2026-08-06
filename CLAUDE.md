# formularios.ia.br

Form builder SaaS brasileiro (compete com Typeform, Tally, Google Forms). Diferenciais: WhatsApp, IA (Gemini para geração e análise), import de Google Forms/CSV/JSON, integração com Google Sheets/webhooks/e-mail.

Produção: [formularios.ia.br](https://formularios.ia.br)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16+ (App Router) |
| UI | React 19, TypeScript strict, Tailwind 3.4+, shadcn/ui, Framer Motion 12+ |
| Estado | Zustand + immer (builder) |
| DB | Supabase (PostgreSQL) + Drizzle ORM 0.45+ + postgres.js |
| Auth | Supabase Auth (email + Google OAuth) |
| Validação | Zod 4+ |
| E-mail | Resend |
| IA | Google Gemini (`@google/generative-ai`) |
| Integrações | Google Sheets (`googleapis`), webhooks |
| Monitoramento | Sentry |
| Testes | Vitest + Testing Library + jsdom |
| Deploy | Vercel |

---

## Estrutura (alto nível)

```
src/app          # Next.js routes
   /actions      # Server Actions (mutations)
   /api          # Route Handlers (webhooks, OAuth, renderer público)
   /f/[slug]     # Formulário público
   /builder      # Editor
   /dashboard    # Painel
src/components   # ui (shadcn) · builder · renderer · dashboard · …
src/lib          # db, supabase, types, ai, import, utils, hooks
src/stores       # Zustand (builder)
src/config       # themes, templates
supabase/        # migrations e storage-setup.sql
```

Árvore completa: [docs/ESTRUTURA.md](docs/ESTRUTURA.md).

---

## Convenções de código

### TypeScript
- **NUNCA `any`**. Use `unknown` + type guards.
- **NUNCA `as` type assertions** salvo absolutamente necessário e documentado.
- Props com types explícitos. `interface` para objetos extensíveis, `type` para unions.
- Enums: `as const` objects (ver `QUESTION_TYPES`), não `enum` do TS.

### React
- Apenas function components com hooks.
- Aceitar `className?: string` quando fizer sentido.
- `forwardRef` em componentes que encapsulam inputs.
- Separar lógica (hooks) da apresentação (componentes).
- UI pura em `/components/ui` (shadcn — não editar); lógica em hooks ou Server Actions.

### Nomenclatura
- Arquivos `kebab-case.ts(x)`, componentes `PascalCase`, hooks `useCamelCase`, tipos `PascalCase`, constantes `UPPER_SNAKE_CASE`, utilitários `camelCase`.
- Env vars: `NEXT_PUBLIC_` para client, sem prefixo para server.

### Dados e estado
- **Server Actions** para todas as mutations (em `/app/actions/`).
- **Route Handlers** só onde HTTP importa (webhooks, OAuth, uploads, fluxo público do renderer).
- **Zustand + immer** no builder (client). Renderer público usa `useState`/`useReducer`.
- **React Query / SWR NÃO** — usar Server Components + revalidação do Next.
- **Zod** em toda fronteira de dados (API, forms, DB).
- Queries de banco em `/lib/db/queries/`.

### Estilização
- Tailwind pra tudo. Sem CSS modules, sem styled-components.
- shadcn/ui como base. Customizar via Tailwind, não por CSS override.
- `cn()` (clsx + tailwind-merge) para composição condicional.
- Cores do tema do form via CSS custom properties em runtime.

### Testes
- Vitest + Testing Library + jsdom.
- Todo componente de field tem teste co-localizado (`*.test.tsx`).
- Lógica pura testável (`logic-engine.ts`, `submit-response-core.ts`, imports, analytics aggregation) tem teste co-localizado.

### Segurança e privacidade
- IPs salvos hashados com `IP_HASH_SALT` (LGPD). Sem o salt em produção, o servidor **rejeita respostas**.
- Toda Server Action / Route Handler que toca dados de form valida **ownership** (workspace do user autenticado).
- Conteúdo de usuário (perguntas, respostas, opções) é untrusted → sempre `escapeHtml` antes de injetar em e-mail/HTML.
- Uploads validados por **extensão E MIME type**. Buckets do Storage com policies separadas.
- Sem `--no-verify` em commits, sem destrutivos sem confirmação.

---

## Regras de negócio (resumo)

- **Forms:** slug único, status `draft|published|closed`, só `published` aceita respostas, auto-save 2s no builder.
- **Perguntas:** 26 tipos (5 categorias), ordem por `order`, lógica condicional em `logicRules` da pergunta de destino.
- **Respostas:** parciais persistem (`completedAt=null`), núcleo de submit em `lib/submit-response-core.ts` (função pura), rate limit 5/hora/IP.
- **Planos:** `free|pro|business|founder`. Quotas de form/resposta + créditos pay-per-use paralelos.
- **IA:** geração e análise via Gemini, cobra créditos por chamada.

Detalhes em [docs/REGRAS-DE-NEGOCIO.md](docs/REGRAS-DE-NEGOCIO.md).

---

## Comandos

```bash
npm run dev          # Dev server (porta 3000, --webpack obrigatório)
npm run build        # Build de produção
npm run start        # Servidor de produção local
npm run lint         # ESLint

npm test             # Vitest
npm run test:watch
npm run test:coverage

npm run db:push      # Push schema pro Supabase (dev)
npm run db:generate  # Gerar migration SQL
npm run db:migrate   # Aplicar migrations (prod)
npm run db:studio    # Drizzle Studio
```

> **`--webpack` é obrigatório** no `dev`. Turbopack tem bug com `performance.measure` no Next 16 que crasha em dev.

---

## Variáveis de ambiente

Lista canônica em `.env.example`. Por categoria:

| Categoria | Variáveis |
|---|---|
| Supabase | `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| App | `NEXT_PUBLIC_APP_URL` |
| E-mail | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| Google Sheets | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| IA | `GOOGLE_GENERATIVE_AI_API_KEY` |
| Privacidade | `IP_HASH_SALT` (obrigatório em prod) |
| Monitoramento | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` |

**`DATABASE_URL`:** use conexão direta `db.[PROJECT-REF].supabase.co:5432` (não pooler).

---

## Índice de documentação

Carregar o doc específico quando relevante — não precisa ler todos.

| Doc | Carregar quando |
|---|---|
| [docs/ARQUITETURA.md](docs/ARQUITETURA.md) | Entender fluxos (auth, builder, renderer, analytics), camadas, ADRs e padrões de performance |
| [docs/BANCO-DE-DADOS.md](docs/BANCO-DE-DADOS.md) | Mexer em schema, queries, migrations, ou consultar colunas das 9 tabelas |
| [docs/TIPOS-DE-PERGUNTA.md](docs/TIPOS-DE-PERGUNTA.md) | Adicionar/editar tipo de pergunta, mexer no renderer, consultar formato de `answer.value` |
| [docs/PADROES.md](docs/PADROES.md) | Implementar nova feature seguindo padrão (novo tipo, nova integração, novo template, Server Action) |
| [docs/REGRAS-DE-NEGOCIO.md](docs/REGRAS-DE-NEGOCIO.md) | Lógica de planos/quotas/créditos, respostas (parciais, rate limit), integrações, IA, LGPD |
| [docs/ESTRUTURA.md](docs/ESTRUTURA.md) | Localizar onde uma feature vive ou decidir onde criar arquivo novo |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Configurar deploy ou checklist de release |
| [docs/manual.md](docs/manual.md), [docs/faq.md](docs/faq.md), [docs/onboarding.md](docs/onboarding.md) | Conteúdo voltado ao usuário final (não código) |
