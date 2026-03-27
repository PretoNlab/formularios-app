import { withSentryConfig } from "@sentry/nextjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=63072000; includeSubDomains",
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=()",
                    },
                ],
            },
            {
                // Public forms can be embedded from the same origin
                // (used by the share dialog iframe and for site embedding)
                source: "/f/:path*",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "SAMEORIGIN",
                    },
                ],
            },
        ]
    },
};

export default withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG ?? "formulariosia",
    project: process.env.SENTRY_PROJECT ?? "javascript-nextjs",

    // Upload source maps apenas em produção (CI/CD)
    silent: !process.env.CI,

    // Desabilita source map upload se não houver auth token
    authToken: process.env.SENTRY_AUTH_TOKEN,

    // Tunneling evita ad-blockers que bloqueiam sentry.io
    tunnelRoute: "/monitoring",

    // Oculta source maps do bundle final
    hideSourceMaps: true,

    // Desabilita o logger automático de console no edge
    disableLogger: true,

    // Sem telemetria do Sentry sobre o build
    telemetry: false,
});
