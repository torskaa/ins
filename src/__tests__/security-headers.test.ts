import { describe, it, expect } from "vitest"
import { getSecurityHeaders } from "@/lib/security-headers"

describe("getSecurityHeaders", () => {
  const headers = getSecurityHeaders()

  it("includes X-Frame-Options: DENY", () => {
    expect(headers["X-Frame-Options"]).toBe("DENY")
  })

  it("includes X-Content-Type-Options: nosniff", () => {
    expect(headers["X-Content-Type-Options"]).toBe("nosniff")
  })

  it("includes Strict-Transport-Security", () => {
    expect(headers["Strict-Transport-Security"]).toContain("max-age=31536000")
  })

  it("includes Content-Security-Policy with default-src 'self'", () => {
    expect(headers["Content-Security-Policy"]).toContain("default-src 'self'")
  })

  it("includes Referrer-Policy", () => {
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin")
  })
})
