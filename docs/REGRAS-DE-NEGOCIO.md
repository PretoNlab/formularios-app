# Regras de Negócio

Comportamentos do domínio que não são derivados do schema nem óbvios pelo código. Use isso pra entender o "porquê" antes de mexer em fluxos críticos.

> **Carregar este doc quando:** for mexer em lógica de formulários, respostas, planos, quotas, créditos, temas, integrações ou IA.

---

## Formulários

- Cada form tem `slug` único, gerado automaticamente em `src/lib/utils/slug.ts`, editável pelo usuário (com checagem em `/api/forms/check-slug`).
- Status: `draft` → `published` → `closed`. **Só `published` aceita respostas** — o renderer público bloqueia os outros.
- Auto-save no builder com debounce de **2 segundos** (Server Actions `updateFormAction` + `upsertQuestionsAction`).
- Limite de formulários por plano (campo `formQuota` em `users`).

---

## Perguntas

- Ordem controlada por `questions.order` (integer). Reorder via `@dnd-kit`.
- Cada tipo tem `properties` específico (JSONB) — schema varia por tipo. Ver [TIPOS-DE-PERGUNTA.md](TIPOS-DE-PERGUNTA.md).
- Lógica condicional fica em `logicRules` da pergunta de destino (não da origem), avaliada por `src/lib/logic-engine.ts` (função pura, testada).
- `welcome` e `thank_you` são tipos especiais: **máximo 1 de cada por formulário**.

---

## Respostas

- Uma `Response` agrupa N `Answer` (1 por pergunta respondida).
- `Response.metadata` captura: `ipHash`, `userAgent`, UTM params (`utmSource`, `utmMedium`, `utmCampaign`), `referrer`, `deviceType`, timestamp de início.
- **Validação server-side** dos campos obrigatórios antes de marcar `completedAt`. Resposta com obrigatório faltando fica como parcial.
- **Respostas parciais persistem** (`completedAt = null`). O renderer salva progresso a cada pergunta via `POST /api/responses/progress`.
- Núcleo de submit isolado em `src/lib/submit-response-core.ts` (função pura, testada). Server Action e Route Handler delegam pra essa função.
- Rate limit: **5 submissões por IP por formulário por hora** (consulta o banco, sem Redis).

---

## Planos e quotas

Enum `plan`: `free` | `pro` | `business` | `founder`.

| Campo (em `users`) | Função |
|---|---|
| `plan` | Plano atual |
| `planExpiresAt` | Quando expira (null = vitalício, p.ex. `founder`) |
| `formQuota` | Máximo de formulários |
| `responseQuota` | Máximo de respostas no período |
| `responseUsed` | Respostas usadas no período (reset ao renovar) |
| `creditBalance` | Saldo de créditos (paralelo ao plano) |

**Lote Fundador** (`founder`): plano vitalício, comprado uma única vez, ainda disponível enquanto a contagem permitir. Não expira.

---

## Créditos (moeda paralela)

- `creditBalance` é consumido por features pay-per-use: geração e análise de IA, exports premium, etc.
- Movimentações vão pra `credit_transactions` (débitos/créditos com motivo).

---

## Pagamentos

- Sem provedor de pagamento integrado no momento. Compra do Lote Fundador e recargas está indisponível (UI mostra aviso de indisponibilidade em `/billing`).

---

## Temas

- Predefinidos em `src/config/themes.ts`. Usuário pode customizar cor/fonte/border-radius.
- Aplicação: CSS custom properties (`--form-bg`, `--form-accent`, `--form-text`) injetadas no `<style>` do form público.
- Fontes carregadas via Google Fonts com `preload()` do `react-dom` (reduz FOUT).
- Cada workspace tem `brandKit` opcional (cores e logo padrão aplicáveis a novos forms).

---

## Integrações

| Tipo | Onde mora a config |
|---|---|
| `webhook` | URL configurável por form, POST com payload JSON |
| `google_sheets` | OAuth + `googleapis`, escreve nova resposta numa planilha |
| `email` | Resend, notifica criador a cada nova resposta |
| `n8n`, `zapier` | Webhook + provider-specific |

Config armazenada em `integrations.config` (JSONB). Tipo discriminado em `integrations.type`.

---

## IA (Gemini)

- **Geração** de formulário a partir de descrição em linguagem natural — em `src/app/actions/ai.ts`.
- **Análise** de respostas (sumário, sentimento, padrões) — em ação dedicada por tipo de análise.
- **Cobra créditos** (`creditBalance`) por chamada. Sem saldo → bloqueia.
- Cliente em `src/lib/ai/google-ai.ts`.

---

## Segurança e privacidade (LGPD)

- IPs são salvos **hashados** com `IP_HASH_SALT` (SHA-256). Sem o salt em produção, o servidor **rejeita respostas**.
- Toda Server Action/Route Handler que toca dados de form valida **ownership** (workspace do usuário autenticado).
- Conteúdo de usuário (perguntas, respostas, opções) é tratado como untrusted — sempre `escapeHtml` antes de injetar em e-mail/HTML.
- Uploads validados por **extensão E MIME type**. Buckets do Storage têm policies separadas por finalidade.

---

## Buckets do Supabase Storage

- `form-responses` — uploads do campo `file_upload` (público, INSERT anônimo + SELECT público).
- Buckets adicionais para logos/temas/downloads do criador conforme uso.
- Setup SQL em `/supabase/storage-setup.sql`.

> **Pendência produção:** bucket `form-responses` precisa ser criado manualmente no Supabase Storage do projeto de prod.
