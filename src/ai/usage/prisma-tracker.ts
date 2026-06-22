import type { UsageEvent, UsageSummary } from "./types"
import type { UsageTracker } from "./tracker"
import { prisma } from "@/lib/db"

export class PrismaUsageTracker implements UsageTracker {
  async trackToolExecution(event: UsageEvent): Promise<void> {
    await prisma.aiExecutionLog.create({
      data: {
        userId: event.userId,
        organizationId: event.organizationId,
        toolName: event.toolName ?? "",
        input: {},
        status: event.success ? "success" : "error",
        errorMessage: event.error ?? null,
        durationMs: event.durationMs,
        action: "tool_execution",
        agentId: event.agentId ?? null,
        provider: event.provider ?? null,
        model: event.model ?? null,
        inputTokens: event.inputTokens ?? null,
        outputTokens: event.outputTokens ?? null,
      },
    })
  }

  async trackAgentRun(event: UsageEvent): Promise<void> {
    await prisma.aiExecutionLog.create({
      data: {
        userId: event.userId,
        organizationId: event.organizationId,
        toolName: event.toolName ?? "",
        input: {},
        status: event.success ? "success" : "error",
        errorMessage: event.error ?? null,
        durationMs: event.durationMs,
        action: "agent_run",
        agentId: event.agentId ?? null,
        provider: event.provider ?? null,
        model: event.model ?? null,
        inputTokens: event.inputTokens ?? null,
        outputTokens: event.outputTokens ?? null,
      },
    })
  }

  async getUsageSummary(organizationId?: string): Promise<UsageSummary> {
    const where = organizationId ? { organizationId } : undefined

    const toolExecutions = await prisma.aiExecutionLog.count({
      where: { ...where, action: "tool_execution" },
    })
    const agentRuns = await prisma.aiExecutionLog.count({
      where: { ...where, action: "agent_run" },
    })
    const orgGroups = await prisma.aiExecutionLog.groupBy({
      by: ["organizationId"],
      where,
      _count: { id: true },
    })
    const toolGroups = await prisma.aiExecutionLog.groupBy({
      by: ["toolName"],
      where,
      _count: { id: true },
    })
    const tokenData = await prisma.aiExecutionLog.aggregate({
      where,
      _sum: { inputTokens: true, outputTokens: true },
    })

    const byOrganization: Record<string, number> = {}
    for (const g of orgGroups) {
      byOrganization[g.organizationId] = g._count.id
    }

    const byTool: Record<string, number> = {}
    for (const g of toolGroups) {
      byTool[g.toolName] = g._count.id
    }

    return {
      totalToolCalls: toolExecutions,
      totalAgentRuns: agentRuns,
      totalInputTokens: tokenData._sum.inputTokens ?? 0,
      totalOutputTokens: tokenData._sum.outputTokens ?? 0,
      byOrganization,
      byTool,
    }
  }
}
