import { describe, it, expect } from "vitest"
import { productSchema, customerSchema, orderSchema, validate } from "@/lib/validation"

describe("productSchema", () => {
  it("accepts valid product", () => {
    const result = productSchema.safeParse({
      name: "Widget",
      sku: "WDG-001",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty name", () => {
    const result = productSchema.safeParse({ name: "", sku: "WDG-001" })
    expect(result.success).toBe(false)
  })

  it("rejects negative price", () => {
    const result = productSchema.safeParse({
      name: "Widget",
      sku: "WDG-001",
      unitPrice: -10,
    })
    expect(result.success).toBe(false)
  })

  it("applies defaults", () => {
    const result = productSchema.parse({ name: "Widget", sku: "WDG-001" })
    expect(result.currency).toBe("THB")
    expect(result.uom).toBe("pcs")
    expect(result.status).toBe("active")
    expect(result.type).toBe("finished_good")
  })
})

describe("customerSchema", () => {
  it("accepts valid customer", () => {
    const result = customerSchema.safeParse({ name: "John Doe" })
    expect(result.success).toBe(true)
  })

  it("rejects invalid email", () => {
    const result = customerSchema.safeParse({ name: "John", email: "not-an-email" })
    expect(result.success).toBe(false)
  })
})

describe("orderSchema", () => {
  it("requires at least one item", () => {
    const result = orderSchema.safeParse({ items: [] })
    expect(result.success).toBe(false)
  })

  it("accepts valid order", () => {
    const result = orderSchema.safeParse({
      items: [{ productId: "c123456789012345678901234", quantity: 2, unitPrice: 100 }],
    })
    expect(result.success).toBe(true)
  })
})

describe("validate", () => {
  it("throws AppError on validation failure", () => {
    expect(() => validate(productSchema, { name: "", sku: "" })).toThrow()
  })

  it("returns parsed data on success", () => {
    const data = validate(productSchema, { name: "Test", sku: "T-001" })
    expect(data.name).toBe("Test")
  })
})
