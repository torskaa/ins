import type { AiContext } from "../context/types"
import type { ToolDefinition } from "../tools/types"
import { getAllTools, getTool, executeTool as registryExecuteTool } from "../tools/registry"
import { DefaultCostCalculator } from "../usage/cost"
import type { CostCalculator } from "../usage/cost"
import { McpToolAdapter } from "./mcp-tool-adapter"
import type {
  McpTool,
  McpCallToolResult,
  JsonRpcRequest,
  JsonRpcResponse,
} from "./types"
import { MCP_ERROR_CODES } from "./types"

export class McpServer {
  private toolAdapter: McpToolAdapter
  private costCalculator: CostCalculator
  private allTools: ToolDefinition[]

  constructor(
    toolAdapter?: McpToolAdapter,
    costCalculator?: CostCalculator,
  ) {
    this.toolAdapter = toolAdapter ?? new McpToolAdapter()
    this.costCalculator = costCalculator ?? new DefaultCostCalculator()
    this.allTools = getAllTools()
  }

  listTools(): McpTool[] {
    return this.toolAdapter.toMcpTools(this.allTools)
  }

  async executeTool(
    name: string,
    ctx: AiContext,
    args: Record<string, unknown> = {},
  ): Promise<McpCallToolResult> {
    const validatedCtx = this.validateContext(ctx)

    const toolDef = getTool(name)
    if (!toolDef) {
      return this.errorResult(`Tool not found: "${name}"`)
    }

    const result = await registryExecuteTool(name, validatedCtx, args)

    const cost = await this.costCalculator.calculateCost({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      toolName: name,
      action: "tool_execution",
      durationMs: 0,
      success: result.success,
      error: result.error?.message,
      timestamp: new Date(),
    })

    const text = result.success
      ? JSON.stringify(result.data ?? {})
      : JSON.stringify({ error: result.error })

    return {
      content: [{ type: "text", text }],
      isError: !result.success,
      meta: { cost },
    }
  }

  async handleRequest(
    request: JsonRpcRequest,
    ctx?: AiContext,
  ): Promise<JsonRpcResponse> {
    switch (request.method) {
      case "tools/list": {
        const tools = this.listTools()
        return this.successResponse(request.id, { tools })
      }

      case "tools/call": {
        const params = request.params as {
          name?: string
          arguments?: Record<string, unknown>
        } | undefined

        if (!params?.name) {
          return this.errorResponse(request.id, MCP_ERROR_CODES.INVALID_PARAMS, "Missing tool name")
        }

        if (!ctx) {
          return this.errorResponse(
            request.id,
            MCP_ERROR_CODES.INVALID_REQUEST,
            "AiContext is required for tool execution",
          )
        }

        try {
          const result = await this.executeTool(params.name, ctx, params.arguments)
          return this.successResponse(request.id, result)
        } catch (error) {
          return this.errorResponse(
            request.id,
            MCP_ERROR_CODES.INTERNAL_ERROR,
            error instanceof Error ? error.message : "Tool execution failed",
          )
        }
      }

      default:
        return this.errorResponse(
          request.id,
          MCP_ERROR_CODES.METHOD_NOT_FOUND,
          `Method not supported: "${request.method}"`,
        )
    }
  }

  private validateContext(ctx: AiContext): AiContext {
    if (!ctx.userId || !ctx.organizationId || !ctx.organizationSlug) {
      throw new Error("Invalid AiContext: userId, organizationId, and organizationSlug are required")
    }
    return ctx
  }

  private errorResult(message: string): McpCallToolResult {
    return {
      content: [{ type: "text", text: JSON.stringify({ error: message }) }],
      isError: true,
    }
  }

  private successResponse(id: string | number, result: unknown): JsonRpcResponse {
    return { jsonrpc: "2.0", id, result }
  }

  private errorResponse(
    id: string | number,
    code: number,
    message: string,
    data?: unknown,
  ): JsonRpcResponse {
    return { jsonrpc: "2.0", id, error: { code, message, data } }
  }
}
