import { describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  hashIp,
  isAllowedWebhookUrl,
  isAnswerEmpty,
  submitBodySchema,
  answerValueSchema,
} from "./submit-response-core"

// ─── hashIp ──────────────────────────────────────────────────────────────────

describe("hashIp", () => {
  const originalSalt = process.env.IP_HASH_SALT
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    process.env.IP_HASH_SALT = "test-salt"
  })

  afterEach(() => {
    process.env.IP_HASH_SALT = originalSalt
    process.env.NODE_ENV = originalEnv
  })

  it("returns a 32-character hex string", () => {
    const hash = hashIp("1.2.3.4")
    expect(hash).toHaveLength(32)
    expect(hash).toMatch(/^[a-f0-9]{32}$/)
  })

  it("is deterministic for the same IP + salt", () => {
    const a = hashIp("203.0.113.10")
    const b = hashIp("203.0.113.10")
    expect(a).toBe(b)
  })

  it("produces different hashes for different IPs", () => {
    expect(hashIp("1.1.1.1")).not.toBe(hashIp("2.2.2.2"))
  })

  it("produces different hashes when the salt changes", () => {
    const a = hashIp("1.1.1.1")
    process.env.IP_HASH_SALT = "different-salt"
    const b = hashIp("1.1.1.1")
    expect(a).not.toBe(b)
  })

  it("throws in production when IP_HASH_SALT is missing", () => {
    delete process.env.IP_HASH_SALT
    process.env.NODE_ENV = "production"
    expect(() => hashIp("1.1.1.1")).toThrowError(/IP_HASH_SALT/)
  })

  it("falls back silently in non-production when salt is missing", () => {
    delete process.env.IP_HASH_SALT
    process.env.NODE_ENV = "test"
    expect(() => hashIp("1.1.1.1")).not.toThrow()
  })
})

// ─── isAllowedWebhookUrl (SSRF guard) ────────────────────────────────────────

describe("isAllowedWebhookUrl", () => {
  it("allows public https URLs", () => {
    expect(isAllowedWebhookUrl("https://example.com/hook")).toBe(true)
    expect(isAllowedWebhookUrl("https://api.service.io/v1/events")).toBe(true)
  })

  it("rejects http (non-TLS) URLs", () => {
    expect(isAllowedWebhookUrl("http://example.com/hook")).toBe(false)
  })

  it("rejects non-HTTP schemes", () => {
    expect(isAllowedWebhookUrl("file:///etc/passwd")).toBe(false)
    expect(isAllowedWebhookUrl("ftp://example.com")).toBe(false)
    expect(isAllowedWebhookUrl("javascript:alert(1)")).toBe(false)
  })

  it("rejects localhost and loopback", () => {
    expect(isAllowedWebhookUrl("https://localhost/hook")).toBe(false)
    expect(isAllowedWebhookUrl("https://127.0.0.1/hook")).toBe(false)
    expect(isAllowedWebhookUrl("https://127.1.2.3/hook")).toBe(false)
  })

  it("rejects RFC1918 private ranges", () => {
    expect(isAllowedWebhookUrl("https://10.0.0.1/hook")).toBe(false)
    expect(isAllowedWebhookUrl("https://192.168.1.1/hook")).toBe(false)
    expect(isAllowedWebhookUrl("https://172.16.0.1/hook")).toBe(false)
    expect(isAllowedWebhookUrl("https://172.31.255.255/hook")).toBe(false)
  })

  it("rejects cloud metadata link-local (169.254.169.254)", () => {
    expect(isAllowedWebhookUrl("https://169.254.169.254/latest/meta-data/")).toBe(false)
  })

  it("rejects 0.0.0.0", () => {
    expect(isAllowedWebhookUrl("https://0.0.0.0/hook")).toBe(false)
  })

  it("rejects IPv6 loopback and ULA", () => {
    expect(isAllowedWebhookUrl("https://[::1]/hook")).toBe(false)
    expect(isAllowedWebhookUrl("https://[fc00::1]/hook")).toBe(false)
    expect(isAllowedWebhookUrl("https://[fe80::1]/hook")).toBe(false)
  })

  it("rejects IPv4-mapped IPv6 loopback (::ffff:127.0.0.1)", () => {
    expect(isAllowedWebhookUrl("https://[::ffff:127.0.0.1]/hook")).toBe(false)
  })

  it("rejects malformed URLs without throwing", () => {
    expect(isAllowedWebhookUrl("not-a-url")).toBe(false)
    expect(isAllowedWebhookUrl("")).toBe(false)
    expect(isAllowedWebhookUrl("https://")).toBe(false)
  })
})

// ─── isAnswerEmpty ───────────────────────────────────────────────────────────

