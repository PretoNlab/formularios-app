/**
 * Safely extracts client IP from request headers, prioritizing trusted
 * proxy/edge headers (x-real-ip from Vercel Edge/reverse proxy) over
 * client-spoofable x-forwarded-for.
 */
export function getClientIp(headers: { get(name: string): string | null }): string {
  // 1. x-real-ip is set by the edge proxy / web server and cannot be spoofed by client
  const realIp = headers.get("x-real-ip")?.trim()
  if (realIp) return realIp

  // 2. x-vercel-forwarded-for or x-vercel-ip
  const vercelForwarded = headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
  if (vercelForwarded) return vercelForwarded

  const vercelIp = headers.get("x-vercel-ip")?.trim()
  if (vercelIp) return vercelIp

  // 3. cf-connecting-ip (Cloudflare proxy)
  const cfIp = headers.get("cf-connecting-ip")?.trim()
  if (cfIp) return cfIp

  // 4. x-forwarded-for (fallback): use first IP
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }

  return "unknown"
}
