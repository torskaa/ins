import { agentRepository } from "@/services/agents"
import { seedMockAgentRuns } from "@/ai/agents/seed-mock-runs"
import "@/ai/agents/setup"
import { AiRunsDetailClient } from "./ai-runs-detail-client"
import { notFound } from "next/navigation"
import type { AgentRun, AgentStep, ApprovalRequest } from "@/ai/agents/types"

seedMockAgentRuns()

function serializeRun(run: AgentRun) {
  return {
    id: run.id,
    agentId: run.agentId,
    agentName: run.agentName,
    task: run.task,
    status: run.status,
    summary: run.summary ?? null,
    error: run.error ?? null,
    startedAt: run.startedAt.toISOString(),
    completedAt: run.completedAt?.toISOString() ?? null,
    durationMs: run.durationMs ?? null,
    steps: run.steps.map((s: AgentStep) => ({
      id: s.id,
      toolName: s.toolName,
      input: s.input as Record<string, unknown>,
      output: s.output ?? null,
      status: s.status,
      errorMessage: s.errorMessage ?? null,
      startedAt: s.startedAt?.toISOString() ?? null,
      completedAt: s.completedAt?.toISOString() ?? null,
      durationMs: s.durationMs ?? null,
    })),
    approvalRequest: run.approvalRequest
      ? {
          id: run.approvalRequest.id,
          toolName: run.approvalRequest.toolName,
          input: run.approvalRequest.input as Record<string, unknown>,
          reason: run.approvalRequest.reason,
          status: run.approvalRequest.status,
          requestedBy: run.approvalRequest.requestedBy,
          requestedAt: run.approvalRequest.requestedAt.toISOString(),
          resolvedAt: run.approvalRequest.resolvedAt?.toISOString() ?? null,
          resolvedBy: run.approvalRequest.resolvedBy ?? null,
        }
      : null,
  }
}

export type SerializedRun = ReturnType<typeof serializeRun>

export default async function AiRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const run = await agentRepository.getAgentRun(id)

  if (!run) {
    notFound()
  }

  return <AiRunsDetailClient run={serializeRun(run)} />
}
