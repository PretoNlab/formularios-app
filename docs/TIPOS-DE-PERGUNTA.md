# Tipos de Pergunta

Registry completo dos 26 tipos suportados, suas categorias e onde cada peça vive no código.

> **Carregar este doc quando:** for adicionar, editar ou debugar um tipo de pergunta, mexer no renderer ou no editor de propriedades.

---

## Fonte da verdade

- **Registry:** `src/lib/types/form.ts` → `QUESTION_TYPES` (objeto `as const`)
- **Union type:** `QuestionType = keyof typeof QUESTION_TYPES`
- **Map componente:** `src/components/renderer/fields/index.ts` → `FIELD_COMPONENTS`
- **Sidebar do builder:** `src/lib/types/question-types.ts` → `QUESTION_TYPE_GROUPS`
- **Defaults de properties:** `src/lib/types/question-types.ts` → `getDefaultProperties()`

---

## Tipos por categoria

### Input (10)
| Tipo | Label | `hasOptions` |
|---|---|---|
| `short_text` | Texto curto | não |
| `long_text` | Texto longo | não |
| `email` | E-mail | não |
| `number` | Número | não |
| `phone` | Telefone (internacional) | não |
| `whatsapp` | WhatsApp (BR) | não |
| `cpf` | CPF | não |
| `cnpj` | CNPJ | não |
| `date` | Data | não |
| `url` | URL | não |

### Selection (4)
| Tipo | Label | `hasOptions` |
|---|---|---|
| `multiple_choice` | Múltipla escolha (única) | sim |
| `checkbox` | Caixas de seleção (múltipla) | sim |
| `dropdown` | Dropdown | sim |
| `yes_no` | Sim / Não | não |

### Rating (4)
| Tipo | Label | `hasOptions` |
|---|---|---|
| `rating` | Avaliação (estrelas/corações/etc.) | não |
| `scale` | Escala | não |
| `nps` | NPS (0-10) | não |
| `opinion_scale` | Escala de Opinião | não |

### Layout (3)
| Tipo | Label | Observação |
|---|---|---|
| `welcome` | Tela de boas-vindas | máximo 1 por form |
| `statement` | Declaração (texto sem input) | — |
| `thank_you` | Tela de agradecimento | máximo 1 por form |

### Advanced (5)
| Tipo | Label | `hasOptions` |
|---|---|---|
| `file_upload` | Upload de arquivo | não |
| `download` | Download de arquivo (criador → respondente) | não |
| `signature` | Assinatura digital | não |
| `matrix` | Matriz (grade) | sim |
| `ranking` | Ranking | sim |

---

## Sidebar do builder ≠ FIELD_COMPONENTS

`FIELD_COMPONENTS` tem os 26 tipos. `QUESTION_TYPE_GROUPS` (sidebar do builder) hoje expõe um subconjunto — alguns tipos existem como componente mas não aparecem no painel de adicionar pergunta. Ao adicionar tipo novo, atualizar **ambos**.

---

## Formato do `value` em `answers.value` (JSONB)

| Tipos | Formato |
|---|---|
| `short_text`, `long_text`, `email`, `date`, `url`, `phone`, `whatsapp`, `cpf`, `cnpj` | `string` |
| `number`, `rating`, `scale`, `nps`, `opinion_scale` | `number` |
| `yes_no` | `boolean` |
| `multiple_choice`, `dropdown` | `string` (label da opção) |
| `checkbox` | `string[]` (labels das opções) |
| `ranking` | `string[]` (labels ordenados) |
| `matrix` | `Record<rowId, colId>` |
| `file_upload` | `{ fileUrl, fileName }` |
| `signature` | `{ dataUrl }` (PNG base64) |
| `welcome`, `statement`, `thank_you`, `download` | sem `answer` (não capturam resposta) |

> **Bug histórico:** respostas salvas antes do commit `f1775fd8` em `multiple_choice`, `dropdown` e `checkbox` armazenam `opt.id` (UUID) em vez do label. Novas respostas estão corretas.

---

## Onde editar propriedades de cada tipo

O painel de propriedades do builder fica em `src/components/builder/panels/properties-panel.tsx`. Editores específicos (lista de opções, mídia, download) ficam em `src/components/builder/editors/`. O schema das `properties` vive em `src/lib/types/form.ts` → interface `QuestionProperties`.
