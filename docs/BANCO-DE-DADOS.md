# Banco de dados

Guia do schema, migrations e operações comuns com Drizzle ORM + Supabase.

---

## Mapa das tabelas

```
users
  └─< workspaceMembers >─┐
  └─< forms              │
                         │
workspaces ─────────────>┘
  └─< forms
        └─< questions
        └─< responses
        │     └─< answers
        └─< integrations
```

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
| `plan` | enum | `free` \| `pro` \| `business` |
| `createdAt` | timestamp | — |
| `updatedAt` | timestamp | — |

### workspaces

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | — |
| `ownerId` | UUID FK → users | Cascade delete |
| `name` | text | Nome do workspace |
| `slug` | text unique | Identificador URL-friendly |

### forms

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | — |
| `workspaceId` | UUID FK → workspaces | — |
| `createdById` | UUID FK → users | — |
| `title` | text | Título do formulário |
| `slug` | text unique | URL: `/f/[slug]` |
| `status` | enum | `draft` \| `published` \| `closed` |
| `theme` | JSONB | `FormThemeConfig` (cores + fonte) |
| `settings` | JSONB | `FormSettings` (redirect, notificações) |
| `responseCount` | integer | Contador desnormalizado |
| `viewCount` | integer | Visualizações |
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

**Tipos do `value` por tipo de pergunta:**
- `short_text`, `long_text`, `email`, `date`, `url`: `"string"`
- `number`, `rating`, `scale`, `nps`: `42`
- `yes_no`: `true` ou `false`
- `multiple_choice`, `dropdown`: `"opção selecionada"`
- `checkbox`: `["opção 1", "opção 2"]`
- `file_upload`: `{ "fileUrl": "https://...", "fileName": "doc.pdf" }`

### integrations

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | — |
| `formId` | UUID FK → forms | — |
| `type` | text | `webhook` \| `email` \| `google_sheets` \| `n8n` \| `zapier` |
| `name` | text | Nome amigável |
| `enabled` | boolean | Se está ativa |
| `config` | JSONB | URL do webhook, e-mail destinatário, etc. |
| `lastTriggeredAt` | timestamp | — |

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

Não configurado por padrão. O tipo `file_upload` pode ser integrado ao Supabase Storage — adicionar bucket `form-uploads` com policy pública de leitura.

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
