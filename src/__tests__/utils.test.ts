import { describe, it, expect } from "vitest"
import { formatCurrency, formatDate, formatBytes, slugify, getInitials, truncate, generateId, timeAgo } from "@/lib/utils"

describe("formatCurrency", () => {
  it("formats THB correctly", () => {
    const result = formatCurrency(1234.56)
    expect(result).toContain("1,234")
    expect(result).toContain(".56")
  })

  it("formats zero", () => {
    expect(formatCurrency(0)).toContain("0")
  })

  it("formats USD when specified", () => {
    const result = formatCurrency(99.99, "USD")
    expect(result).toContain("99")
  })
})

describe("formatDate", () => {
  it("formats a date string", () => {
    const date = new Date("2025-06-15")
    const result = formatDate(date)
    expect(result).toContain("Jun")
    expect(result).toContain("2025")
  })
})

describe("formatBytes", () => {
  it("formats bytes to KB", () => {
    expect(formatBytes(1024)).toBe("1.0 KB")
  })

  it("formats bytes to MB", () => {
    expect(formatBytes(1048576)).toBe("1.0 MB")
  })

  it("formats 0 bytes", () => {
    expect(formatBytes(0)).toBe("0.0 B")
  })
})

describe("slugify", () => {
  it("converts spaces to hyphens", () => {
    expect(slugify("My Company Name")).toBe("my-company-name")
  })

  it("removes special characters", () => {
    expect(slugify("Hello! World?")).toBe("hello-world")
  })

  it("lowercases input", () => {
    expect(slugify("UPPERCASE")).toBe("uppercase")
  })
})

describe("getInitials", () => {
  it("returns first two initials", () => {
    expect(getInitials("John Doe")).toBe("JD")
  })

  it("handles single name", () => {
    expect(getInitials("John")).toBe("J")
  })

  it("handles empty string", () => {
    expect(getInitials("")).toBe("")
  })
})

describe("truncate", () => {
  it("returns string if shorter than limit", () => {
    expect(truncate("Hello", 10)).toBe("Hello")
  })

  it("truncates with ellipsis", () => {
    expect(truncate("Hello World", 5)).toBe("Hello...")
  })
})

describe("generateId", () => {
  it("generates an 8-character id", () => {
    expect(generateId()).toHaveLength(8)
  })
})

describe("timeAgo", () => {
  it("returns 'just now' for recent dates", () => {
    expect(timeAgo(new Date())).toBe("just now")
  })

  it("returns minutes for recent times", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    expect(timeAgo(fiveMinAgo)).toBe("5m ago")
  })
})
