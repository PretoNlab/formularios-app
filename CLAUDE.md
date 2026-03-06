# formularios.app - Sistema de Formulários Inteligentes

## Visão do Projeto

formularios.app é um form builder SaaS que compete com Typeform, Tally e Google Forms, focado no mercado brasileiro com diferenciais em WhatsApp, IA e analytics avançados.

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 14+ |
| Linguagem | TypeScript (strict mode) | 5+ |
| Estilização | Tailwind CSS | 3.4+ |
| Componentes UI | shadcn/ui | latest |
| Estado (client) | Zustand | 4+ |
| Banco de Dados | Supabase (PostgreSQL) | - |
| ORM | Drizzle ORM | latest |
| Autenticação | Supabase Auth | - |
| Validação | Zod | 3+ |
| Drag & Drop | @dnd-kit/core | latest |
| Deploy | Vercel | - |
| Testes | Vitest + Testing Library | - |

---

## Estrutura de Pastas

```
/src
  /app                        # Next.js App Router
    /(auth)                    # Grupo de rotas autenticadas
      /dashboard               # Painel principal
      /builder/[formId]        # Editor do formulário
      /responses/[formId]      # Respostas e analytics
      /settings                # Configurações da conta
    /(public)
      /f/[slug]                # Formulário público (preenchimento)
      /f/[slug]/success        # Tela de sucesso
    /api                       # Route Handlers
      /webhooks                # Webhooks de integrações
    /layout.tsx
    /page.tsx                  # Landing page

  /components
    /ui                        # shadcn/ui base (não editar diretamente)
    /builder                   # Componentes do editor
      /sidebar.tsx             # Sidebar com tipos de pergunta
      /question-card.tsx       # Card de pergunta no editor
      /question-editor.tsx     # Editor expandido da pergunta
      /logic-editor.tsx        # Editor de lógica condicional
      /theme-picker.tsx        # Seletor de temas
      /preview-panel.tsx       # Preview ao vivo no builder
    /renderer                  # Renderização do formulário público
      /form-renderer.tsx       # Container principal (navegação pergunta a pergunta)
      /question-renderer.tsx   # Renderizador por tipo
      /fields/                 # Um componente por tipo de campo
        /short-text.tsx
        /long-text.tsx
        /multiple-choice.tsx
        /checkbox.tsx
        /dropdown.tsx
        /rating.tsx
        /scale.tsx
        /email.tsx
        /number.tsx
        /date.tsx
        /yes-no.tsx
        /phone.tsx
        /file-upload.tsx
        /welcome-screen.tsx
        /thank-you-screen.tsx
        /statement.tsx
    /dashboard                 # Componentes do painel
      /form-card.tsx
      /stats-cards.tsx
      /response-table.tsx
      /response-chart.tsx
    /shared                    # Componentes reutilizáveis
      /progress-bar.tsx
      /keyboard-hint.tsx
      /logo.tsx

  /lib
    /db
      /schema.ts               # Drizzle schema (fonte da verdade)
      /queries/                 # Queries organizadas por domínio
        /forms.ts
        /questions.ts
        /responses.ts
        /workspaces.ts
      /migrations/              # Migrações Drizzle
    /types
      /form.ts                 # FormSchema, QuestionType, etc.
      /theme.ts                # ThemeConfig
      /logic.ts                # ConditionalLogic, LogicRule
      /api.ts                  # Request/Response types
    /validators
      /form.ts                 # Zod schemas pra validação
      /response.ts
    /utils
      /slug.ts                 # Geração de slugs únicos
      /analytics.ts            # Helpers de analytics
      /export.ts               # Exportação CSV/JSON
    /hooks
      /use-form-builder.ts     # Hook principal do builder
      /use-form-renderer.ts    # Hook principal do renderer
      /use-keyboard-nav.ts     # Navegação por teclado
      /use-auto-save.ts        # Auto-save com debounce
      /use-analytics.ts        # Hook de analytics

  /stores
    /builder-store.ts          # Estado do editor (Zustand)
    /renderer-store.ts         # Estado do preenchimento
    /ui-store.ts               # Estado de UI global

  /config
    /question-types.ts         # Registry de tipos de pergunta
    /themes.ts                 # Definições de temas
    /constants.ts              # Constantes globais
```

---

## Convenções de Código

### TypeScript
- **NUNCA usar `any`**. Use `unknown` + type guards quando necessário.
- **NUNCA usar `as` type assertions** a menos que seja absolutamente necessário e documentado.
- Todos os componentes devem ter types explícitos pra props.
- Usar `interface` pra objetos extensíveis, `type` pra unions e tipos utilitários.
- Enums: usar `as const` objects ao invés de `enum` do TypeScript.

### Componentes React
- Apenas function components com hooks.
- Props devem aceitar `className?: string` quando fizer sentido.
- Usar `forwardRef` pra componentes que encapsulam inputs.
- Separar lógica (hooks) da apresentação (componentes).
- Componentes puros de UI em `/components/ui`, lógica de negócio nos hooks.

