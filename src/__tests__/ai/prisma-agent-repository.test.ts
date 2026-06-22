import { describe, it, expect, beforeAll } from "vitest"
import { PrismaAgentRepository } from "@/services/agents/prisma-agent.repository"
import { DefaultContextBuilder } from "@/ai/context/types"
import { prisma } from "@/lib/db"
import type { AgentRun, AgentStep } from "@/ai/agents/types"

const ctx = new DefaultContextBuilder().build({
  userId: "test-user",
  organizationId: "test-org-repo",
  organizationSlug: "slug-repo",
  userRole: "admin",
  permissions: [],
})

let counter = 0
function nextId(): string {
  return `run-${++counter}`
}

beforeAll(async () => {
  const slug = "slug-repo"
  if (!(await prisma.organization.findUnique({ where: { id: "test-org-repo" } }))) {
    await prisma.organization.create({
      data: { id: "test-org-repo", name: "test-org-repo", slug },
    })
  }
  await prisma.agentRun.deleteMany({ where: { organizationId: "test-org-repo" } })
})

function createRun(overrides?: Partial<AgentRun>): AgentRun {
  return {
    id: nextId(),
    agentId: "test-agent",
    agentName: "Test Agent",
    task: "test task",
    context: ctx,
    steps: [],
    status: "idle",
    startedAt: new Date(),
    ...overrides,
  }
}

describe("PrismaAgentRepository", () => {
  let repo: PrismaAgentRepository

  beforeAll(() => {
    repo = new PrismaAgentRepository()
  })

  it("creates and retrieves an agent run", async () => {
    const run = createRun()
    await repo.createAgentRun(run)

    const retrieved = await repo.getAgentRun(run.id)
    expect(retrieved).toBeDefined()
    expect(retrieved!.id).toBe(run.id)
    expect(retrieved!.agentId).toBe("test-agent")
    expect(retrieved!.agentName).toBe("Test Agent")
    expect(retrieved!.status).toBe("idle")
  })

  it("creates a run with steps", async () => {
    const step: AgentStep = {
      id: "istep-1",
      toolName: "inventory.getStock",
      input: { productId: "p1" },
      output: { stock: 10 },
      status: "success",
      startedAt: new Date(),
      completedAt: new Date(),
      durationMs: 50,
    }

    const run = createRun({ steps: [step] })
    await repo.createAgentRun(run)

    const retrieved = await repo.getAgentRun(run.id)
    expect(retrieved!.steps).toHaveLength(1)
    expect(retrieved!.steps[0].toolName).toBe("inventory.getStock")
    expect(retrieved!.steps[0].input).toEqual({ productId: "p1" })
    expect(retrieved!.steps[0].output).toEqual({ stock: 10 })
  })

  it("creates a run with approval request", async () => {
    const run = createRun({
      id: "approval-run",
      approvalRequest: {
        id: "iapproval-1",
        toolName: "orders.createDraft",
        input: {},
        reason: "Requires approval",
        status: "pending",
        requestedBy: "test-user",
        requestedAt: new Date(),
      },
    })
    await repo.createAgentRun(run)

    const retrieved = await repo.getAgentRun(run.id)
    expect(retrieved!.approvalRequest).toBeDefined()
    expect(retrieved!.approvalRequest!.toolName).toBe("orders.createDraft")
    expect(retrieved!.approvalRequest!.status).toBe("pending")
  })

  it("updates an agent run", async () => {
    const run = createRun()
    await repo.createAgentRun(run)

    await repo.updateAgentRun(run.id, {
      status: "completed",
      summary: "Done!",
      completedAt: new Date(),
    })

    const retrieved = await repo.getAgentRun(run.id)
    expect(retrieved!.status).toBe("completed")
    expect(retrieved!.summary).toBe("Done!")
    expect(retrieved!.completedAt).toBeInstanceOf(Date)
  })

  it("lists runs by agentId and limits results", async () => {
    const runA1 = createRun({ agentId: "agent-listing", task: "task 1" })
    const runA2 = createRun({ agentId: "agent-listing", task: "task 2" })
    const runB = createRun({ agentId: "agent-other", task: "task B" })
    await repo.createAgentRun(runA1)
    await repo.createAgentRun(runA2)
    await repo.createAgentRun(runB)

    const results = await repo.getAgentRuns("agent-listing")
    expect(results.length).toBeGreaterThanOrEqual(2)
    expect(results.every((r) => r.agentId === "agent-listing")).toBe(true)
  })

  it("saves and updates a step", async () => {
    const run = createRun({ id: "step-save-run" })
    await repo.createAgentRun(run)

    const step: AgentStep = {
      id: "istep-save-1",
      toolName: "inventory.getStock",
      input: { productId: "p1" },
      status: "running",
      startedAt: new Date(),
    }

    await repo.saveAgentStep(run.id, step)
    let retrieved = await repo.getAgentRun(run.id)
    expect(retrieved!.steps).toHaveLength(1)

    const updatedStep: AgentStep = {
      ...step,
      id: "istep-save-1",
      status: "success",
      output: { stock: 5 },
      completedAt: new Date(),
      durationMs: 30,
    }

    await repo.saveAgentStep(run.id, updatedStep)
    retrieved = await repo.getAgentRun(run.id)
    expect(retrieved!.steps[0].status).toBe("success")
    expect(retrieved!.steps[0].output).toEqual({ stock: 5 })
  })

  it("returns completed run with durationMs", async () => {
    const startedAt = new Date(Date.now() - 5000)
    const completedAt = new Date()
    const run = createRun({
      id: "completed-run",
      status: "completed",
      startedAt,
      completedAt,
      summary: "Completed successfully",
    })
    await repo.createAgentRun(run)

    const retrieved = await repo.getAgentRun(run.id)
    expect(retrieved!.durationMs).toBeGreaterThanOrEqual(4900)
  })
})
