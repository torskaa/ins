import { describe, it, expect, beforeAll } from "vitest"
import type { AiContext } from "@/ai/context/types"
import { DefaultContextBuilder } from "@/ai/context/types"
import { getAllAgents, getAgent } from "@/ai/agents/registry"
import { InventoryAgent } from "@/ai/agents/agents/inventory.agent"
import { FinanceAgent } from "@/ai/agents/agents/finance.agent"
import { SalesAgent } from "@/ai/agents/agents/sales.agent"
import { getAgentRuns } from "@/ai/agents/agent-run-store"
import { registerAgent } from "@/ai/agents/registry"
import { getTool } from "@/ai/tools/registry"
import { RulePlanner } from "@/ai/agents/planner/rule-planner"

const rulePlanner = new RulePlanner()
function withPlanner(agent: InventoryAgent | FinanceAgent | SalesAgent) {
  agent.setPlanner(rulePlanner)
  return agent
}

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

beforeAll(() => {
  if (!getAgent("inventory-agent")) {
    registerAgent(withPlanner(new InventoryAgent()))
    registerAgent(withPlanner(new FinanceAgent()))
    registerAgent(withPlanner(new SalesAgent()))
  }
})

describe("Agent Registry", () => {
  it("registers and retrieves agents", () => {
    const inventory = getAgent("inventory-agent")
    expect(inventory).toBeDefined()
    expect(inventory?.id).toBe("inventory-agent")
    expect(inventory?.name).toBe("Inventory Agent")
  })

  it("lists all registered agents", () => {
    const agents = getAllAgents()
    expect(agents.length).toBeGreaterThanOrEqual(3)
    expect(agents.map(a => a.id)).toContain("inventory-agent")
    expect(agents.map(a => a.id)).toContain("finance-agent")
    expect(agents.map(a => a.id)).toContain("sales-agent")
  })

  it("returns undefined for unknown agent", () => {
    expect(getAgent("unknown-agent")).toBeUndefined()
  })

  it("throws when registering duplicate agent", () => {
    expect(() => registerAgent(new InventoryAgent())).toThrow("already registered")
  })
})

describe("Agent Definitions", () => {
  it("every agent has required identity fields", () => {
    for (const agent of getAllAgents()) {
      expect(agent.id).toBeTruthy()
      expect(agent.name).toBeTruthy()
      expect(agent.role).toBeTruthy()
      expect(agent.goal).toBeTruthy()
      expect(agent.instructions).toBeTruthy()
      expect(agent.availableTools).toBeInstanceOf(Array)
      expect(agent.availableTools.length).toBeGreaterThan(0)
    }
  })

  it("agent tools exist in the registry", () => {
    for (const agent of getAllAgents()) {
      for (const toolName of agent.availableTools) {
        const tool = getTool(toolName)
        expect(tool).toBeDefined()
        expect(tool?.name).toBe(toolName)
      }
    }
  })

  it("agents have distinct IDs and names", () => {
    const agents = getAllAgents()
    const ids = agents.map(a => a.id)
    const names = agents.map(a => a.name)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(names).size).toBe(names.length)
  })
})

describe("RulePlanner — Inventory", () => {
  it("plans low stock check for low stock task", async () => {
    const ctx = createTestContext()
    const steps = await rulePlanner.plan(
      "Show me items that are low on stock",
      ctx,
      ["inventory.getStock", "inventory.getLowStock", "inventory.forecast"],
    )
    expect(steps.length).toBeGreaterThan(0)
    expect(steps.some(s => s.toolName === "inventory.getLowStock")).toBe(true)
  })

  it("plans forecast for prediction task", async () => {
    const ctx = createTestContext()
    const steps = await rulePlanner.plan(
      "Forecast stock for item RM-001",
      ctx,
      ["inventory.getStock", "inventory.getLowStock", "inventory.forecast"],
    )
    expect(steps.some(s => s.toolName === "inventory.forecast")).toBe(true)
  })

  it("plans stock check by default", async () => {
    const ctx = createTestContext()
    const steps = await rulePlanner.plan(
      "Show all inventory",
      ctx,
      ["inventory.getStock", "inventory.getLowStock", "inventory.forecast"],
    )
    expect(steps.some(s => s.toolName === "inventory.getStock")).toBe(true)
  })
})

