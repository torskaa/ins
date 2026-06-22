import type { AgentRepository } from "./agent.repository"
import type { AgentRun, AgentStep, ApprovalRequest } from "@/ai/agents/types"
import { prisma } from "@/lib/db"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function json(value: unknown): any {
  return value ? JSON.parse(JSON.stringify(value)) : undefined
}

export class PrismaAgentRepository implements AgentRepository {
  async createAgentRun(run: AgentRun): Promise<void> {
    await prisma.agentRun.create({
      data: {
        id: run.id,
        agentId: run.agentId,
        agentName: run.agentName,
        organizationId: run.context.organizationId,
        userId: run.context.userId,
        task: run.task,
        status: run.status,
        summary: run.summary ?? null,
        error: run.error ?? null,
        startedAt: run.startedAt,
        completedAt: run.completedAt ?? null,
        steps: run.steps.length > 0 ? {
          createMany: {
            data: run.steps.map((s) => ({
              id: s.id,
              toolName: s.toolName,
              status: s.status,
              input: json(s.input),
              output: json(s.output),
              durationMs: s.durationMs ?? null,
            })),
          },
        } : undefined,
      },
    })

    if (run.approvalRequest) {
      await prisma.agentApproval.create({
        data: {
          id: run.approvalRequest.id,
          runId: run.id,
          toolName: run.approvalRequest.toolName,
          status: run.approvalRequest.status,
          requestedAt: run.approvalRequest.requestedAt,
          resolvedAt: run.approvalRequest.resolvedAt ?? null,
          resolvedBy: run.approvalRequest.resolvedBy ?? null,
        },
      })
    }
  }

  async getAgentRun(runId: string): Promise<AgentRun | undefined> {
    const record = await prisma.agentRun.findUnique({
      where: { id: runId },
      include: { steps: true, approvals: true },
    })

    if (!record) return undefined

    return this.mapToAgentRun(record)
  }

  async getAgentRuns(
    agentId?: string,
    limit = 20,
  ): Promise<AgentRun[]> {
    const records = await prisma.agentRun.findMany({
      where: agentId ? { agentId } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { steps: true, approvals: true },
    })

    return records.map((r) => this.mapToAgentRun(r))
  }

  async updateAgentRun(
    runId: string,
    updates: Partial<AgentRun>,
  ): Promise<void> {
    const data: Record<string, unknown> = {}

    if (updates.status !== undefined) data.status = updates.status
    if (updates.summary !== undefined) data.summary = updates.summary
    if (updates.error !== undefined) data.error = updates.error
    if (updates.completedAt !== undefined)
      data.completedAt = updates.completedAt

    await prisma.agentRun.update({
      where: { id: runId },
      data,
    })

    if (updates.steps) {
      for (const step of updates.steps) {
        await this.saveAgentStep(runId, step)
      }
    }

    if (updates.approvalRequest) {
      await this.saveApproval(runId, updates.approvalRequest)
    }
  }

  async saveAgentStep(runId: string, step: AgentStep): Promise<void> {
    await prisma.agentStep.upsert({
      where: { id: step.id },
      create: {
        id: step.id,
        runId,
        toolName: step.toolName,
        status: step.status,
        input: json(step.input),
        output: json(step.output),
        durationMs: step.durationMs ?? null,
      },
      update: {
        status: step.status,
        output: json(step.output),
        durationMs: step.durationMs ?? null,
      },
    })
  }

  async saveApproval(
    runId: string,
    approval: ApprovalRequest,
  ): Promise<void> {
    await prisma.agentApproval.upsert({
      where: { id: approval.id },
      create: {
        id: approval.id,
        runId,
        toolName: approval.toolName,
        status: approval.status,
        requestedAt: approval.requestedAt,
        resolvedAt: approval.resolvedAt ?? null,
        resolvedBy: approval.resolvedBy ?? null,
      },
      update: {
        status: approval.status,
        resolvedAt: approval.resolvedAt ?? null,
        resolvedBy: approval.resolvedBy ?? null,
      },
    })
  }

  private mapToAgentRun(
    record: Record<string, unknown> & {
      steps: Record<string, unknown>[]
      approvals: Record<string, unknown>[]
    },
  ): AgentRun {
    const steps: AgentStep[] = record.steps.map(
      (s: Record<string, unknown>) => ({
        id: s.id as string,
        toolName: s.toolName as string,
        input: (typeof s.input === "string"
          ? JSON.parse(s.input as string)
          : s.input) as Record<string, unknown>,
        output: s.output
          ? typeof s.output === "string"
            ? JSON.parse(s.output as string)
            : s.output
          : undefined,
        status: s.status as AgentStep["status"],
        errorMessage: (s.errorMessage as string) ?? undefined,
        startedAt: (s.createdAt as Date) ?? undefined,
        completedAt: undefined,
        durationMs: (s.durationMs as number) ?? undefined,
      }),
    )

    const approval = record.approvals?.[0] as Record<string, unknown> | undefined

    return {
      id: record.id as string,
      agentId: record.agentId as string,
      agentName: record.agentName as string,
      task: record.task as string,
      context: {
        userId: record.userId as string,
        organizationId: record.organizationId as string,
        organizationSlug: "",
        userRole: "member",
        permissions: [],
      },
      steps,
      summary: (record.summary as string) ?? undefined,
      status: record.status as AgentRun["status"],
      approvalRequest: approval
        ? {
            id: approval.id as string,
            toolName: approval.toolName as string,
            input: {},
            reason: "",
            status: approval.status as ApprovalRequest["status"],
            requestedBy: "",
            requestedAt: approval.requestedAt as Date,
            resolvedAt: (approval.resolvedAt as Date) ?? undefined,
            resolvedBy: (approval.resolvedBy as string) ?? undefined,
          }
        : undefined,
      startedAt: record.startedAt as Date,
      completedAt: (record.completedAt as Date) ?? undefined,
      durationMs: record.completedAt
        ? ((record.completedAt as Date).getTime() -
            (record.startedAt as Date).getTime())
        : undefined,
      error: (record.error as string) ?? undefined,
    }
  }
}
