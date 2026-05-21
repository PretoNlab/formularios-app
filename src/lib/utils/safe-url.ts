/**
 * Returns true when `url` is safe to use as the `href` of an external link
 * rendered from user-controlled content.
 *
 * Allows:
 *   - Absolute HTTPS URLs (`https://example.com/...`)
 *   - Same-origin absolute paths (`/dashboard`, `/help`)
 *
 * Rejects everything else — in particular `javascript:`, `data:`, `vbscript:`,
 * `file:`, plain `http:`, and protocol-relative URLs (`//evil.com`). These are
 * the schemes that turn a stored URL into a stored-XSS or phishing primitive
 * when rendered into an `<a href>`.
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false
  // Reject protocol-relative URLs explicitly — `//evil.com` is a cross-origin
  // redirect target that some downstream code (e.g. browser nav) would honor.
  if (url.startsWith("//")) return false
  if (url.startsWith("/")) return true
  try {
    return new URL(url).protocol === "https:"
  } catch {
    return false
  }
}

/**
 * Returns true when `path` is a safe value to feed into `redirect()` after
 * login or any other server-side navigation that takes a `next` parameter
 * from the request.
 *
 * Only same-origin absolute paths are allowed. Protocol-relative URLs
 * (`//evil.com/...`) and backslash variants (`/\evil.com`, which some
 * browsers normalize to a cross-origin redirect) are rejected.
 */
export function isSafeNextPath(path: string | null | undefined): boolean {
  if (!path) return false
  if (!path.startsWith("/")) return false
  if (path.startsWith("//")) return false
  if (path.startsWith("/\\")) return false
  return true
}
