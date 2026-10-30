import { describe, it, expect } from "vitest"
import { getClientIp } from "./ip"

describe("getClientIp", () => {
  it("prioritizes x-real-ip when available", () => {
    const headers = new Headers({
      "x-real-ip": "203.0.113.1",
      "x-forwarded-for": "198.51.100.2, 198.51.100.3",
    })
    expect(getClientIp(headers)).toBe("203.0.113.1")
  })

  it("prioritizes x-vercel-forwarded-for when x-real-ip is absent", () => {
    const headers = new Headers({
      "x-vercel-forwarded-for": "203.0.113.2",
      "x-forwarded-for": "198.51.100.2",
    })
    expect(getClientIp(headers)).toBe("203.0.113.2")
  })

  it("prioritizes cf-connecting-ip when present", () => {
    const headers = new Headers({
      "cf-connecting-ip": "203.0.113.3",
      "x-forwarded-for": "198.51.100.2",
    })
    expect(getClientIp(headers)).toBe("203.0.113.3")
  })

  it("falls back to x-forwarded-for first IP", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.4, 10.0.0.1",
    })
    expect(getClientIp(headers)).toBe("203.0.113.4")
  })

  it("returns unknown when no headers are present", () => {
    const headers = new Headers()
    expect(getClientIp(headers)).toBe("unknown")
  })
})
