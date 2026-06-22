import { describe, it, expect, beforeEach } from "vitest"
import { McpServer } from "@/ai/mcp/server"
import { setUsageTracker, getUsageTracker, InMemoryUsageTracker } from "@/ai/usage"
import { DefaultContextBuilder } from "@/ai/context/types"
import type { AiContext } from "@/ai/context/types"
import type { McpContextInput } from "@/ai/mcp/context"

function testContext(): AiContext {
  return new DefaultContextBuilder().build({
    userId: "mcp-test-user",
    organizationId: "mcp-test-org",
    organizationSlug: "mcp-test",
    userRole: "admin",
    permissions: ["inventory:read", "orders:read", "customers:read", "finance:read"],
  })
}

function memberContext(): AiContext {
  return new DefaultContextBuilder().build({
    userId: "member-user",
    organizationId: "mcp-test-org",
    organizationSlug: "mcp-test",
    userRole: "member",
    permissions: ["orders:read"],
  })
}

describe("McpServer (foundation)", () => {
  let server: McpServer
  let ctx: AiContext

  beforeEach(() => {
    setUsageTracker(new InMemoryUsageTracker())
    server = new McpServer()
    ctx = testContext()
  })

  describe("listTools", () => {
    it("returns all available tools", () => {
      const result = server.listTools()

      expect(result.tools).toBeDefined()
      expect(result.tools.length).toBeGreaterThanOrEqual(21)
    })

    it("each tool has name, description, and inputSchema", () => {
      const result = server.listTools()

      for (const tool of result.tools) {
        expect(tool).toHaveProperty("name")
        expect(tool).toHaveProperty("description")
        expect(tool).toHaveProperty("inputSchema")
        expect(tool.inputSchema).toHaveProperty("type", "object")
      }
    })

    it("includes tools from all four modules", () => {
      const result = server.listTools()
      const names = result.tools.map((t) => t.name)

      expect(names).toContain("inventory.getStock")
      expect(names).toContain("orders.getActive")
      expect(names).toContain("customers.search")
      expect(names).toContain("finance.getInvoices")
    })
  })

  describe("listCapabilities", () => {
    it("returns all capabilities", () => {
      const result = server.listCapabilities()

      expect(result.capabilities).toBeDefined()
      expect(result.capabilities.length).toBeGreaterThanOrEqual(6)
    })

    it("each capability has name, description, tools, and requiredPermissions", () => {
      const result = server.listCapabilities()

      for (const cap of result.capabilities) {
        expect(cap).toHaveProperty("name")
        expect(cap).toHaveProperty("description")
        expect(cap).toHaveProperty("tools")
        expect(cap).toHaveProperty("requiredPermissions")
        expect(Array.isArray(cap.tools)).toBe(true)
        expect(Array.isArray(cap.requiredPermissions)).toBe(true)
      }
    })

    it("includes inventory_analysis capability with correct tools", () => {
      const result = server.listCapabilities()
      const inv = result.capabilities.find((c) => c.name === "inventory_analysis")

      expect(inv).toBeDefined()
      expect(inv!.tools).toContain("inventory.getLowStock")
      expect(inv!.requiredPermissions).toContain("inventory:read")
    })

    it("includes financial_analysis capability", () => {
      const result = server.listCapabilities()
      const fin = result.capabilities.find((c) => c.name === "financial_analysis")

      expect(fin).toBeDefined()
      expect(fin!.description).toContain("financial")
    })
  })

  describe("callTool", () => {
    it("executes a tool and returns success result", async () => {
      const result = await server.callTool(
        { name: "inventory.getStock" },
        ctx,
      )

      expect(result.isError).toBe(false)
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe("text")

      const data = JSON.parse(result.content[0].text)
      expect(data).toBeDefined()
    })

    it("returns error for unknown tool", async () => {
      const result = await server.callTool(
        { name: "nonexistent.tool" },
        ctx,
      )

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain("Tool not found")
    })

    it("returns error when tool name is missing", async () => {
      const result = await server.callTool({ name: "" }, ctx)

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain("Tool name is required")
    })

    it("returns error when context is invalid", async () => {
      const badCtx = { ...ctx, userId: "" }

      await expect(
        server.callTool({ name: "inventory.getStock" }, badCtx as AiContext),
      ).rejects.toThrow("Invalid AiContext")
    })

    it("includes cost metadata in result", async () => {
      const result = await server.callTool(
        { name: "inventory.getStock" },
        ctx,
      )

      expect(result.meta).toBeDefined()
      expect(result.meta?.cost).toBeDefined()
      expect(result.meta?.cost?.currency).toBe("USD")
      expect(typeof result.meta?.cost?.amount).toBe("number")
    })

    it("creates usage event via tool registry", async () => {
      await server.callTool({ name: "inventory.getStock" }, ctx)

      const summary = await getUsageTracker().getUsageSummary()

      expect(summary.totalToolCalls).toBeGreaterThanOrEqual(1)
    })

    it("executes with arguments", async () => {
      const result = await server.callTool(
        { name: "inventory.getStock", arguments: { itemId: "RM-001" } },
        ctx,
      )

      expect(result.isError).toBe(false)
    })

    it("denies permission for member without required permission", async () => {
      const memberCtx = memberContext()
      const result = await server.callTool(
        { name: "inventory.getStock" },
        memberCtx,
      )

      expect(result.isError).toBe(true)
      const parsed = JSON.parse(result.content[0].text)
      expect(parsed.code).toBe("PERMISSION_DENIED")
    })

    it("allows member with correct permission", async () => {
      const memberCtx = new DefaultContextBuilder().build({
        userId: "member-user",
        organizationId: "mcp-test-org",
        organizationSlug: "mcp-test",
        userRole: "member",
        permissions: ["inventory:read"],
      })

      const result = await server.callTool(
        { name: "inventory.getStock" },
        memberCtx,
      )

      expect(result.isError).toBe(false)
    })
  })

  describe("adaptContext", () => {
    it("converts McpContextInput to AiContext", () => {
      const input: McpContextInput = {
        clientId: "mcp-client-1",
        userId: "external-user",
        organizationId: "ext-org",
        organizationSlug: "ext-org-slug",
        userRole: "admin",
        permissions: ["inventory:read"],
      }

      const result = server.adaptContext(input)

      expect(result.userId).toBe("external-user")
      expect(result.organizationId).toBe("ext-org")
      expect(result.organizationSlug).toBe("ext-org-slug")
      expect(result.currentModule).toBe("mcp")
    })

    it("strips unknown permissions during context adaptation", () => {
      const input: McpContextInput = {
        clientId: "mcp-client-1",
        userId: "user",
        organizationId: "org",
        organizationSlug: "org-slug",
        userRole: "member",
        permissions: ["inventory:read", "fake:access", "malicious:*"],
      }

      const result = server.adaptContext(input)

      expect(result.permissions).toContain("inventory:read")
      expect(result.permissions).not.toContain("fake:access")
      expect(result.permissions).not.toContain("malicious:*")
    })
  })
})
