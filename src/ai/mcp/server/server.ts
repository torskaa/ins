import type { AiContext } from "@/ai/context/types"
import type { ToolDefinition } from "@/ai/tools/types"
import { getAllTools, getTool, executeTool } from "@/ai/tools/registry"
import { checkToolPermission } from "@/ai/permissions/permission"
import { getCapabilities } from "@/ai/copilot/capabilities"
import { McpContextAdapter } from "../context"
import type { McpContextInput } from "../context"
import { McpServerToolAdapter } from "./tool-adapter"
import { McpCapabilityAdapter } from "./capability-adapter"
import { DefaultCostCalculator } from "@/ai/usage/cost"
import type { CostCalculator } from "@/ai/usage/cost"
import type { McpCallToolResult, McpTool } from "../types"
import type { McpCapability, ListToolsResult, ListCapabilitiesResult, CallToolInput } from "./types"
import type { McpContextInput as McpContextInputType } from "../context"

export class McpServer {
  private toolAdapter: McpServerToolAdapter
  private capabilityAdapter: McpCapabilityAdapter
  private contextAdapter: McpContextAdapter
  private costCalculator: CostCalculator
  private allTools: ToolDefinition[]

  constructor(
    toolAdapter?: McpServerToolAdapter,
    capabilityAdapter?: McpCapabilityAdapter,
    contextAdapter?: McpContextAdapter,
    costCalculator?: CostCalculator,
  ) {
    this.toolAdapter = toolAdapter ?? new McpServerToolAdapter()
    this.capabilityAdapter = capabilityAdapter ?? new McpCapabilityAdapter()
    this.contextAdapter = contextAdapter ?? new McpContextAdapter()
    this.costCalculator = costCalculator ?? new DefaultCostCalculator()
    this.allTools = getAllTools()
  }

  listTools(): ListToolsResult {
    return {
      tools: this.toolAdapter.toMcpTools(this.allTools),
    }
  }

  listCapabilities(): ListCapabilitiesResult {
    const caps = getCapabilities()
    return {
      capabilities: this.capabilityAdapter.toMcpCapabilities(caps),
    }
  }

  async callTool(
    input: CallToolInput,
    ctx: AiContext,
  ): Promise<McpCallToolResult> {
    if (!input.name) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: "Tool name is required" }) }],
        isError: true,
      }
    }

    const validated = this.validateContext(ctx)

    const toolDef = getTool(input.name)
    if (!toolDef) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: `Tool not found: "${input.name}"` }) }],
        isError: true,
      }
    }

    const permission = checkToolPermission(input.name, validated)
    if (!permission.allowed) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: permission.deniedReason ?? "Permission denied",
              code: "PERMISSION_DENIED",
            }),
          },
        ],
        isError: true,
      }
    }

    try {
      const result = await executeTool(input.name, validated, input.arguments ?? {})

      const cost = await this.costCalculator.calculateCost({
        organizationId: validated.organizationId,
        userId: validated.userId,
        toolName: input.name,
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
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : "Tool execution failed",
              code: "EXECUTION_ERROR",
            }),
          },
        ],
        isError: true,
      }
    }
  }

  adaptContext(input: McpContextInputType, metadata?: Record<string, string>): AiContext {
    return this.contextAdapter.adapt(input, metadata)
  }

  private validateContext(ctx: AiContext): AiContext {
    if (!ctx.userId || !ctx.organizationId || !ctx.organizationSlug) {
      throw new Error("Invalid AiContext: userId, organizationId, and organizationSlug are required")
    }
    return ctx
  }
}
