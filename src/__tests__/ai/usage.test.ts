import { describe, it, expect } from "vitest"
import { InMemoryUsageTracker } from "@/ai/usage/memory-tracker"
import { getUsageTracker, setUsageTracker, getUsageQuota, SAAS_PLANS, setUsageQuota } from "@/ai/usage"
import { PassthroughQuota } from "@/ai/usage/quota"
import { DefaultContextBuilder } from "@/ai/context/types"
import { executeTool } from "@/ai/tools/registry"
import type { UsageEvent } from "@/ai/usage/types"
import { DefaultCostCalculator, DEFAULT_PRICING } from "@/ai/usage/cost"

describe("Usage Tracker", () => {
  it("tracks tool execution events with success and error fields", async () => {
    const tracker = new InMemoryUsageTracker()
    await tracker.trackToolExecution({
      organizationId: "o1",
      userId: "u1",
      toolName: "inventory.getStock",
      action: "tool_execution",
      durationMs: 42,
      success: true,
      timestamp: new Date(),
    })

    const summary = await tracker.getUsageSummary()
    expect(summary.totalToolCalls).toBe(1)
    expect(summary.byTool["inventory.getStock"]).toBe(1)
  })

  it("tracks agent run events", async () => {
    const tracker = new InMemoryUsageTracker()
    await tracker.trackAgentRun({
      organizationId: "o1",
      userId: "u1",
      agentId: "inventory-agent",
      action: "agent_run",
      durationMs: 150,
      success: true,
      timestamp: new Date(),
    })

    const summary = await tracker.getUsageSummary()
    expect(summary.totalAgentRuns).toBe(1)
  })

  it("tracks input and output tokens", async () => {
    const tracker = new InMemoryUsageTracker()
    await tracker.trackToolExecution({
      organizationId: "o1",
      userId: "u1",
      toolName: "inventory.forecast",
      action: "tool_execution",
      provider: "openai",
      model: "gpt-4o",
      inputTokens: 500,
      outputTokens: 120,
      durationMs: 2000,
      success: true,
      timestamp: new Date(),
    })

    const summary = await tracker.getUsageSummary()
    expect(summary.totalInputTokens).toBe(500)
    expect(summary.totalOutputTokens).toBe(120)
  })

  it("tracks failed executions with error message", async () => {
    const tracker = new InMemoryUsageTracker()
    await tracker.trackToolExecution({
      organizationId: "o1",
      userId: "u1",
      toolName: "inventory.getStock",
      action: "tool_execution",
      durationMs: 10,
      success: false,
      error: "Something went wrong",
      timestamp: new Date(),
    })

    const summary = await tracker.getUsageSummary()
    expect(summary.totalToolCalls).toBe(1)
  })

  it("supports organization isolation", async () => {
    const tracker = new InMemoryUsageTracker()
    await tracker.trackToolExecution({
      organizationId: "org-a",
      userId: "u1",
      toolName: "inventory.getStock",
      action: "tool_execution",
      durationMs: 10,
      success: true,
      timestamp: new Date(),
    })
    await tracker.trackToolExecution({
      organizationId: "org-b",
      userId: "u1",
      toolName: "inventory.getStock",
      action: "tool_execution",
      durationMs: 10,
      success: true,
      timestamp: new Date(),
    })

    const summaryA = await tracker.getUsageSummary("org-a")
    const summaryAll = await tracker.getUsageSummary()

    expect(summaryA.totalToolCalls).toBe(1)
    expect(summaryAll.totalToolCalls).toBe(2)
  })

  it("integrates with tool registry via singleton", () => {
    expect(getUsageTracker()).toBeDefined()
    expect(typeof getUsageTracker().trackToolExecution).toBe("function")
    expect(typeof getUsageTracker().trackAgentRun).toBe("function")
    expect(typeof getUsageTracker().getUsageSummary).toBe("function")
  })

  it("can swap tracker implementation", () => {
    const mock = new InMemoryUsageTracker()
    setUsageTracker(mock)
    expect(getUsageTracker()).toBe(mock)
  })

  it("tool execution via registry is tracked", async () => {
    setUsageTracker(new InMemoryUsageTracker())
    const ctx = new DefaultContextBuilder().build({
      userId: "usage-test-user",
      organizationId: "usage-test-org",
      organizationSlug: "test",
      userRole: "admin",
      permissions: ["inventory:read"],
    })

    await executeTool("inventory.getStock", ctx)
    const summary = await getUsageTracker().getUsageSummary()
    expect(summary.totalToolCalls).toBe(1)
    const orgSummary = await getUsageTracker().getUsageSummary("usage-test-org")
    expect(orgSummary.totalToolCalls).toBe(1)
  })
})

