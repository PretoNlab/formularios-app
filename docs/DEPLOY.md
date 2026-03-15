# Deploy

Guia de deploy para diferentes plataformas.

---

## Checklist pré-deploy (qualquer plataforma)

- [ ] Todas as variáveis de ambiente configuradas na plataforma
- [ ] `DATABASE_URL` aponta para produção (não dev)
- [ ] Schema do banco sincronizado: `npm run db:push` (ou migrations)
- [ ] Domínio verificado no Resend para o `RESEND_FROM_EMAIL`
- [ ] Supabase Auth: Site URL e Redirect URL atualizados para o domínio de produção
- [ ] `NEXT_PUBLIC_APP_URL` aponta para o domínio de produção

---

## Vercel (plataforma atual)

A forma mais simples. Deploy automático a cada push na `main`.

### Setup inicial

```bash
# Instale a CLI do Vercel
npm i -g vercel

# Faça login e conecte o projeto
vercel login
vercel link
```

### Adicionando variáveis de ambiente

```bash
vercel env add DATABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_APP_URL
vercel env add RESEND_API_KEY
vercel env add RESEND_FROM_EMAIL
vercel env add ANTHROPIC_API_KEY
```

Ou via dashboard em: [vercel.com/dashboard](https://vercel.com/dashboard) → Projeto → Settings → Environment Variables.

### Deploy manual

```bash
vercel --prod
```

### Domínio customizado

Vercel Dashboard → Projeto → Settings → Domains → Add Domain.

---

## Railway

Boa alternativa ao Vercel. Suporta PostgreSQL próprio se quiser migrar do Supabase.

### Com Supabase externo (manter banco atual)

1. Crie um projeto em [railway.app](https://railway.app)
2. Clique em **New Service → GitHub Repo** e conecte o repositório
3. Vá em **Variables** e adicione todas as variáveis de ambiente
4. Em **Settings → Domains**, gere um domínio ou conecte o seu

O Railway detecta Next.js automaticamente e faz o build.

### Com PostgreSQL próprio do Railway (migrar banco)

1. Adicione um serviço PostgreSQL no projeto Railway
2. Copie a `DATABASE_URL` gerada pelo Railway
3. Atualize as variáveis de ambiente
4. Rode as migrations: `npm run db:generate && npm run db:migrate`

> Nesse caso você sai do Supabase Auth também — precisaria configurar outro provedor de auth ou usar [NextAuth.js](https://authjs.dev).

---

## Render

Alternativa gratuita com sleep em inatividade no plano free.

### Setup

1. Crie uma conta em [render.com](https://render.com)
2. **New → Web Service → Connect a repository**
3. Configure:
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
4. Em **Environment**, adicione todas as variáveis

### Plano pago

Para produção real use o plano **Starter** ($7/mês) — sem sleep, com deploy automático.

---

## VPS / Self-hosted (Docker)

Para quem quer controle total. Requer um servidor com Docker instalado.

### Dockerfile

Crie um arquivo `Dockerfile` na raiz:

```dockerfile
FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Adicione ao `next.config.mjs`:
```js
const nextConfig = {
  output: 'standalone',
}
```

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}
      RESEND_API_KEY: ${RESEND_API_KEY}
      RESEND_FROM_EMAIL: ${RESEND_FROM_EMAIL}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    restart: unless-stopped
```

### Deploy no servidor

```bash
# No servidor
git clone https://github.com/PretoNlab/formularios-app.git
cd formularios-app
cp .env.example .env
# Edite .env com os valores de produção
docker compose up -d
```

Use Nginx como proxy reverso com SSL (Certbot/Let's Encrypt).

---

## Migrações de banco em produção

Para produção, prefira migrations controladas em vez de `db:push`:

```bash
# Gera os arquivos SQL de migration
npm run db:generate

# Aplica as migrations no banco
npm run db:migrate
```

Os arquivos de migration ficam em `/supabase/migrations/` e devem ser commitados no repositório.
