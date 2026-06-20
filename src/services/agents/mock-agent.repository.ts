import type { AgentRepository } from "./agent.repository"
import type { AgentRun, AgentStep, ApprovalRequest } from "@/ai/agents/types"
import { agentRuns } from "@/ai/agents/agent-run-store"

const MAX_AGENT_RUNS = 500

export class InMemoryAgentRepository implements AgentRepository {
  async createAgentRun(run: AgentRun): Promise<void> {
    agentRuns.unshift(run)
    if (agentRuns.length > MAX_AGENT_RUNS) {
      agentRuns.pop()
    }
  }

  async getAgentRun(runId: string): Promise<AgentRun | undefined> {
    return agentRuns.find(r => r.id === runId)
  }

  async getAgentRuns(agentId?: string, limit = 20): Promise<AgentRun[]> {
    if (agentId) {
      return agentRuns.filter(r => r.agentId === agentId).slice(0, limit)
    }
    return agentRuns.slice(0, limit)
  }

  async updateAgentRun(runId: string, updates: Partial<AgentRun>): Promise<void> {
    const index = agentRuns.findIndex(r => r.id === runId)
    if (index === -1) return
    Object.assign(agentRuns[index], updates)
  }

  async saveAgentStep(runId: string, step: AgentStep): Promise<void> {
    const run = await this.getAgentRun(runId)
    if (!run) return
    const existing = run.steps.findIndex(s => s.id === step.id)
    if (existing >= 0) {
      run.steps[existing] = step
    } else {
      run.steps.push(step)
    }
  }

  async saveApproval(runId: string, approval: ApprovalRequest): Promise<void> {
    const run = await this.getAgentRun(runId)
    if (!run) return
    run.approvalRequest = approval
  }
}
