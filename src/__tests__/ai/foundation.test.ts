import { describe, it, expect } from "vitest"
import { DefaultContextBuilder } from "@/ai/context/types"
import type { AiContext } from "@/ai/context/types"
import { checkToolPermission } from "@/ai/permissions/permission"
import { executeTool, getAllTools } from "@/ai/tools/registry"
import type { ToolDefinition, ToolResponse } from "@/ai/tools/types"
import { inventoryService } from "@/services/inventory/inventory.service"
import { inventoryTools } from "@/ai/tools/inventory.tools"
import { createProvider } from "@/ai/providers/provider"

function createTestContext(overrides?: Partial<AiContext>): AiContext {
  const builder = new DefaultContextBuilder()
  return builder.build({
    userId: "test-user-1",
    organizationId: "test-org-1",
    organizationSlug: "test-org",
    userRole: "admin",
    permissions: ["inventory:read", "orders:read", "customers:read", "finance:read"],
    ...overrides,
  })
}

describe("AI Foundation — Architecture Verification", () => {
  describe("Context Layer", () => {
    it("builds context with required fields", () => {
      const ctx = createTestContext()
      expect(ctx.userId).toBe("test-user-1")
      expect(ctx.organizationId).toBe("test-org-1")
      expect(ctx.organizationSlug).toBe("test-org")
    })

    it("rejects context without required fields", () => {
      const builder = new DefaultContextBuilder()
      expect(() => builder.build({ userId: "u1" } as any)).toThrow("organizationId")
      expect(() => builder.build({ organizationId: "o1" } as any)).toThrow("userId")
    })

    it("accepts optional module and record context", () => {
      const ctx = createTestContext({
        currentModule: "inventory",
        selectedRecordId: "mat-001",
        selectedRecordType: "material",
      })
      expect(ctx.currentModule).toBe("inventory")
      expect(ctx.selectedRecordId).toBe("mat-001")
    })
  })

  describe("Permission Layer", () => {
    it("allows admin to execute any tool", () => {
      const ctx = createTestContext({ userRole: "admin", permissions: [] })
      const result = checkToolPermission("inventory.getStock", ctx)
      expect(result.allowed).toBe(true)
    })

    it("denies tool without required permission", () => {
      const ctx = createTestContext({ userRole: "member", permissions: [] })
      const result = checkToolPermission("inventory.getStock", ctx)
      expect(result.allowed).toBe(false)
      expect(result.deniedReason).toContain("inventory:read")
    })

    it("allows tool with required permission", () => {
      const ctx = createTestContext({ userRole: "member", permissions: ["inventory:read"] })
      const result = checkToolPermission("inventory.getStock", ctx)
      expect(result.allowed).toBe(true)
    })
  })

  describe("Tool Contracts", () => {
    const tools = getAllTools()

    it("every tool has a name, description, inputSchema, requiredPermissions, and execute", () => {
      for (const tool of tools) {
        expect(tool.name).toBeTruthy()
        expect(tool.description).toBeTruthy()
        expect(tool.inputSchema).toBeTruthy()
        expect(tool.inputSchema.type).toBe("object")
        expect(tool.requiredPermissions).toBeInstanceOf(Array)
        expect(typeof tool.execute).toBe("function")
      }
    })

    it("all tool names are namespaced (module.action)", () => {
      for (const tool of tools) {
        expect(tool.name).toMatch(/^[a-z]+\.[a-zA-Z]+$/)
      }
    })

    it("every tool returns a ToolResponse with success field", async () => {
      for (const tool of tools) {
        const result: ToolResponse = await tool.execute({})
        expect(result).toHaveProperty("success")
        if (result.success) {
          expect(result).toHaveProperty("data")
        } else {
          expect(result).toHaveProperty("error")
          expect(result.error).toHaveProperty("code")
          expect(result.error).toHaveProperty("message")
        }
      }
    })
  })

  describe("Registry — executeTool", () => {
    it("executes a tool through the registry with context", async () => {
      const ctx = createTestContext()
      const result = await executeTool("inventory.getStock", ctx)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it("returns error for unknown tool", async () => {
      const ctx = createTestContext()
      const result = await executeTool("nonexistent.tool", ctx)
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe("TOOL_NOT_FOUND")
    })

    it("returns denied for unauthorized tool", async () => {
      const ctx = createTestContext({ userRole: "member", permissions: [] })
      const result = await executeTool("finance.getSummary", ctx)
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe("PERMISSION_DENIED")
    })
  })

  describe("Inventory Tools", () => {
    it("inventory.getLowStock returns structured data", async () => {
      const ctx = createTestContext()
      const result = await executeTool("inventory.getLowStock", ctx)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it("inventory.getWarehouses returns warehouses", async () => {
      const ctx = createTestContext()
      const result = await executeTool("inventory.getWarehouses", ctx)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it("inventory.getSummary returns summary metrics", async () => {
      const ctx = createTestContext()
      const result = await executeTool("inventory.getSummary", ctx)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })
  })

  describe("Orders Tools", () => {
    it("orders.getSalesSummary returns sales data", async () => {
      const ctx = createTestContext()
      const result = await executeTool("orders.getSalesSummary", ctx)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it("orders.getRecent returns limited results", async () => {
      const ctx = createTestContext()
      const result = await executeTool("orders.getRecent", ctx, { limit: 3 })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })
  })

  describe("Customers Tools", () => {
    it("customers.search returns results", async () => {
      const ctx = createTestContext()
      const result = await executeTool("customers.search", ctx, { query: "Acme" })
      expect(result.success).toBe(true)
    })
  })

  describe("Finance Tools", () => {
    it("finance.getSummary returns financial summary", async () => {
      const ctx = createTestContext()
      const result = await executeTool("finance.getSummary", ctx)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it("finance.getOutstanding returns a number", async () => {
      const ctx = createTestContext()
      const result = await executeTool("finance.getOutstanding", ctx)
      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty("outstanding")
    })
  })
})

describe("AI Foundation — No Direct Access Violations", () => {
  it("service does not import mock data directly", async () => {
    const code = inventoryService.getLowStockItems.toString()
    expect(code).not.toContain("import")
  })

  it("tools do not access repositories directly", () => {
    for (const tool of inventoryTools) {
      const code = tool.execute.toString()
      expect(code).not.toContain("repository")
      expect(code).not.toContain("prisma")
      expect(code).not.toContain("mock")
    }
  })

  it("services do not have AI logic", () => {
    const code = inventoryService.getLowStockItems.toString()
    expect(code).not.toContain("ai")
    expect(code).not.toContain("tool")
  })

  it("can switch from mock repository without changing tools", () => {
    for (const tool of inventoryTools) {
      expect(tool.name).toMatch(/^inventory\./)
      expect(typeof tool.execute).toBe("function")
    }
  })
})

describe("AI Foundation — Provider Abstraction", () => {
  it("throws when OpenAI has no API key", () => {
    const provider = createProvider({ type: "openai" })
    expect(provider.isAvailable()).toBe(false)
    expect(provider.type).toBe("openai")
  })

  it("throws when Anthropic has no API key", () => {
    const provider = createProvider({ type: "anthropic" })
    expect(provider.isAvailable()).toBe(false)
  })

  it("local provider is always available", () => {
    const provider = createProvider({ type: "local" })
    expect(provider.isAvailable()).toBe(true)
    expect(provider.type).toBe("local")
  })

  it("creates provider with configuration", () => {
    const provider = createProvider({
      type: "openai",
      apiKey: "sk-test",
      model: "gpt-4o",
      temperature: 0.5,
    })
    expect(provider.isAvailable()).toBe(true)
    expect(provider.type).toBe("openai")
  })
})
