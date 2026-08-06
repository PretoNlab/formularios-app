# Banco de dados

Guia do schema, migrations e operações comuns com Drizzle ORM + Supabase.

---

## Mapa das tabelas

```
users
  ├─< workspaces (owner)
  ├─< workspace_members
  └─< credit_transactions

workspaces
  ├─< workspace_members
  └─< forms
        ├─< questions
        ├─< responses
        │     └─< answers
        └─< integrations
```

Total: **9 tabelas**.

---

## Schema das tabelas

### users

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | ID interno |
| `supabaseAuthId` | text unique | ID do Supabase Auth (vinculo auth ↔ app) |
| `email` | text unique | E-mail do usuário |
| `name` | text | Nome de exibição |
| `avatarUrl` | text | URL do avatar |
| `plan` | enum | `free` \| `pro` \| `business` \| `founder` |
| `creditBalance` | integer | Saldo de créditos (default 0) |
| `responseQuota` | integer | Limite de respostas no período (default 50) |
| `responseUsed` | integer | Respostas usadas no período (default 0) |
| `formQuota` | integer | Limite de formulários (default 3) |
| `planStartedAt` | timestamp | Início do plano atual |
| `planExpiresAt` | timestamp | Expiração (null = vitalício) |
| `createdAt` | timestamp | — |
| `updatedAt` | timestamp | — |

### workspaces

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | — |
| `ownerId` | UUID FK → users | Cascade delete |
| `name` | text | Nome do workspace |
| `slug` | text unique | Identificador URL-friendly |
| `brandKit` | JSONB | Cores/logo padrão aplicáveis a novos forms |

### workspace_members

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | — |
| `workspaceId` | UUID FK → workspaces | Cascade delete |
| `userId` | UUID FK → users | Cascade delete |
| `role` | text | `owner` \| `admin` \| `member` (default `member`) |
| `createdAt` | timestamp | — |

Unique: `(workspaceId, userId)`.

### forms

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | — |
| `workspaceId` | UUID FK → workspaces | Cascade delete |
| `createdById` | UUID FK → users | — |
| `title` | text | Título (default "Formulário sem título") |
| `description` | text | Descrição (opcional) |
| `slug` | text unique | URL: `/f/[slug]` |
| `status` | enum | `draft` \| `published` \| `closed` |
| `theme` | JSONB | `FormThemeConfig` (cores + fonte + border-radius) |
| `settings` | JSONB | `FormSettings` (redirect, notificações, auto-responder, download) |
| `responseCount` | integer | Contador desnormalizado |
| `viewCount` | integer | Visualizações |
| `shareToken` | text unique | Token para analytics público |
| `isAnalyticsPublic` | boolean | Habilita acesso público ao analytics |
| `publishedAt` | timestamp | Quando foi publicado |

### questions

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | — |
| `formId` | UUID FK → forms | — |
| `type` | text | Tipo da pergunta (ver lista completa) |
| `title` | text | Texto da pergunta |
| `description` | text | Texto auxiliar |
| `required` | boolean | Se é obrigatório |
| `order` | integer | Posição no formulário (começa em 0) |
| `properties` | JSONB | Schema varia por tipo (opções, range, etc.) |
| `logicRules` | JSONB array | Regras de lógica condicional |

### responses

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | — |
| `formId` | UUID FK → forms | — |
| `startedAt` | timestamp | Início do preenchimento |
| `completedAt` | timestamp | null = resposta parcial |
| `lastActiveAt` | timestamp | Última atividade |
| `metadata` | JSONB | Ver estrutura abaixo |

**Estrutura do `metadata`:**
```json
{
  "userAgent": "Mozilla/5.0...",
  "ipHash": "sha256-hash-anonimizado",
  "utmSource": "instagram",
  "utmMedium": "social",
  "utmCampaign": "lancamento",
  "referrer": "https://instagram.com",
  "deviceType": "mobile"
}
```

### answers

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | — |
| `responseId` | UUID FK → responses | — |
| `questionId` | UUID FK → questions | — |
| `value` | JSONB | Valor da resposta (tipo varia) |
| `answeredAt` | timestamp | — |

