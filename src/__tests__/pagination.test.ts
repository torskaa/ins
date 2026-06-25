import { describe, it, expect } from "vitest"
import { paginate, paginatedResponse } from "@/lib/pagination"

describe("paginate", () => {
  it("returns correct metadata for first page", () => {
    const meta = paginate(1, 20, 100)
    expect(meta.page).toBe(1)
    expect(meta.totalPages).toBe(5)
    expect(meta.hasNext).toBe(true)
    expect(meta.hasPrev).toBe(false)
  })

  it("returns correct metadata for last page", () => {
    const meta = paginate(5, 20, 100)
    expect(meta.page).toBe(5)
    expect(meta.hasNext).toBe(false)
    expect(meta.hasPrev).toBe(true)
  })

  it("handles empty results", () => {
    const meta = paginate(1, 20, 0)
    expect(meta.totalPages).toBe(0)
    expect(meta.hasNext).toBe(false)
    expect(meta.hasPrev).toBe(false)
  })

  it("rounds up total pages", () => {
    const meta = paginate(1, 10, 25)
    expect(meta.totalPages).toBe(3)
  })
})

describe("paginatedResponse", () => {
  it("returns items with pagination metadata", () => {
    const result = paginatedResponse([1, 2, 3], 100, { page: 1, limit: 20 })
    expect(result.items).toHaveLength(3)
    expect(result.pagination.page).toBe(1)
    expect(result.pagination.total).toBe(100)
  })
})
