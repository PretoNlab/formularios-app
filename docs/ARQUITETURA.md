# Arquitetura

Visão geral das decisões de design e fluxos do sistema.

---

## Camadas da aplicação

```
┌─────────────────────────────────────────────────────┐
│                    Browser / Cliente                │
│  React Client Components + Zustand (builder state) │
└────────────────────┬────────────────────────────────┘
                     │ HTTP / Server Actions
┌────────────────────▼────────────────────────────────┐
│              Next.js App Router (Vercel)            │
│  Server Components · Server Actions · Middleware    │
└────────────────────┬────────────────────────────────┘
                     │ Drizzle ORM
┌────────────────────▼────────────────────────────────┐
│              Supabase (PostgreSQL)                  │
│  Auth · Database · Storage                          │
└─────────────────────────────────────────────────────┘
```

---

## Fluxos principais

### Autenticação

```
Usuário acessa /login
  → loginAction (Server Action)
    → supabase.auth.signInWithOAuth()
      → Google OAuth → /auth/callback
        → troca code por session
        → seta cookies
          → redirect /dashboard
```

- Login com Google: `src/app/api/auth/login/route.ts` (inicia OAuth)
- Callback: `src/app/auth/callback/route.ts` (finaliza, seta cookie manualmente)
- Proteção de rotas: `middleware.ts` (verifica session em toda request)
- Cliente Supabase server-side: `src/lib/supabase/server.ts`

### Builder (editor de formulário)

```
/builder/[formId]
  → Server Component carrega form + questions do banco
    → BuilderClient (Client Component, recebe dados via props)
      → builder-store.ts (Zustand) gerencia estado local
        → Auto-save com debounce 2s → Server Actions
          → updateFormAction / updateQuestionAction
```

- Store: `src/stores/builder-store.ts`
- Server Actions: `src/app/actions/forms.ts`, `src/app/actions/questions.ts` (implied)
- Auto-save hook: `src/lib/hooks/use-auto-save.ts`

### Preenchimento de formulário (público)

```
/f/[slug]
  → Server Component busca form por slug
    → FormRendererPage (Client Component)
      → Captura UTMs + device type no mount
      → Navega pergunta a pergunta
      → Aplica lógica condicional (logicRules)
      → submitResponseAction (Server Action)
        → Valida com Zod
        → Rate limiting (IP hash no banco)
        → Salva response + answers no banco
        → Dispara webhooks configurados
```

- Renderizador: `src/components/renderer/form-renderer-page.tsx`
- Action: `src/app/actions/responses.ts`
- Campos: `src/components/renderer/fields/` (um arquivo por tipo)

### Analytics

```
/responses/[formId]
  → Server Component busca responses + analytics
    → ResponsesSection (Client Component)
      Aba "Respostas": tabela com expand por linha
      Aba "Perguntas": visualização por tipo de pergunta
        → botão "Analisar com IA" → analyzeTextResponsesAction
            → Claude Haiku: temas, sentimento, keywords
      Aba "Visão geral": gráficos + insight cards automáticos
```

- Queries: `src/lib/db/queries/responses.ts` (getFormAnalytics)
- UI: `src/components/dashboard/responses-section.tsx`
- Action IA: `src/app/actions/ai-analysis.ts`

---

## Decisões arquiteturais

### Por que `--webpack` no dev server?

O Turbopack (padrão no Next.js 16) tem um bug com `performance.measure` que causa crash em modo dev. O flag `--webpack` força o bundler legado. Sem esse flag o servidor não inicia.

Script: `"dev": "next dev -p 3000 --webpack"`

### Por que conexão direta no Supabase (porta 5432)?

O Supabase oferece dois modos de conexão:
- **Direct** (5432): conexão PostgreSQL real, suporta todas as features do Drizzle
- **Transaction Pooler** (6543): intermediário HTTP, incompatível com prepared statements do Drizzle

Use sempre `db.[PROJECT-REF].supabase.co:5432`. Se usar o pooler, queries complexas com Drizzle falham silenciosamente.

### Por que Zustand e não Context API?

O builder tem estado complexo: lista de perguntas, drag & drop, pergunta selecionada, preview mode, undo/redo. Com Context, qualquer mudança de estado re-renderiza toda a árvore. Zustand usa selectors granulares — só o componente que assina aquela fatia do estado re-renderiza.

### Por que Server Actions e não Route Handlers?

Server Actions simplificam o fluxo: nenhum fetch manual, nenhuma serialização, TypeScript end-to-end. O cliente chama uma função, o servidor executa. Para mutations (criar, editar, deletar) isso é superior. Route Handlers só são usados onde o protocolo HTTP importa (webhook recebimento, OAuth callback).

### Por que Drizzle ORM e não Prisma?

- Bundle menor (importante para edge/serverless)
- Sintaxe SQL-like (mais previsível, sem "magia")
- Melhor DX com JSONB columns do PostgreSQL
- Sem overhead de engine de query separada

