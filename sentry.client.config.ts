import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Captura 10% das transações em produção (performance tracing)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Captura 100% das sessões com erro
  replaysOnErrorSampleRate: 1.0,
  // Captura 1% das sessões normais
  replaysSessionSampleRate: 0.01,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Não inicializa sem DSN (dev sem configuração)
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
})
