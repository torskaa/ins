import type { AgentRun, AgentStep } from "./types"

export const agentRuns: AgentRun[] = []

const MAX_AGENT_RUNS = 500

export function recordAgentRun(run: AgentRun): void {
  agentRuns.unshift(run)
  if (agentRuns.length > MAX_AGENT_RUNS) {
    agentRuns.pop()
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Agent:${run.agentName}] ${run.status} (${run.durationMs ?? "?"}ms) — ${run.task}`,
    )
  }
}

export function getAgentRuns(agentId?: string, limit = 20): AgentRun[] {
  if (agentId) {
    return agentRuns.filter(r => r.agentId === agentId).slice(0, limit)
  }
  return agentRuns.slice(0, limit)
}

export function getAgentRun(runId: string): AgentRun | undefined {
  return agentRuns.find(r => r.id === runId)
}