describe("isAnswerEmpty", () => {
  it("treats null and undefined as empty", () => {
    expect(isAnswerEmpty(null)).toBe(true)
    expect(isAnswerEmpty(undefined)).toBe(true)
  })

  it("treats empty strings and whitespace-only strings as empty", () => {
    expect(isAnswerEmpty("")).toBe(true)
    expect(isAnswerEmpty("   ")).toBe(true)
    expect(isAnswerEmpty("\t\n ")).toBe(true)
  })

  it("treats non-empty strings as non-empty", () => {
    expect(isAnswerEmpty("answer")).toBe(false)
    expect(isAnswerEmpty(" answer ")).toBe(false)
  })

  it("treats empty arrays as empty, non-empty arrays as non-empty", () => {
    expect(isAnswerEmpty([])).toBe(true)
    expect(isAnswerEmpty(["a"])).toBe(false)
    expect(isAnswerEmpty(["a", "b"])).toBe(false)
  })

  it("treats numbers and booleans as non-empty (including 0 and false)", () => {
    expect(isAnswerEmpty(0)).toBe(false)
    expect(isAnswerEmpty(42)).toBe(false)
    expect(isAnswerEmpty(false)).toBe(false)
    expect(isAnswerEmpty(true)).toBe(false)
  })

  it("treats empty matrix object as empty", () => {
    expect(isAnswerEmpty({})).toBe(true)
  })

  it("treats populated matrix object as non-empty", () => {
    expect(isAnswerEmpty({ row1: "col1" })).toBe(false)
  })

  it("treats file upload object as non-empty", () => {
    expect(isAnswerEmpty({ fileUrl: "https://x/y.pdf", fileName: "y.pdf" })).toBe(false)
  })
})

// ─── answerValueSchema ───────────────────────────────────────────────────────

describe("answerValueSchema", () => {
  it("accepts valid scalar types", () => {
    expect(answerValueSchema.safeParse("text").success).toBe(true)
    expect(answerValueSchema.safeParse(42).success).toBe(true)
    expect(answerValueSchema.safeParse(true).success).toBe(true)
    expect(answerValueSchema.safeParse(null).success).toBe(true)
  })

  it("accepts string arrays (checkbox answers)", () => {
    expect(answerValueSchema.safeParse(["a", "b"]).success).toBe(true)
    expect(answerValueSchema.safeParse([]).success).toBe(true)
  })

  it("accepts file upload object", () => {
    const file = { fileUrl: "https://x/y.pdf", fileName: "y.pdf" }
    expect(answerValueSchema.safeParse(file).success).toBe(true)
  })

  it("accepts matrix (string → string record)", () => {
    expect(answerValueSchema.safeParse({ row1: "col1", row2: "col2" }).success).toBe(true)
  })

  it("rejects mixed-type arrays", () => {
    expect(answerValueSchema.safeParse(["a", 1]).success).toBe(false)
  })

  it("rejects nested objects with non-string values", () => {
    expect(answerValueSchema.safeParse({ a: 1 }).success).toBe(false)
  })
})

// ─── submitBodySchema ────────────────────────────────────────────────────────

describe("submitBodySchema", () => {
  const validBody = {
    formId: "11111111-2222-4333-8444-555555555555",
    answers: { "q1": "hello" },
  }

  it("accepts a minimal valid body", () => {
    expect(submitBodySchema.safeParse(validBody).success).toBe(true)
  })

  it("rejects missing formId", () => {
    const result = submitBodySchema.safeParse({ answers: {} })
    expect(result.success).toBe(false)
  })

  it("rejects non-UUID formId", () => {
    const result = submitBodySchema.safeParse({ formId: "not-a-uuid", answers: {} })
    expect(result.success).toBe(false)
  })

  it("accepts optional responseId as UUID", () => {
    const ok = submitBodySchema.safeParse({
      ...validBody,
      responseId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    })
    expect(ok.success).toBe(true)
  })

  it("rejects non-UUID responseId", () => {
    const result = submitBodySchema.safeParse({ ...validBody, responseId: "bad" })
    expect(result.success).toBe(false)
  })

  it("accepts clientMeta with UTM fields and device type", () => {
    const result = submitBodySchema.safeParse({
      ...validBody,
      clientMeta: {
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "launch",
        referrer: "https://site.com",
        deviceType: "mobile",
      },
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid deviceType", () => {
    const result = submitBodySchema.safeParse({
      ...validBody,
      clientMeta: { deviceType: "watch" },
    })
    expect(result.success).toBe(false)
  })

  it("rejects UTM values over 200 chars", () => {
    const result = submitBodySchema.safeParse({
      ...validBody,
      clientMeta: { utmSource: "x".repeat(201) },
    })
    expect(result.success).toBe(false)
  })

  it("accepts a heterogeneous answers map (string, number, bool, array, file, null)", () => {
    const result = submitBodySchema.safeParse({
      formId: validBody.formId,
      answers: {
        text: "hi",
        num: 7,
        bool: true,
        checks: ["a", "b"],
        file: { fileUrl: "https://x/y.pdf", fileName: "y.pdf" },
        skipped: null,
      },
    })
    expect(result.success).toBe(true)
  })
})
