# Padrões de Implementação

Receitas para tarefas recorrentes. Cada padrão lista as etapas em ordem, com os arquivos exatos a tocar.

> **Carregar este doc quando:** for adicionar um novo tipo de pergunta, integração, template ou escrever uma Server Action seguindo a convenção do projeto.

---

## Novo tipo de pergunta

1. **Registry** — adicionar entrada em `src/lib/types/form.ts` → `QUESTION_TYPES` (label, icon, category, hasOptions, description).
2. **Schema de properties** — se o tipo tem propriedades novas, adicionar campos em `QuestionProperties` (mesmo arquivo). Validação Zod via `questionPropertiesSchema` quando existir.
3. **Componente de campo** — criar `src/components/renderer/fields/<tipo>.tsx` implementando `FieldProps`. Teste co-localizado: `<tipo>.test.tsx`.
4. **Map do renderer** — registrar em `FIELD_COMPONENTS` em `src/components/renderer/fields/index.ts`.
5. **Sidebar do builder** — adicionar em `QUESTION_TYPE_GROUPS` em `src/lib/types/question-types.ts` (categoria + ordem).
6. **Defaults** — se o tipo precisa de properties iniciais, adicionar em `getDefaultProperties()` em `src/lib/types/question-types.ts`.
7. **Editor de propriedades** — atualizar `src/components/builder/panels/properties-panel.tsx` ou criar editor em `src/components/builder/editors/<tipo>.tsx`.
8. **Validação server-side** — se o tipo tem regras específicas (tamanho, formato), atualizar `src/lib/submit-response-core.ts`.
9. **Analytics** — se o tipo tem visualização especial, adicionar tratamento em `src/lib/db/queries/analytics-aggregation.ts`.

---

## Nova integração

1. **Union de tipo** — adicionar ao `IntegrationType` em `src/lib/types/form.ts`.
2. **Painel de configuração** — criar `src/components/builder/panels/<provider>-panel.tsx`.
3. **Server Action ou Route Handler:**
   - Webhook recebido → `src/app/api/webhooks/<provider>/route.ts`
   - OAuth → `src/app/api/auth/<provider>/route.ts`
   - Mutation simples → `src/app/actions/integrations.ts`
4. **Dispatch** — adicionar trigger no fluxo de `src/lib/submit-response-core.ts` (ou pós-processamento, se a integração for assíncrona).
5. **Documentar payload** — formato JSON da chamada saindo (no doc da integração ou em comentário do painel).

---

## Novo template

1. Adicionar entrada em `src/config/templates.ts` com `questions[]` no formato do domínio (`Question[]`).
2. Aparece automaticamente em `/templates` e no dialog de criação no dashboard.

---

## Server Action

```typescript
"use server"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"

const schema = z.object({ /* campos */ })

export async function minhaAction(input: z.infer<typeof schema>) {
  const user = await requireUser()
  const validated = schema.parse(input)
  // 1. Checar ownership / quota / plano
  // 2. Mutar via queries em /lib/db/queries/
  // 3. revalidatePath ou revalidateTag conforme necessário
  revalidatePath("/dashboard")
  return { success: true, data: result }
}
```

Regras:
- Vive em `src/app/actions/`.
- Todo input passa por Zod parse antes de tocar banco.
- Sempre verificar ownership (workspace do usuário autenticado) antes de mutar.
- Throw em erro fatal; retornar `{ success: false, error }` em erro de validação/regra de negócio que o UI precisa exibir.

---

## Route Handler (quando usar)

Use Route Handler (em `src/app/api/`) só quando:
- É um **webhook** recebendo POST de fora.
- É um **callback OAuth** (Google Sheets).
- É um endpoint do **renderer público** que precisa ser anônimo (responses/start, progress, submit, upload).
- É um **upload** que precisa de streaming (uploads pra Supabase Storage).

Para tudo mais (mutations chamadas por componentes do dashboard/builder), use Server Action.

---

## Hook reusável

Quando extrair lógica de Client Component pra um hook, criar `src/lib/hooks/use-<nome>.ts`. Hoje a maioria dos hooks vive inline; ao extrair o primeiro, criar a pasta.