**Tipos do `value` por tipo de pergunta:** ver [TIPOS-DE-PERGUNTA.md](TIPOS-DE-PERGUNTA.md#formato-do-value-em-answersvalue-jsonb).

Unique: `(responseId, questionId)` — uma resposta por pergunta por sessão.

### integrations

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | — |
| `formId` | UUID FK → forms | Cascade delete |
| `type` | text | `webhook` \| `email` \| `google_sheets` \| `whatsapp` \| `n8n` \| `zapier` |
| `name` | text | Nome amigável |
| `enabled` | boolean | Se está ativa (default `true`) |
| `config` | JSONB | URL do webhook, e-mail destinatário, etc. |
| `lastTriggeredAt` | timestamp | — |

### credit_transactions

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | — |
| `userId` | UUID FK → users | Cascade delete |
| `amount` | integer | Positivo = crédito, negativo = débito |
| `type` | text | `welcome` \| `purchase` \| `usage` |
| `metadata` | JSONB | Detalhes do consumo/crédito (motivo, referências) |

---

## Comandos de banco

### Desenvolvimento (sem controle de versão)

```bash
# Aplica o schema atual diretamente no banco
# Atenção: pode alterar/dropar colunas sem histórico
npm run db:push
```

### Produção (com controle de versão)

```bash
# 1. Gera arquivo SQL de migration baseado nas mudanças do schema
npm run db:generate

# 2. Aplica as migrations pendentes
npm run db:migrate
```

Os arquivos de migration ficam em `/supabase/migrations/` e devem ser commitados.

### GUI do banco

```bash
npm run db:studio
```

Abre o Drizzle Studio em `https://local.drizzle.studio` — interface visual para explorar e editar dados.

---

## Como modificar o schema

1. Edite `src/lib/db/schema.ts` (fonte da verdade)
2. Em dev: `npm run db:push` para aplicar
3. Em produção: `npm run db:generate` → commita o arquivo SQL → `npm run db:migrate` no servidor

### Adicionando uma coluna

```typescript
// src/lib/db/schema.ts
export const forms = pgTable("forms", {
  // ... colunas existentes
  novaColuna: text("nova_coluna"),  // adiciona aqui
})
```

### Adicionando uma coluna JSONB com schema Zod

Colunas JSONB são validadas na aplicação, não no banco. Sempre crie o schema Zod correspondente em `src/lib/types/form.ts`:

```typescript
// Schema do banco (sem validação)
properties: jsonb("properties")

// Schema Zod (validação na aplicação)
const questionPropertiesSchema = z.object({
  novaPropriedade: z.string().optional(),
})
```

---

## Supabase: configurações importantes

### Autenticação

Dashboard → Authentication → URL Configuration:
- **Site URL:** `https://seudominio.com.br`
- **Additional Redirect URLs:** `https://seudominio.com.br/auth/callback`

### Políticas de segurança (RLS)

O projeto usa `SUPABASE_SERVICE_ROLE_KEY` nas Server Actions para bypassar RLS. Isso é seguro pois a chave de serviço nunca vai ao cliente. Não é necessário configurar RLS policies por tabela.

### Storage

Buckets em uso (setup SQL em `/supabase/storage-setup.sql`):

- `form-responses` — uploads do campo `file_upload` (INSERT anônimo + SELECT público).
- Buckets adicionais (logos do tema, downloads do criador) configurados conforme uso.

> **Pendência produção:** bucket `form-responses` precisa ser criado manualmente no Supabase de prod.

---

## Drizzle: padrões do projeto

### Queries ficam em `/lib/db/queries/`

Não escreva queries diretamente nos Server Actions. Centralize em:
- `src/lib/db/queries/forms.ts`
- `src/lib/db/queries/questions.ts`
- `src/lib/db/queries/responses.ts`
- `src/lib/db/queries/users.ts`

### Exemplo de query

```typescript
// src/lib/db/queries/forms.ts
import { db } from "@/lib/db/client"
import { forms, questions } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function getFormWithQuestions(formId: string) {
  const form = await db.query.forms.findFirst({
    where: eq(forms.id, formId),
    with: {
      questions: {
        orderBy: (q, { asc }) => [asc(q.order)],
      },
    },
  })
  return form ?? null
}
```
