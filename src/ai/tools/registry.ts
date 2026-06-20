import type { ToolDefinition, ToolResponse } from "./types"
import type { AiContext } from "../context/types"
import { inventoryTools } from "./inventory.tools"
import { ordersTools } from "./orders.tools"
import { customersTools } from "./customers.tools"
import { financeTools } from "./finance.tools"
import { checkToolPermission } from "../permissions/permission"
import { executionLogger, createExecutionLogEntry } from "../logs/logger"
import { getUsageTracker } from "../usage"

const allTools: ToolDefinition[] = [
  ...inventoryTools,
  ...ordersTools,
  ...customersTools,
  ...financeTools,
]

const toolMap = new Map<string, ToolDefinition>()

for (const tool of allTools) {
  toolMap.set(tool.name, tool)
}

export function getTool(name: string): ToolDefinition | undefined {
  return toolMap.get(name)
}

export function getAllTools(): ToolDefinition[] {
  return allTools
}

export function getToolsByModule(module: string): ToolDefinition[] {
  return allTools.filter(t => t.name.startsWith(module + "."))
}

export async function executeTool(
  name: string,
  ctx: AiContext,
  args: Record<string, any> = {},
): Promise<ToolResponse> {
  const startTime = Date.now()
  const tool = toolMap.get(name)

  if (!tool) {
    const errorResponse: ToolResponse = {
      success: false,
      error: { code: "TOOL_NOT_FOUND", message: `Tool "${name}" not found` },
    }
    await executionLogger.log(
      await createExecutionLogEntry(name, args, errorResponse, "error", ctx, Date.now() - startTime),
    )
    return errorResponse
  }

  const permission = checkToolPermission(name, ctx)
  if (!permission.allowed) {
    const deniedResponse: ToolResponse = {
      success: false,
      error: { code: "PERMISSION_DENIED", message: permission.deniedReason ?? "Access denied" },
    }
    await executionLogger.log(
      await createExecutionLogEntry(name, args, deniedResponse, "denied", ctx, Date.now() - startTime),
    )
    return deniedResponse
  }

  const result: ToolResponse = await tool.execute(args)

  await executionLogger.log(
    await createExecutionLogEntry(
      name,
      args,
      result,
      result.success ? "success" : "error",
      ctx,
      Date.now() - startTime,
      result.error?.message,
    ),
  )

  getUsageTracker().trackToolExecution({
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    toolName: name,
    action: "tool_execution",
    durationMs: Date.now() - startTime,
    success: result.success,
    error: result.error?.message,
    timestamp: new Date(),
  })

  return result
}
