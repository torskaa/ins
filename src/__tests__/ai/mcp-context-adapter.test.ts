import { describe, it, expect } from "vitest"
import { McpContextAdapter } from "@/ai/mcp/context"
import type { McpContextInput } from "@/ai/mcp/context"
import type { AiContext } from "@/ai/context/types"
import { checkToolPermission } from "@/ai/permissions/permission"

function validInput(overrides?: Partial<McpContextInput>): McpContextInput {
  return {
    clientId: "mcp-client-1",
    userId: "user-abc",
    organizationId: "org-42",
    organizationSlug: "acme-corp",
    userRole: "admin",
    permissions: ["inventory:read", "orders:read", "admin"],
    ...overrides,
  }
}

describe("McpContextAdapter", () => {
  it("adapts a valid input to AiContext", () => {
    const adapter = new McpContextAdapter()
    const ctx = adapter.adapt(validInput())

    expect(ctx.userId).toBe("user-abc")
    expect(ctx.organizationId).toBe("org-42")
    expect(ctx.organizationSlug).toBe("acme-corp")
    expect(ctx.userRole).toBe("admin")
    expect(ctx.permissions).toEqual(["inventory:read", "orders:read", "admin"])
  })

  it("sets currentModule to mcp", () => {
    const adapter = new McpContextAdapter()
    const ctx = adapter.adapt(validInput())

    expect(ctx.currentModule).toBe("mcp")
  })

  it("strips unknown permissions to prevent privilege escalation", () => {
    const adapter = new McpContextAdapter()
    const ctx = adapter.adapt(
      validInput({
        permissions: [
          "inventory:read",
          "inventory:write",
          "unknown:permission",
          "fake:access",
          "admin",
        ],
      }),
    )

    expect(ctx.permissions).toContain("inventory:read")
    expect(ctx.permissions).toContain("inventory:write")
    expect(ctx.permissions).toContain("admin")
    expect(ctx.permissions).not.toContain("unknown:permission")
    expect(ctx.permissions).not.toContain("fake:access")
  })

  it("strips all unknown permissions from non-admin user", () => {
    const adapter = new McpContextAdapter()
    const ctx = adapter.adapt(
      validInput({
        userRole: "member",
        permissions: ["orders:read", "malicious:access"],
      }),
    )

    expect(ctx.permissions).toContain("orders:read")
    expect(ctx.permissions).not.toContain("malicious:access")
  })

  it("throws when clientId is missing", () => {
    const adapter = new McpContextAdapter()
    expect(() =>
      adapter.adapt(validInput({ clientId: "" })),
    ).toThrow("clientId is required")
  })

  it("throws when userId is missing", () => {
    const adapter = new McpContextAdapter()
    expect(() =>
      adapter.adapt(validInput({ userId: "" })),
    ).toThrow("userId is required")
  })

  it("throws when organizationId is missing", () => {
    const adapter = new McpContextAdapter()
    expect(() =>
      adapter.adapt(validInput({ organizationId: "" })),
    ).toThrow("organizationId is required")
  })

  it("throws when organizationSlug is missing", () => {
    const adapter = new McpContextAdapter()
    expect(() =>
      adapter.adapt(validInput({ organizationSlug: "" })),
    ).toThrow("organizationSlug is required")
  })

  it("maps workspaceId when provided", () => {
    const adapter = new McpContextAdapter()
    const ctx = adapter.adapt(validInput({ workspaceId: "ws-1" }))

    expect(ctx.workspaceId).toBe("ws-1")
  })

  it("merges metadata into context", () => {
    const adapter = new McpContextAdapter()
    const ctx = adapter.adapt(
      validInput({
        metadata: { ipAddress: "10.0.0.1", userAgent: "test-agent" },
      }),
    )

    expect(ctx.ipAddress).toBe("10.0.0.1")
    expect(ctx.userAgent).toBe("test-agent")
  })

  it("metadata from adapt() call overrides input metadata", () => {
    const adapter = new McpContextAdapter()
    const ctx = adapter.adapt(
      validInput({ metadata: { ipAddress: "from-input" } }),
      { ipAddress: "from-call" },
    )

    expect(ctx.ipAddress).toBe("from-call")
  })

  it("returns an AiContext compatible with permission checker", () => {
    const adapter = new McpContextAdapter()
    const ctx = adapter.adapt(validInput())

    const permCheck = (ctx: AiContext) => {
      if (ctx.userRole === "admin" && ctx.permissions.includes("admin")) {
        return true
      }
      return ctx.permissions.length > 0
    }

    expect(permCheck(ctx)).toBe(true)
  })

  it("passes through role as-is from input (no default override)", () => {
    const adapter = new McpContextAdapter()
    const ctx = adapter.adapt(
      validInput({ userRole: "viewer", permissions: ["inventory:read"] }),
    )

    expect(ctx.userRole).toBe("viewer")
  })

  it("accepts member role with limited permissions", () => {
    const adapter = new McpContextAdapter()
    const ctx = adapter.adapt(
      validInput({
        userRole: "member",
        permissions: ["inventory:read"],
      }),
    )

    expect(ctx.userRole).toBe("member")
    expect(ctx.permissions).toEqual(["inventory:read"])
  })

  it("produces AiContext usable by executeTool", () => {
    const adapter = new McpContextAdapter()
    const ctx = adapter.adapt(
      validInput({
        userRole: "member",
        permissions: ["inventory:read", "orders:read", "finance:read"],
      }),
    )

    const result = checkToolPermission("inventory.getStock", ctx)
    expect(result.allowed).toBe(true)
  })

  it("denies permission when required permission is missing", () => {
    const adapter = new McpContextAdapter()
    const ctx = adapter.adapt(
      validInput({
        userRole: "member",
        permissions: ["orders:read"],
      }),
    )

    const result = checkToolPermission("finance.getInvoices", ctx)
    expect(result.allowed).toBe(false)
    expect(result.deniedReason).toContain("finance:read")
  })
})
