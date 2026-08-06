# Estrutura de Pastas

Árvore completa do `/src` e diretórios relacionados.

> **Carregar este doc quando:** precisar localizar onde uma feature vive, ou decidir onde criar arquivo novo.

---

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
      /forms/check-slug         # Validação de slug único
      /responses/start          # Iniciar resposta (cria response parcial)
      /responses/progress       # Salvar progresso parcial
      /responses/submit         # Finalizar resposta
      /upload/response-file     # Upload do campo file_upload
      /upload/completion-file   # Upload de arquivo de download (criador)
      /upload/theme-asset       # Upload de logo / imagem do tema
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
      /fields/                  # Um componente por tipo de pergunta + testes
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
    /supabase
      /client.ts                # Browser client (@supabase/ssr)
      /server.ts                # Server client (cookies)
    /types
      /form.ts                  # Form, Question, AnswerValue, IntegrationType, QUESTION_TYPES
      /question-types.ts        # QUESTION_TYPE_GROUPS + helpers
    /ai
      /google-ai.ts             # Wrapper do Gemini
    /import
      /google-forms.ts          # Parser do export do Google Forms
      /json-import.ts           # Import via JSON
      /csv-responses.ts         # Import de CSV de respostas
      /type-mapping.ts          # Mapeamento Google Forms → tipos internos
    /utils
      /slug.ts                  # Geração de slugs únicos
      /map-db-form.ts           # Conversão DB row → domínio
      /onboarding.ts
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

---

## Convenções de localização

- **Mutation chamada por componente do app** → Server Action em `src/app/actions/`.
- **Webhook recebido / OAuth callback / endpoint anônimo do renderer** → Route Handler em `src/app/api/`.
- **Query de banco** → função em `src/lib/db/queries/` (nunca queries soltas em Server Action).
- **Lógica de negócio testável** → função pura em `src/lib/` com `*.test.ts` co-localizado.
- **Componente de UI base** → `src/components/ui/` (shadcn/ui, não editar).
- **Componente de feature** → `src/components/<area>/`.
- **Hook reusável** → `src/lib/hooks/use-<nome>.ts` (criar a pasta no primeiro hook extraído).
- **Tipos compartilhados** → `src/lib/types/`.
- **Constantes/configs estáticas** → `src/config/`.
