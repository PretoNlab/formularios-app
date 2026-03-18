# Onboarding — Mapa de Implementação

Visão geral de todas as peças do onboarding: o que está feito, o que está planejado e o que ainda não foi iniciado.

---

## Status geral

```
Signup ──► Auth callback ──► Dashboard ──► Builder ──► Primeira resposta
  ✅            ✅               ✅           ✅ (v2)         ✅
```

---

## Parte 1 — Signup

**Status:** ✅ Implementado

**Arquivo:** `src/app/(auth-pages)/signup/page.tsx`

| O que faz |
|-----------|
| Layout split: branding à esquerda, formulário à direita |
| Google OAuth + email/senha |
| Tela de confirmação com atalhos para Gmail / Outlook |
| Indicador de força da senha |
| Botão de reenvio do email de confirmação |

---

## Parte 2 — Auth callback (novo usuário)

**Status:** ✅ Implementado

**Arquivo:** `src/app/auth/callback/route.ts`

| O que faz |
|-----------|
| Detecta se é primeiro acesso (`isNewUser`) |
| Cria usuário + workspace + membership em transação atômica |
| Concede 50 créditos de boas-vindas (`type: "welcome"`) |
| Redireciona para `/dashboard?welcome=true` se novo usuário |
| Envia email de boas-vindas via Resend |

**Arquivos de suporte:**
- `src/lib/db/queries/users.ts` — `ensureUserExists()`
- `src/lib/credits.ts` — `WELCOME_CREDITS = 50`
- `src/lib/email.ts` — template do email de boas-vindas

---

## Parte 3 — Dashboard: modal de boas-vindas

**Status:** ✅ Implementado

**Arquivo:** `src/components/dashboard/forms-section.tsx`
**Chave localStorage:** `formularios_onboarded_v2`

| O que faz |
|-----------|
| Dispara quando `?welcome=true` está na URL OU primeira visita (localStorage) |
| Mostra mensagem de boas-vindas com os 50 créditos |
| Destaca 3 diferenciais: Formulários Conversacionais, Analytics com IA, Métricas em tempo real |
| CTAs: "Criar formulário" / "Explorar depois" |
| Auto-descarta e grava flag no localStorage |

---

## Parte 4 — Dashboard: checklist de primeiros passos

**Status:** ✅ Implementado

**Arquivo:** `src/components/dashboard/forms-section.tsx`
**Chave localStorage:** `formularios_checklist_v1`

| Passo | Critério de conclusão |
|-------|-----------------------|
| Criar um formulário | `forms.length > 0` |
| Adicionar 3+ perguntas | `forms.some(f => f.questionCount >= 3)` |
| Publicar o formulário | `forms.some(f => f.status === "published")` |
| Receber 1ª resposta | `forms.some(f => f.responseCount > 0)` |

Barra de progresso visual. Ao completar todos os passos: celebração (🎉) e auto-dismiss após 3s.

---

## Parte 5 — Dashboard: empty state

**Status:** ✅ Implementado

**Arquivo:** `src/components/dashboard/forms-section.tsx`

| O que faz |
|-----------|
| Quando o usuário tem 0 formulários: mostra empty state completo |
| Breakdown de 3 colunas: Criar → Publicar → Coletar |
| CTAs: "Criar formulário" e "Ver templates" |
| Estado separado quando busca não retorna resultados |

---

## Parte 6 — Templates

**Status:** ✅ Implementado

**Arquivos:** `src/config/templates.ts`, `src/components/dashboard/forms-section.tsx`

10 templates pré-configurados com welcome screen, perguntas e tempo estimado:

| Template | Tempo |
|----------|-------|
| NPS | 2 min |
| Feedback de Cliente | 3 min |
| Solicitação de Feature | 5 min |
| Formulário de Contato | 1 min |
| Candidatura de Emprego | 8 min |
| Clima de Equipe | 5 min |
| Inscrição em Evento | 3 min |
| Satisfação com Suporte | 2 min |
| + 2 outros | — |

Criação instantânea via `createFormFromTemplateAction`.

---

## Parte 7 — Tour do builder

**Status:** ✅ Implementado (melhorado em mar/2026)

**Arquivo:** `src/components/builder/builder-client.tsx` — componente `BuilderTour`
**Chave localStorage:** `formularios_builder_tour_v2`

| Passo | Área destacada | Conteúdo |
|-------|---------------|----------|
| 1/3 | Sidebar esquerda (azul) | "Adicione campos" — clicar e arrastar |
| 2/3 | Canvas central (violeta) | "Edite e configure" — selecionar campo, propriedades à direita |
| 3/3 | Barra superior (verde) | "Publique e compartilhe" — link de compartilhamento |

**Componente `BuilderDiagram`:** maquete visual do layout do builder com a zona do step atual destacada. Animação fade + slide entre steps.

---

## Parte 8 — Email de primeira resposta

**Status:** ✅ Implementado

**Arquivo:** `src/lib/email.ts`

| O que faz |
|-----------|
| Disparado quando o formulário recebe a primeira resposta |
| Tom celebratório: "Marco atingido 🎉" |
| CTA direto para a página de analytics da resposta |

---

## Backlog — não iniciado

Ordenado por impacto estimado:

| # | Funcionalidade | Impacto | Complexidade |
|---|---------------|---------|--------------|
| 1 | **Re-engajamento** — email para usuários que criaram conta mas não publicaram em 7 dias | Alto | Média (requer job agendado) |
| 2 | **Explicação de créditos** — tooltip contextual mostrando o que consome crédito, exibido na primeira abertura de Analytics | Alto | Baixa |
| 3 | **Onboarding de analytics** — empty state na página de analytics antes de ter respostas, explicando o que vai aparecer | Médio | Baixa |
| 4 | **Highlight de features avançadas** — após publicar o 1º form, mostrar card "Você desbloqueou: webhooks, IA e integrações" | Médio | Baixa |
| 5 | **Onboarding de integrações** — guided setup para webhook / Google Sheets na primeira configuração | Médio | Alta |
| 6 | **Re-engajamento de inatividade** — email para usuários sem login há 30 dias com "novidades" | Baixo | Média |