describe("RulePlanner — Finance", () => {
  it("plans outstanding check for unpaid task", async () => {
    const ctx = createTestContext()
    const steps = await rulePlanner.plan(
      "What is outstanding?",
      ctx,
      ["finance.getSummary", "finance.getOutstanding"],
    )
    expect(steps.some(s => s.toolName === "finance.getOutstanding")).toBe(true)
  })

  it("plans summary for overview task", async () => {
    const ctx = createTestContext()
    const steps = await rulePlanner.plan(
      "Give me a financial summary",
      ctx,
      ["finance.getSummary", "finance.getOutstanding"],
    )
    expect(steps.some(s => s.toolName === "finance.getSummary")).toBe(true)
  })
})

describe("RulePlanner — Sales", () => {
  it("plans customer search for search task", async () => {
    const ctx = createTestContext()
    const steps = await rulePlanner.plan(
      "Search for Acme Corp",
      ctx,
      ["orders.getActive", "customers.search"],
    )
    expect(steps.some(s => s.toolName === "customers.search")).toBe(true)
  })

  it("plans active orders for order task", async () => {
    const ctx = createTestContext()
    const steps = await rulePlanner.plan(
      "Show active orders",
      ctx,
      ["orders.getActive", "customers.search"],
    )
    expect(steps.some(s => s.toolName === "orders.getActive")).toBe(true)
  })
})

describe("Agent Execution", () => {
  it("InventoryAgent runs and returns completed run", async () => {
    const agent = withPlanner(new InventoryAgent())
    const ctx = createTestContext()
    const run = await agent.run("Check low stock items", ctx)

    expect(run.status).toBe("completed")
    expect(run.agentId).toBe("inventory-agent")
    expect(run.task).toBe("Check low stock items")
    expect(run.steps.length).toBeGreaterThan(0)
    expect(run.durationMs).toBeGreaterThanOrEqual(0)
    expect(run.summary).toBeTruthy()
  })

  it("FinanceAgent runs and returns summary", async () => {
    const agent = withPlanner(new FinanceAgent())
    const ctx = createTestContext()
    const run = await agent.run("Show financial health", ctx)

    expect(run.status).toBe("completed")
    expect(run.steps.length).toBeGreaterThan(0)
    expect(run.summary).toBeTruthy()
  })

  it("SalesAgent runs and returns results", async () => {
    const agent = withPlanner(new SalesAgent())
    const ctx = createTestContext()
    const run = await agent.run("Find customer named Acme", ctx)

    expect(run.status).toBe("completed")
    expect(run.steps.length).toBeGreaterThan(0)
  })

  it("agent run is recorded in store", async () => {
    const ctx = createTestContext()
    const agent = withPlanner(new InventoryAgent())
    await agent.run("Check stock", ctx)

    const runs = getAgentRuns("inventory-agent", 5)
    expect(runs.length).toBeGreaterThan(0)
    expect(runs[0].agentId).toBe("inventory-agent")
  })

  it("run records step details", async () => {
    const ctx = createTestContext()
    const agent = withPlanner(new InventoryAgent())
    const run = await agent.run("Show all stock", ctx)

    for (const step of run.steps) {
      expect(step.id).toBeTruthy()
      expect(step.toolName).toBeTruthy()
      expect(step.status).toBe("success")
      expect(step.output).toBeDefined()
      expect(step.durationMs).toBeGreaterThanOrEqual(0)
    }
  })
})

describe("Agent — No Direct Access", () => {
  it("agent does not import services or repositories", () => {
    const agentCode = InventoryAgent.toString()
    expect(agentCode).not.toContain("service")
    expect(agentCode).not.toContain("repository")
    expect(agentCode).not.toContain("prisma")
    expect(agentCode).not.toContain("mock")
  })

  it("agent contains no keyword matching or planning decisions", () => {
    const agentCode = InventoryAgent.toString()
    expect(agentCode).not.toContain("includes(")
    expect(agentCode).not.toContain("toLowerCase")
    expect(agentCode).not.toContain("keyword")
    expect(agentCode).not.toContain("fallback")
  })

  it("planner contains keyword planning logic", () => {
    const plannerCode = RulePlanner.toString()
    expect(plannerCode).toContain("keywords")
    expect(plannerCode).toContain("toLowerCase")
    expect(plannerCode).toContain("includes(")
  })
})
