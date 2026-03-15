# formularios.ia.br

Form builder SaaS para o mercado brasileiro — alternativa ao Typeform/Tally com foco em WhatsApp, IA e analytics avançados.

**Produto ao vivo:** [formularios.ia.br](https://formularios.ia.br)

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14+ (App Router) |
| Linguagem | TypeScript strict |
| Estilização | Tailwind CSS + shadcn/ui |
| Estado client | Zustand |
| Banco de dados | Supabase (PostgreSQL) |
| ORM | Drizzle ORM |
| Autenticação | Supabase Auth (email + Google OAuth) |
| Validação | Zod |
| Drag & Drop | @dnd-kit/core |
| E-mail | Resend |
| IA | Anthropic (Claude Haiku) |
| Deploy atual | Vercel |

---

## Pré-requisitos

- Node.js 18+
- npm ou pnpm
- Conta no [Supabase](https://supabase.com) (gratuito)
- Conta no [Resend](https://resend.com) (gratuito)
- Conta no [Anthropic](https://console.anthropic.com) (opcional, para análise com IA)

---

## Setup local

### 1. Clone e instale dependências

```bash
git clone https://github.com/PretoNlab/formularios-app.git
cd formularios-app
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` e preencha todos os valores. Veja a seção [Variáveis de ambiente](#variáveis-de-ambiente) abaixo.

### 3. Configure o banco de dados

Com as variáveis preenchidas, sincronize o schema com o Supabase:

```bash
npm run db:push
```

> Isso aplica todas as tabelas e índices do schema Drizzle diretamente no banco. Use apenas em desenvolvimento. Em produção, prefira `db:generate` + `db:migrate`.

### 4. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

> **Importante:** o flag `--webpack` é obrigatório. O Turbopack tem um bug com `performance.measure` no Next.js 16 que causa crash em dev. O script já inclui o flag automaticamente.

---

## Scripts

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (porta 3000, webpack) |
| `npm run build` | Build de produção |
| `npm run start` | Inicia o servidor de produção local |
| `npm run lint` | ESLint |
| `npm run db:push` | Aplica schema no banco (dev — sem migration file) |
| `npm run db:generate` | Gera arquivos de migration SQL |
| `npm run db:migrate` | Aplica migrations geradas (produção) |
| `npm run db:studio` | Abre Drizzle Studio (GUI do banco) |

---

## Variáveis de ambiente

Todas as variáveis estão documentadas em [`.env.example`](.env.example).

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | ✅ | URL do PostgreSQL (Supabase, conexão direta porta 5432) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Chave anon do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Chave service role (server-side only) |
| `NEXT_PUBLIC_APP_URL` | ✅ | URL base da aplicação |
| `RESEND_API_KEY` | ✅ | Chave da API do Resend |
| `RESEND_FROM_EMAIL` | ✅ | E-mail remetente verificado |
| `ANTHROPIC_API_KEY` | ⬜ | Chave da API Anthropic (análise com IA) |

### Supabase — atenção na URL do banco

Use **conexão direta** (não pooler):
- ✅ `db.[PROJECT-REF].supabase.co:5432`
- ❌ `aws-0-[region].pooler.supabase.com:6543`

### Supabase Auth — configuração necessária

No Supabase Dashboard → Authentication → URL Configuration:
- **Site URL:** `https://seudominio.com.br`
- **Redirect URLs:** `https://seudominio.com.br/auth/callback`

Para Google OAuth → Authentication → Providers → Google:
- Client ID e Secret do [Google Cloud Console](https://console.cloud.google.com)
- Authorized redirect URI: `https://[SEU-PROJECT-REF].supabase.co/auth/v1/callback`

---

## Estrutura do projeto

```
src/
├── app/                    # Next.js App Router
│   ├── (auth-pages)/       # Login, signup, reset de senha
│   ├── actions/            # Server Actions (mutations)
│   ├── api/                # Route Handlers (OAuth)
│   ├── builder/[formId]/   # Editor de formulário
│   ├── dashboard/          # Painel principal
│   ├── f/[slug]/           # Formulário público
│   ├── responses/[formId]/ # Analytics e respostas
│   └── page.tsx            # Landing page
│
├── components/
│   ├── builder/            # Componentes do editor
│   ├── dashboard/          # Painel e analytics
│   ├── renderer/           # Renderizador do formulário público
│   │   └── fields/         # Um componente por tipo de pergunta
│   └── ui/                 # shadcn/ui (não editar)
│
├── lib/
│   ├── db/
│   │   ├── schema.ts       # Schema Drizzle (fonte da verdade)
│   │   └── queries/        # Queries por domínio
│   ├── supabase/           # Clientes Supabase (browser e server)
│   └── types/              # TypeScript types
│
├── config/
│   ├── themes.ts           # Temas predefinidos
│   └── templates.ts        # Templates de formulário
│
└── stores/
    └── builder-store.ts    # Estado do builder (Zustand)
```

Documentação detalhada em [`/docs`](./docs/):
- [Arquitetura e decisões de design](./docs/ARQUITETURA.md)
- [Banco de dados e migrations](./docs/BANCO-DE-DADOS.md)
- [Deploy em diferentes plataformas](./docs/DEPLOY.md)

---

## Tipos de pergunta disponíveis (22)

**Texto:** `short_text`, `long_text`, `email`, `number`, `phone`, `whatsapp`, `cpf`, `cnpj`, `date`, `url`

**Seleção:** `multiple_choice`, `checkbox`, `dropdown`, `yes_no`

**Avaliação:** `rating`, `scale`, `nps`

**Layout:** `welcome`, `statement`, `thank_you`

**Avançado:** `file_upload`, `signature`

---

## Convenções de código

O arquivo [`CLAUDE.md`](./CLAUDE.md) contém as convenções completas do projeto:
- Regras TypeScript (sem `any`, sem `as`, `interface` vs `type`)
- Padrão de componentes React
- Nomenclatura de arquivos e variáveis
- Server Action pattern
- Como adicionar um novo tipo de pergunta

---

## Deploy

Ver [`docs/DEPLOY.md`](./docs/DEPLOY.md) para instruções de deploy em:
- Vercel (atual, recomendado)
- Railway
- Render
- VPS com Docker

---

## Contato

- Produto: [formularios.ia.br](https://formularios.ia.br)
- Repositório: [github.com/PretoNlab/formularios-app](https://github.com/PretoNlab/formularios-app)
