import { describe, it, expect } from "vitest"
import { isSafeUrl, isSafeNextPath } from "./safe-url"

describe("isSafeUrl", () => {
  it("accepts absolute https URLs", () => {
    expect(isSafeUrl("https://example.com")).toBe(true)
    expect(isSafeUrl("https://example.com/path?q=1")).toBe(true)
  })

  it("accepts same-origin absolute paths", () => {
    expect(isSafeUrl("/dashboard")).toBe(true)
    expect(isSafeUrl("/")).toBe(true)
  })

  it("rejects javascript: URLs (XSS sink in href)", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false)
    expect(isSafeUrl("JavaScript:alert(1)")).toBe(false)
    expect(isSafeUrl("  javascript:alert(1)  ")).toBe(false)
  })

  it("rejects data:, vbscript:, file:", () => {
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false)
    expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false)
    expect(isSafeUrl("file:///etc/passwd")).toBe(false)
  })

  it("rejects plain http (non-TLS)", () => {
    expect(isSafeUrl("http://example.com")).toBe(false)
  })

  it("rejects protocol-relative URLs", () => {
    expect(isSafeUrl("//evil.com/phish")).toBe(false)
  })

  it("rejects empty / nullish values", () => {
    expect(isSafeUrl("")).toBe(false)
    expect(isSafeUrl(null)).toBe(false)
    expect(isSafeUrl(undefined)).toBe(false)
  })

  it("rejects malformed URLs", () => {
    expect(isSafeUrl("not a url")).toBe(false)
    expect(isSafeUrl("https://")).toBe(false)
  })
})

describe("isSafeNextPath", () => {
  it("accepts same-origin relative paths", () => {
    expect(isSafeNextPath("/dashboard")).toBe(true)
    expect(isSafeNextPath("/builder/abc")).toBe(true)
    expect(isSafeNextPath("/")).toBe(true)
  })

  it("rejects protocol-relative URLs (the classic open-redirect bypass)", () => {
    expect(isSafeNextPath("//evil.com")).toBe(false)
    expect(isSafeNextPath("//evil.com/fake-dashboard")).toBe(false)
  })

  it("rejects backslash-prefixed paths that some browsers normalize cross-origin", () => {
    expect(isSafeNextPath("/\\evil.com")).toBe(false)
  })

  it("rejects absolute URLs", () => {
    expect(isSafeNextPath("https://evil.com")).toBe(false)
    expect(isSafeNextPath("http://evil.com")).toBe(false)
    expect(isSafeNextPath("javascript:alert(1)")).toBe(false)
  })

  it("rejects non-leading-slash paths", () => {
    expect(isSafeNextPath("dashboard")).toBe(false)
    expect(isSafeNextPath("evil.com")).toBe(false)
  })

  it("rejects empty / nullish values", () => {
    expect(isSafeNextPath("")).toBe(false)
    expect(isSafeNextPath(null)).toBe(false)
    expect(isSafeNextPath(undefined)).toBe(false)
  })
})