describe("Usage Quota", () => {
  it("SAAS_PLANS defines free, pro, and enterprise limits", () => {
    expect(SAAS_PLANS.free.maxToolCalls).toBe(100)
    expect(SAAS_PLANS.free.maxAgentRuns).toBe(50)
    expect(SAAS_PLANS.pro.maxToolCalls).toBe(10_000)
    expect(SAAS_PLANS.enterprise.maxToolCalls).toBe(Infinity)
  })

  it("PassthroughQuota allows all by default", async () => {
    const tracker = new InMemoryUsageTracker()
    const quota = new PassthroughQuota(tracker)

    const result = await quota.checkLimit("org-1", "free")
    expect(result.allowed).toBe(true)
  })

  it("PassthroughQuota returns plan limits", async () => {
    const quota = new PassthroughQuota(new InMemoryUsageTracker())
    const remaining = await quota.getRemaining("org-1", "free")
    expect(remaining.maxToolCalls).toBe(100)
    expect(remaining.maxAgentRuns).toBe(50)
  })

  it("quota singleton is available via getUsageQuota", () => {
    const quota = getUsageQuota()
    expect(quota).toBeDefined()
    expect(typeof quota.checkLimit).toBe("function")
    expect(typeof quota.recordUsage).toBe("function")
    expect(typeof quota.getRemaining).toBe("function")
  })

  it("can swap quota implementation", () => {
    const mock = new PassthroughQuota(new InMemoryUsageTracker())
    setUsageQuota(mock)
    expect(getUsageQuota()).toBe(mock)
  })
})

describe("Cost Calculator", () => {
  it("calculates cost for known OpenAI model", async () => {
    const calc = new DefaultCostCalculator()
    const result = await calc.calculateCost({
      organizationId: "o1",
      userId: "u1",
      action: "tool_execution",
      provider: "openai",
      model: "gpt-4o",
      inputTokens: 1000,
      outputTokens: 500,
      durationMs: 100,
      success: true,
      timestamp: new Date(),
    })

    expect(result.currency).toBe("USD")
    expect(result.amount).toBe(0.0075) // (1000/1000)*0.0025 + (500/1000)*0.01 = 0.0025 + 0.005 = 0.0075
    expect(result.estimated).toBe(false)
  })

  it("calculates cost for known Anthropic model", async () => {
    const calc = new DefaultCostCalculator()
    const result = await calc.calculateCost({
      organizationId: "o1",
      userId: "u1",
      action: "tool_execution",
      provider: "anthropic",
      model: "claude-3-5-sonnet-20241022",
      inputTokens: 2000,
      outputTokens: 400,
      durationMs: 100,
      success: true,
      timestamp: new Date(),
    })

    expect(result.amount).toBe(0.012) // (2000/1000)*0.003 + (400/1000)*0.015 = 0.006 + 0.006 = 0.012
  })

  it("returns estimated: true for unknown models", async () => {
    const calc = new DefaultCostCalculator()
    const result = await calc.calculateCost({
      organizationId: "o1",
      userId: "u1",
      action: "tool_execution",
      provider: "unknown",
      model: "custom-model-v1",
      inputTokens: 1000,
      outputTokens: 1000,
      durationMs: 100,
      success: true,
      timestamp: new Date(),
    })

    expect(result.estimated).toBe(true)
    expect(result.amount).toBeGreaterThan(0)
  })

  it("returns zero cost for local model", async () => {
    const calc = new DefaultCostCalculator()
    const result = await calc.calculateCost({
      organizationId: "o1",
      userId: "u1",
      action: "tool_execution",
      provider: "local",
      model: "local",
      inputTokens: 5000,
      outputTokens: 3000,
      durationMs: 100,
      success: true,
      timestamp: new Date(),
    })

    expect(result.amount).toBe(0)
    expect(result.estimated).toBe(false)
  })

  it("returns zero when no tokens provided", async () => {
    const calc = new DefaultCostCalculator()
    const result = await calc.calculateCost({
      organizationId: "o1",
      userId: "u1",
      action: "tool_execution",
      durationMs: 100,
      success: true,
      timestamp: new Date(),
    })

    expect(result.amount).toBe(0)
  })

  it("accepts custom pricing table", async () => {
    const calc = new DefaultCostCalculator({
      "custom-model": { inputPricePer1k: 0.01, outputPricePer1k: 0.02 },
    })
    const result = await calc.calculateCost({
      organizationId: "o1",
      userId: "u1",
      action: "tool_execution",
      provider: "custom",
      model: "custom-model",
      inputTokens: 1000,
      outputTokens: 1000,
      durationMs: 100,
      success: true,
      timestamp: new Date(),
    })

    expect(result.amount).toBe(0.03) // (1000/1000)*0.01 + (1000/1000)*0.02
    expect(result.estimated).toBe(false)
  })

  it("exports DEFAULT_PRICING with expected structure", () => {
    expect(DEFAULT_PRICING["gpt-4o"]).toBeDefined()
    expect(DEFAULT_PRICING["gpt-4o"].inputPricePer1k).toBe(0.0025)
    expect(DEFAULT_PRICING["claude-3-5-sonnet-20241022"]).toBeDefined()
    expect(DEFAULT_PRICING["local"].inputPricePer1k).toBe(0)
  })
})