### Nomenclatura
- Arquivos: `kebab-case.ts` / `kebab-case.tsx`
- Componentes: `PascalCase`
- Hooks: `useCamelCase`
- Tipos/Interfaces: `PascalCase`
- Constantes: `UPPER_SNAKE_CASE`
- Funções utilitárias: `camelCase`
- Variáveis de ambiente: `NEXT_PUBLIC_` pra client, sem prefixo pra server

### Dados e Estado
- **Server Actions** pra todas as mutations (criar, editar, deletar).
- **Zustand** pra estado do builder e renderer no client.
- **React Query / SWR** NÃO — usar Server Components + revalidação do Next.js.
- Validação com **Zod** em toda fronteira de dados (API, forms, DB).
- Queries de banco encapsuladas em `/lib/db/queries/`.

### Estilização
- Tailwind CSS pra tudo. Sem CSS modules, sem styled-components.
- shadcn/ui como base. Customizar via Tailwind, não por override de CSS.
- Usar `cn()` (clsx + tailwind-merge) pra composição condicional de classes.
- Cores do tema via CSS custom properties + Tailwind.
- Componentes de formulário público devem respeitar o tema definido pelo criador.

### Testes
- Vitest pra unit tests.
- Testing Library pra component tests.
- Todo componente de field (em `/components/renderer/fields/`) deve ter teste.
- Queries de banco devem ter testes com banco em memória.
- Nomenclatura: `*.test.ts` / `*.test.tsx` ao lado do arquivo.

---

## Regras de Negócio

### Formulários
- Cada formulário tem um `slug` único, gerado automaticamente, editável pelo usuário.
- Status: `draft` → `published` → `closed`. Só `published` aceita respostas.
- Auto-save no builder com debounce de 2 segundos.
- Limite de perguntas por plano (free: 10, pro: ilimitado).

### Perguntas
- Ordem controlada por campo `order` (integer).
- Cada tipo tem seu `properties` schema (Zod) específico.
- Lógica condicional armazenada em `logicRules` na pergunta de destino.
- Welcome screen e Thank You screen são tipos especiais (máximo 1 de cada por form).

### Respostas
- Uma `Response` contém múltiplos `Answer`.
- `Response.metadata` captura: IP (anonimizado), user-agent, UTM params, timestamp de início.
- Validação server-side de campos obrigatórios antes de salvar.
- Respostas parciais são salvas (campo `completedAt` null = parcial).

### Temas
- Temas predefinidos + customização.
- Cores definidas via CSS custom properties injetadas no formulário público.
- Fontes carregadas via Google Fonts no formulário público.

---

## Padrões de Implementação

### Novo tipo de pergunta
1. Adicionar ao registry em `/config/question-types.ts`
2. Criar Zod schema de properties em `/lib/validators/form.ts`
3. Criar componente de field em `/components/renderer/fields/`
4. Criar componente de editor em `/components/builder/`
5. Adicionar ao switch no `question-renderer.tsx`
6. Escrever testes

### Nova integração
1. Criar route handler em `/app/api/webhooks/`
2. Adicionar tipo de integração nos types
3. Criar UI de configuração no builder
4. Documentar formato do payload

### Server Action pattern
```typescript
"use server"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const schema = z.object({ /* ... */ })

export async function createForm(input: z.infer<typeof schema>) {
  const validated = schema.parse(input)
  // ... lógica
  revalidatePath("/dashboard")
  return { success: true, data: result }
}
```

---

## Comandos

```bash
# Dev
pnpm dev                    # Servidor de desenvolvimento
pnpm db:push                # Push schema pro Supabase
pnpm db:generate            # Gerar migrations
pnpm db:studio              # Abrir Drizzle Studio

# Build & Deploy
pnpm build                  # Build de produção
pnpm lint                   # ESLint
pnpm typecheck              # TypeScript check

# Testes
pnpm test                   # Rodar todos os testes
pnpm test:watch             # Watch mode
pnpm test:coverage          # Coverage report
```

---

## Decisões Arquiteturais (ADRs)

### ADR-001: JSON columns pra properties e values
**Contexto:** Tipos de pergunta têm schemas diferentes. Respostas variam por tipo.
**Decisão:** Usar colunas JSONB no PostgreSQL com validação Zod na aplicação.
**Consequência:** Flexibilidade máxima pra adicionar tipos sem migration. Trade-off: queries em JSON são mais lentas, mas pra nosso volume é irrelevante.

### ADR-002: Zustand ao invés de Context pra estado do builder
**Contexto:** Builder tem estado complexo (perguntas, drag, undo/redo, preview).
**Decisão:** Zustand com slices. Permite selectors granulares e middleware (undo/redo com immer).
**Consequência:** Performance melhor que Context (sem re-renders desnecessários), API simples.

### ADR-003: Formulário público como Single Page (não SSR)
**Contexto:** Formulários públicos são interativos (transições, keyboard nav).
**Decisão:** Client component com fetch inicial dos dados via Server Component wrapper.
**Consequência:** UX fluida tipo Typeform. SEO não é prioridade pra formulários.

### ADR-004: Drizzle ao invés de Prisma
**Contexto:** Precisamos de type-safety com flexibilidade SQL.
**Decisão:** Drizzle ORM — mais leve, SQL-like, melhor DX com Supabase.
**Consequência:** Queries mais explícitas, bundle menor, sem overhead de engine.
