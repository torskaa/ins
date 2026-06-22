import { describe, it, expect, beforeEach } from "vitest"
import { McpServer, McpToolAdapter, ToolSchemaMapper, MCP_ERROR_CODES } from "@/ai/mcp"
import { setUsageTracker, getUsageTracker, InMemoryUsageTracker } from "@/ai/usage"
import { DefaultContextBuilder } from "@/ai/context/types"
import type { AiContext } from "@/ai/context/types"
import type { JsonRpcRequest } from "@/ai/mcp/types"

function testContext(): AiContext {
  return new DefaultContextBuilder().build({
    userId: "mcp-test-user",
    organizationId: "mcp-test-org",
    organizationSlug: "mcp-test",
    userRole: "admin",
    permissions: ["inventory:read", "orders:read", "customers:read", "finance:read"],
  })
}

describe("McpServer", () => {
  let server: McpServer
  let ctx: AiContext

  beforeEach(() => {
    setUsageTracker(new InMemoryUsageTracker())
    server = new McpServer()
    ctx = testContext()
  })

  describe("listTools", () => {
    it("returns all available tools", () => {
      const tools = server.listTools()

      expect(Array.isArray(tools)).toBe(true)
      expect(tools.length).toBeGreaterThanOrEqual(21)
    })

    it("each tool has name, description, and inputSchema", () => {
      const tools = server.listTools()

      for (const tool of tools) {
        expect(tool).toHaveProperty("name")
        expect(tool).toHaveProperty("description")
        expect(tool).toHaveProperty("inputSchema")
        expect(tool.inputSchema).toHaveProperty("type", "object")
      }
    })

    it("includes tools from all four modules", () => {
      const tools = server.listTools()
      const names = tools.map(t => t.name)

      expect(names).toContain("inventory.getStock")
      expect(names).toContain("orders.getActive")
      expect(names).toContain("customers.search")
      expect(names).toContain("finance.getInvoices")
    })
  })

  describe("executeTool", () => {
    it("executes a tool and returns success result", async () => {
      const result = await server.executeTool("inventory.getStock", ctx)

      expect(result.isError).toBe(false)
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe("text")

      const data = JSON.parse(result.content[0].text)
      expect(data).toBeDefined()
    })

    it("returns error for unknown tool", async () => {
      const result = await server.executeTool("nonexistent.tool", ctx)

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain("Tool not found")
    })

    it("returns error when context is invalid", async () => {
      const badCtx = { ...ctx, userId: "" }

      await expect(
        server.executeTool("inventory.getStock", badCtx as AiContext),
      ).rejects.toThrow("Invalid AiContext")
    })

    it("includes cost metadata in result", async () => {
      const result = await server.executeTool("inventory.getStock", ctx)

      expect(result.meta).toBeDefined()
      expect(result.meta?.cost).toBeDefined()
      expect(result.meta?.cost?.currency).toBe("USD")
      expect(typeof result.meta?.cost?.amount).toBe("number")
    })

    it("creates usage event via tool registry", async () => {
      await server.executeTool("inventory.getStock", ctx)

      const summary = await getUsageTracker().getUsageSummary()

      expect(summary.totalToolCalls).toBeGreaterThanOrEqual(1)
    })
  })

  describe("handleRequest (JSON-RPC)", () => {
    it("handles tools/list request", async () => {
      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
      }

      const response = await server.handleRequest(request)

      expect(response.jsonrpc).toBe("2.0")
      expect(response.id).toBe(1)
      expect(response.error).toBeUndefined()

      const result = response.result as { tools: unknown[] }
      expect(result.tools).toBeDefined()
      expect(Array.isArray(result.tools)).toBe(true)
    })

    it("handles tools/call request with valid context", async () => {
      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "inventory.getStock",
          arguments: {},
        },
      }

      const response = await server.handleRequest(request, ctx)

      expect(response.jsonrpc).toBe("2.0")
      expect(response.id).toBe(2)
      expect(response.error).toBeUndefined()

      const result = response.result as { content: Array<{ text: string }>; isError: boolean }
      expect(result.isError).toBe(false)
      expect(result.content[0].text).toBeDefined()
    })

    it("returns error for tools/call without name", async () => {
      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { arguments: {} },
      }

      const response = await server.handleRequest(request, ctx)

      expect(response.error).toBeDefined()
      expect(response.error!.code).toBe(MCP_ERROR_CODES.INVALID_PARAMS)
    })

    it("returns error for tools/call without context", async () => {
      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: { name: "inventory.getStock" },
      }

      const response = await server.handleRequest(request)

      expect(response.error).toBeDefined()
      expect(response.error!.code).toBe(MCP_ERROR_CODES.INVALID_REQUEST)
    })

    it("returns error for unknown method", async () => {
      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        id: 5,
        method: "tools/unknown",
      }

      const response = await server.handleRequest(request)

      expect(response.error).toBeDefined()
      expect(response.error!.code).toBe(MCP_ERROR_CODES.METHOD_NOT_FOUND)
    })
  })
})

describe("McpToolAdapter", () => {
  it("converts ToolDefinition to McpTool", () => {
    const adapter = new McpToolAdapter()
    const toolDef = {
      name: "test.tool",
      description: "A test tool",
      inputSchema: {
        type: "object" as const,
        properties: {
          id: { type: "string", description: "Item ID" },
          count: { type: "number" },
        },
        required: ["id"],
      },
      requiredPermissions: ["inventory:read"] as any,
      execute: async () => ({ success: true, data: null }),
    }

    const mcpTool = adapter.toMcpTool(toolDef)

    expect(mcpTool.name).toBe("test.tool")
    expect(mcpTool.description).toBe("A test tool")
    expect(mcpTool.inputSchema).toEqual({
      type: "object",
      properties: {
        id: { type: "string", description: "Item ID" },
        count: { type: "number" },
      },
      required: ["id"],
    })
  })
})

describe("ToolSchemaMapper", () => {
  it("maps optional fields without required array", () => {
    const mapper = new ToolSchemaMapper()
    const schema = mapper.toJsonSchema({
      type: "object",
      properties: {
        name: { type: "string", description: "A name" },
      },
    })

    expect(schema).toEqual({
      type: "object",
      properties: {
        name: { type: "string", description: "A name" },
      },
    })
    expect(schema).not.toHaveProperty("required")
  })

  it("maps enum properties", () => {
    const mapper = new ToolSchemaMapper()
    const schema = mapper.toJsonSchema({
      type: "object",
      properties: {
        status: { type: "string", enum: ["active", "inactive"] },
      },
    }) as { properties: Record<string, unknown> }

    expect((schema.properties.status as { enum: string[] }).enum).toEqual(["active", "inactive"])
  })
})

describe("MCP Error Codes", () => {
  it("defines standard JSON-RPC and custom error codes", () => {
    expect(MCP_ERROR_CODES.INVALID_REQUEST).toBe(-32600)
    expect(MCP_ERROR_CODES.METHOD_NOT_FOUND).toBe(-32601)
    expect(MCP_ERROR_CODES.INVALID_PARAMS).toBe(-32602)
    expect(MCP_ERROR_CODES.INTERNAL_ERROR).toBe(-32603)
    expect(MCP_ERROR_CODES.PERMISSION_DENIED).toBe(-32001)
    expect(MCP_ERROR_CODES.TOOL_NOT_FOUND).toBe(-32002)
  })
})
