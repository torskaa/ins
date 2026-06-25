import { describe, it, expect } from "vitest"
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  handleApiError,
} from "@/lib/errors"

describe("AppError", () => {
  it("creates error with default code", () => {
    const err = new AppError("Bad request")
    expect(err.message).toBe("Bad request")
    expect(err.statusCode).toBe(400)
    expect(err.code).toBe("BAD_REQUEST")
  })
})

describe("NotFoundError", () => {
  it("includes entity name in message", () => {
    const err = new NotFoundError("Product", "123")
    expect(err.message).toContain("Product")
    expect(err.statusCode).toBe(404)
  })
})

describe("UnauthorizedError", () => {
  it("defaults to 401", () => {
    const err = new UnauthorizedError()
    expect(err.statusCode).toBe(401)
  })
})

describe("ForbiddenError", () => {
  it("defaults to 403", () => {
    const err = new ForbiddenError()
    expect(err.statusCode).toBe(403)
  })
})

describe("ValidationError", () => {
  it("stores field errors in details", () => {
    const err = new ValidationError({ name: ["Required"] })
    expect(err.details).toEqual({ name: ["Required"] })
  })
})

describe("ConflictError", () => {
  it("defaults to 409", () => {
    const err = new ConflictError("Duplicate entry")
    expect(err.statusCode).toBe(409)
  })
})

describe("handleApiError", () => {
  it("returns structured error for AppError", async () => {
    const err = new NotFoundError("Product")
    const response = handleApiError(err)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error).toContain("Product")
    expect(body.code).toBe("NOT_FOUND")
    expect(response.status).toBe(404)
  })

  it("returns 500 for unknown errors", async () => {
    const response = handleApiError(new Error("Something broke"))
    const body = await response.json()
    expect(body.code).toBe("INTERNAL_ERROR")
    expect(response.status).toBe(500)
  })
})
