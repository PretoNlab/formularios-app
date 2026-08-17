import { withSentryConfig } from "@sentry/nextjs"

// Content-Security-Policy applied to all routes.
//
// Notes:
// - `unsafe-inline` for scripts is required by Next.js App Router (inline hydration chunks).
//   A nonce-based approach via middleware can remove it later if stricter control is needed.
// - `unsafe-eval` is intentionally excluded; Next.js production builds don't need it.
// - `next/font/google` downloads fonts at build time and serves them from /_next/static/,
//   so fonts.gstatic.com is NOT needed at runtime.
// - `frame-ancestors` is omitted from general routes; public forms (/f/*) set `frame-ancestors 'self' *`
//   and `X-Frame-Options: ALLOWALL` to allow cross-origin iframe embedding.
const CSP = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.clarity.ms https://*.clarity.ms",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    // Supabase storage (uploaded files/images), Google avatars, Clarity pixel
    "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://*.clarity.ms https://c.bing.com",
    // Supabase REST + realtime WS, Sentry error/replay ingestion, Microsoft Clarity
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://*.clarity.ms https://c.bing.com",
    // Clarity uses blob: web workers for session recording
    "worker-src 'self' blob:",
    // Audio/video uploaded by respondents
    "media-src 'self' blob: https://*.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    // Google OAuth posts back to its own domain on the auth flow
    "form-action 'self' https://accounts.google.com",
].join("; ")

// Content-Security-Policy for public forms (/f/*) permitting embedding in external iframes
const PUBLIC_FORM_CSP = [
    CSP,
    "frame-ancestors 'self' *",
].join("; ")

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
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "same-origin",
                    },
                    {
                        key: "Cross-Origin-Resource-Policy",
                        value: "same-origin",
                    },
                    {
                        key: "Content-Security-Policy",
                        value: CSP,
                    },
                ],
            },
            {
                // Public forms can be embedded in iframes on any external site/webapp
                source: "/f/:path*",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "ALLOWALL",
                    },
                    {
                        key: "Content-Security-Policy",
                        value: PUBLIC_FORM_CSP,
                    },
                    {
                        key: "Cross-Origin-Resource-Policy",
                        value: "cross-origin",
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

    // Oculta source maps do bundle final
    hideSourceMaps: true,

    // Desabilita o logger automático de console no edge
    disableLogger: true,

    // Sem telemetria do Sentry sobre o build
    telemetry: false,
});
