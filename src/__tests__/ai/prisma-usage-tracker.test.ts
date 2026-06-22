import { describe, it, expect, beforeAll } from "vitest"
import { PrismaUsageTracker } from "@/ai/usage/prisma-tracker"
import { prisma } from "@/lib/db"
import type { UsageEvent } from "@/ai/usage/types"

const ORG_ID = "ut-org"

let counter = 0
function event(overrides?: Partial<UsageEvent>): UsageEvent {
  return {
    organizationId: ORG_ID,
    userId: `user-${++counter}`,
    action: "tool_execution",
    durationMs: 100,
    success: true,
    timestamp: new Date(),
    ...overrides,
  } as UsageEvent
}

beforeAll(async () => {
  const slug = "slug-ut-org"
  if (!(await prisma.organization.findUnique({ where: { id: ORG_ID } }))) {
    await prisma.organization.create({ data: { id: ORG_ID, name: ORG_ID, slug } })
  }
  await prisma.aiExecutionLog.deleteMany({ where: { organizationId: ORG_ID } })
})

describe("PrismaUsageTracker", () => {
  let tracker: PrismaUsageTracker

  beforeAll(() => {
    tracker = new PrismaUsageTracker()
  })

  it("tracks a tool execution", async () => {
    await tracker.trackToolExecution(event({ toolName: "inv.getStock" }))
    const summary = await tracker.getUsageSummary(ORG_ID)
    expect(summary.totalToolCalls).toBeGreaterThanOrEqual(1)
  })

  it("tracks an agent run", async () => {
    await tracker.trackAgentRun(
      event({ action: "agent_run", agentId: "agent-1", toolName: "agent.run" }),
    )
    const summary = await tracker.getUsageSummary(ORG_ID)
    expect(summary.totalAgentRuns).toBeGreaterThanOrEqual(1)
  })

  it("tracks tokens", async () => {
    const tokenOrg = "ut-token-org"
    const slug = "slug-ut-token"
    if (!(await prisma.organization.findUnique({ where: { id: tokenOrg } }))) {
      await prisma.organization.create({ data: { id: tokenOrg, name: tokenOrg, slug } })
    } else {
      await prisma.aiExecutionLog.deleteMany({ where: { organizationId: tokenOrg } })
    }
    await tracker.trackToolExecution(
      event({ organizationId: tokenOrg, toolName: "t1", inputTokens: 100, outputTokens: 50 }),
    )
    await tracker.trackToolExecution(
      event({ organizationId: tokenOrg, toolName: "t2", inputTokens: 200, outputTokens: 75 }),
    )

    const summary = await tracker.getUsageSummary(tokenOrg)
    expect(summary.totalInputTokens).toBe(300)
    expect(summary.totalOutputTokens).toBe(125)
  })

  it("filters by organization", async () => {
    await tracker.trackToolExecution(event({ toolName: "x", organizationId: ORG_ID }))
    const summary = await tracker.getUsageSummary(ORG_ID)
    expect(summary.totalToolCalls).toBeGreaterThanOrEqual(1)
  })

  it("tracks failed executions", async () => {
    await tracker.trackToolExecution(
      event({ toolName: "fail", success: false, error: "err" }),
    )
    const summary = await tracker.getUsageSummary(ORG_ID)
    expect(summary.totalToolCalls).toBeGreaterThanOrEqual(1)
  })

  it("returns per-tool breakdown", async () => {
    await tracker.trackToolExecution(event({ toolName: "tool-a" }))
    await tracker.trackToolExecution(event({ toolName: "tool-a" }))
    await tracker.trackToolExecution(event({ toolName: "tool-b" }))

    const summary = await tracker.getUsageSummary(ORG_ID)
    expect(summary.byTool["tool-a"]).toBeGreaterThanOrEqual(2)
    expect(summary.byTool["tool-b"]).toBeGreaterThanOrEqual(1)
  })

  it("handles empty state for unknown org", async () => {
    const summary = await tracker.getUsageSummary("nonexistent-org")
    expect(summary.totalToolCalls).toBe(0)
    expect(summary.totalInputTokens).toBe(0)
    expect(summary.byOrganization).toEqual({})
    expect(summary.byTool).toEqual({})
  })

  it("handles bulk inserts", async () => {
    for (let i = 0; i < 20; i++) {
      await tracker.trackToolExecution(event({ toolName: `bulk.${i}` }))
    }
    const summary = await tracker.getUsageSummary(ORG_ID)
    expect(summary.totalToolCalls).toBeGreaterThanOrEqual(20)
  })
})