### Por que JSONB para properties e values?

Cada tipo de pergunta tem um schema diferente de propriedades. Cada resposta tem um valor diferente por tipo. Usar JSONB com validação Zod na aplicação dá flexibilidade máxima para adicionar tipos sem migrations.

Trade-off: queries em JSON são mais lentas, mas para o volume atual é irrelevante.

### Por que o formulário público é client-side (não SSR)?

Formulários públicos são interativos (transições animadas, keyboard nav pergunta-a-pergunta, lógica condicional). Render é Client Component com fetch inicial via Server Component wrapper. UX fluida tipo Typeform. SEO não é prioridade para formulários — landing page e templates sim.

### Por que o núcleo de submit é função pura isolada?

A submissão de resposta acontece via dois entrypoints: Route Handler `/api/responses/submit` (renderer público) e Server Action (preview/teste). Validação, sanitização, IP-hashing e dispatch de integrações precisam ser **idênticos** entre os dois.

`src/lib/submit-response-core.ts` é função pura testada com Vitest. Os entrypoints só fazem parsing/auth e delegam. Mesma garantia vale para `src/lib/logic-engine.ts` (lógica condicional).

### Por que quotas e créditos são eixos paralelos?

Plano controla quotas duras (`formQuota`, `responseQuota` — limite de acesso). Créditos (`creditBalance`) são moeda paralela para features pay-per-use (IA, exports premium). Isso permite que o Lote Fundador dê plano vitalício + créditos iniciais sem confundir os dois eixos.

---

> Para o passo-a-passo de "como adicionar um tipo de pergunta novo", ver [PADROES.md](PADROES.md).

---

## Sistema de temas

Temas são definidos em `src/config/themes.ts` como objetos com cores CSS.

No formulário público, as cores do tema são injetadas como CSS custom properties:

```tsx
// ThemeConfig → CSS variables no <style>
--form-bg: #1a1a2e;
--form-accent: #7c3aed;
--form-text: #ffffff;
```

Os componentes de campo usam `var(--form-bg)` etc., então todos respondem ao tema automaticamente.

Fontes são carregadas via Google Fonts usando `preload()` do `react-dom` dentro do componente `FormStyles` em `form-renderer.tsx`. Isso emite um `<link rel="preload">` cedo no ciclo de render, reduzindo FOUT (flash de texto sem estilo).

---

## Estrutura de dados das respostas

```
Response (uma por preenchimento)
  └── metadata: {
        userAgent, ipHash (SHA-256 anonimizado),
        utmSource, utmMedium, utmCampaign,
        referrer, deviceType
      }
  └── completedAt: null = resposta parcial

Answer (uma por pergunta respondida)
  └── value: JSONB
        string      → texto, email, date
        number      → rating, scale, nps
        boolean     → yes_no
        string[]    → multiple_choice, checkbox
        { fileUrl, fileName } → file_upload
```

---

## Rate limiting

Sem Redis. Limitação feita no banco de dados:

```
SELECT count(*) FROM responses
WHERE formId = X
  AND metadata->>'ipHash' = SHA256(clientIP)
  AND createdAt > NOW() - INTERVAL '60 minutes'
```

Limite: 5 submissões por IP por formulário por hora.

---

## Padrões de performance (Vercel React Best Practices)

Decisões ativas de performance no codebase:

| Padrão | Onde | Por quê |
|--------|------|---------|
| `React.cache()` em `getFormBySlug` | `lib/db/queries/forms.ts` | Deduplica a query de slug entre `generateMetadata` e o Page component — ambos chamavam o banco separadamente |
| `after()` em `incrementViewCount` | `app/f/[slug]/page.tsx` | Garante execução após a resposta HTTP ser enviada; `void` podia ser cancelado pela serverless |
| `Promise.all` em `/builder/[formId]` | `app/builder/[formId]/page.tsx` | `ensureUserExists` e `getFormById` não dependem um do outro — rodavam sequencialmente sem necessidade |
| `mapDbForm` centralizado | `lib/utils/map-db-form.ts` | Função estava duplicada em dois pages; única fonte de verdade evita divergência |
| `useShallow` no BuilderClient | `components/builder/builder-client.tsx` | Consolida 25 subscriptions Zustand em 3, reduzindo re-renders por mudança de store |
| `useMemo` no sidebar de campos | `components/builder/builder-client.tsx` | Filtragem de tipos de campo re-executava em todo render do pai |
| `preload()` do `react-dom` | `components/renderer/form-renderer.tsx` | Emite `<link rel="preload">` para Google Fonts antes da hidratação, eliminando FOUT |
| Deps primitivas em `goNext`/`goBack` | `components/renderer/form-renderer.tsx` | Evita recriar callbacks de navegação quando apenas `animating` ou `direction` mudam |
| Cleanup de timers de animação | `components/renderer/form-renderer.tsx` | Previne `setState` em componente desmontado durante transição de pergunta |
