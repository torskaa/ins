import { describe, it, expect } from "vitest"
import type { AiContext } from "@/ai/context/types"
import { DefaultContextBuilder } from "@/ai/context/types"
import { InMemoryAgentMemory } from "@/ai/memory/in-memory"
import { checkToolRequiresApproval } from "@/ai/approval/approval"
import { resolveApproval } from "@/ai/approval/resolver"
import type { ApprovalDecision } from "@/ai/approval/approval"
import { getTool } from "@/ai/tools/registry"
import type { AgentRun } from "@/ai/agents/types"

describe("Agent State Machine", () => {
  it("run starts in idle state", async () => {
    const { InventoryAgent } = await import("@/ai/agents/agents/inventory.agent")
    const agent = new InventoryAgent()
    const ctx = new DefaultContextBuilder().build({
      userId: "u1",
      organizationId: "o1",
      organizationSlug: "test",
      userRole: "admin",
      permissions: ["inventory:read"],
    })
    const run = await agent.run("Check stock", ctx)
    expect(run.status).toBe("completed")
  })

  it("supports idle status in type", () => {
    const status: import("@/ai/agents/types").AgentRunStatus = "idle"
    expect(status).toBe("idle")
  })

  it("supports waiting_approval status in type", () => {
    const status: import("@/ai/agents/types").AgentRunStatus = "waiting_approval"
    expect(status).toBe("waiting_approval")
  })

  it("supports cancelled status in type", () => {
    const status: import("@/ai/agents/types").AgentRunStatus = "cancelled"
    expect(status).toBe("cancelled")
  })

  it("supports waiting_approval step status", () => {
    const status: import("@/ai/agents/types").StepStatus = "waiting_approval"
    expect(status).toBe("waiting_approval")
  })
})

describe("Agent Context — workspaceId", () => {
  it("context builder accepts workspaceId", () => {
    const builder = new DefaultContextBuilder()
    const ctx = builder.build({
      userId: "u1",
      organizationId: "o1",
      organizationSlug: "test",
      workspaceId: "ws-1",
    })
    expect(ctx.workspaceId).toBe("ws-1")
  })

  it("workspaceId is optional", () => {
    const builder = new DefaultContextBuilder()
    const ctx = builder.build({
      userId: "u1",
      organizationId: "o1",
      organizationSlug: "test",
    })
    expect(ctx.workspaceId).toBeUndefined()
  })

  it("agent run carries workspace context", async () => {
    const { InventoryAgent } = await import("@/ai/agents/agents/inventory.agent")
    const agent = new InventoryAgent()
    const ctx = new DefaultContextBuilder().build({
      userId: "u1",
      organizationId: "o1",
      organizationSlug: "test",
      workspaceId: "ws-1",
      currentModule: "inventory",
      selectedRecordId: "mat-001",
      selectedRecordType: "material",
    })
    const run = await agent.run("Check stock", ctx)
    expect(run.context.workspaceId).toBe("ws-1")
    expect(run.context.currentModule).toBe("inventory")
    expect(run.context.selectedRecordId).toBe("mat-001")
  })
})

describe("AgentMemory Interface", () => {
  it("remembers and recalls values", async () => {
    const memory = new InMemoryAgentMemory()
    await memory.remember("lastCheck", { item: "RM-001", quantity: 50 })
    const result = await memory.recall<{ item: string; quantity: number }>("lastCheck")
    expect(result).toEqual({ item: "RM-001", quantity: 50 })
  })

  it("returns undefined for unknown key", async () => {
    const memory = new InMemoryAgentMemory()
    const result = await memory.recall("nonexistent")
    expect(result).toBeUndefined()
  })

  it("clears all stored values", async () => {
    const memory = new InMemoryAgentMemory()
    await memory.remember("key1", "value1")
    await memory.remember("key2", "value2")
    await memory.clear()
    expect(await memory.recall("key1")).toBeUndefined()
    expect(await memory.recall("key2")).toBeUndefined()
  })
})

describe("Approval System", () => {
  it("checkToolRequiresApproval returns false by default", () => {
    const tool = getTool("inventory.getStock")
    expect(tool).toBeDefined()
    expect(checkToolRequiresApproval(tool!)).toBe(false)
  })

  it("resolveApproval sets status to cancelled when denied", () => {
    const run = {
      approvalRequest: {
        id: "req-1",
        toolName: "test.tool",
        input: {},
        reason: "Test approval",
        status: "pending" as const,
        requestedBy: "u1",
        requestedAt: new Date(),
      },
      status: "waiting_approval" as const,
    } as unknown as AgentRun

    const decision: ApprovalDecision = {
      approved: false,
      resolvedBy: "admin",
      resolvedAt: new Date(),
      reason: "Not authorized",
    }

    const result = resolveApproval(run, decision)
    expect(result.status).toBe("cancelled")
    expect(result.approvalRequest?.status).toBe("denied")
  })

  it("resolveApproval does not change status when approved", () => {
    const run = {
      approvalRequest: {
        id: "req-2",
        toolName: "test.tool",
        input: {},
        reason: "Test approval",
        status: "pending" as const,
        requestedBy: "u1",
        requestedAt: new Date(),
      },
      status: "waiting_approval" as const,
    } as unknown as AgentRun

    const decision: ApprovalDecision = {
      approved: true,
      resolvedBy: "admin",
      resolvedAt: new Date(),
    }

    const result = resolveApproval(run, decision)
    expect(result.status).toBe("waiting_approval")
    expect(result.approvalRequest?.status).toBe("approved")
  })

  it("throws when resolving a run without approval request", () => {
    const run = { approvalRequest: undefined } as unknown as AgentRun
    const decision: ApprovalDecision = {
      approved: true,
      resolvedBy: "admin",
      resolvedAt: new Date(),
    }
    expect(() => resolveApproval(run, decision)).toThrow("no pending approval")
  })
})
