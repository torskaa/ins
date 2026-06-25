import { describe, it, expect } from "vitest"
import { z } from "zod"

describe("env schema validation", () => {
  const envSchema = z.object({
    DATABASE_URL: z.string().min(1),
    AUTH_SECRET: z.string().min(32),
  })

  it("accepts valid env vars", () => {
    const result = envSchema.safeParse({
      DATABASE_URL: "file:./dev.db",
      AUTH_SECRET: "a-string-that-is-at-least-32-characters-long!",
    })
    expect(result.success).toBe(true)
  })

  it("rejects short AUTH_SECRET", () => {
    const result = envSchema.safeParse({
      DATABASE_URL: "file:./dev.db",
      AUTH_SECRET: "too-short",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing DATABASE_URL", () => {
    const result = envSchema.safeParse({
      AUTH_SECRET: "a-string-that-is-at-least-32-characters-long!",
    })
    expect(result.success).toBe(false)
  })
})
