import { agentRepository } from "@/services/agents"
import { seedMockAgentRuns } from "@/ai/agents/seed-mock-runs"
import "@/ai/agents/setup"
import { AiRunsClient } from "./ai-runs-client"
import type { AgentRun } from "@/ai/agents/types"

seedMockAgentRuns()

export default async function AiRunsPage() {
  const runs: AgentRun[] = await agentRepository.getAgentRuns(undefined, 50)

  const serialized = runs.map((r) => ({
    id: r.id,
    agentId: r.agentId,
    agentName: r.agentName,
    task: r.task,
    status: r.status,
    summary: r.summary,
    error: r.error,
    startedAt: r.startedAt.toISOString(),
    completedAt: r.completedAt?.toISOString(),
    durationMs: r.durationMs,
    steps: r.steps.map((s) => ({
      id: s.id,
      toolName: s.toolName,
      status: s.status,
      durationMs: s.durationMs,
    })),
  }))

  return <AiRunsClient initialRuns={serialized} />
}
