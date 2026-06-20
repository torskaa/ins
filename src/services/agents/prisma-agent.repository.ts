import type { AgentRepository } from "./agent.repository"
import type { AgentRun, AgentStep, ApprovalRequest } from "@/ai/agents/types"

export class PrismaAgentRepository implements AgentRepository {
  async createAgentRun(_run: AgentRun): Promise<void> {
    throw new Error("PrismaAgentRepository: not implemented — createAgentRun")
  }

  async getAgentRun(_runId: string): Promise<AgentRun | undefined> {
    throw new Error("PrismaAgentRepository: not implemented — getAgentRun")
  }

  async getAgentRuns(_agentId?: string, _limit?: number): Promise<AgentRun[]> {
    throw new Error("PrismaAgentRepository: not implemented — getAgentRuns")
  }

  async updateAgentRun(_runId: string, _updates: Partial<AgentRun>): Promise<void> {
    throw new Error("PrismaAgentRepository: not implemented — updateAgentRun")
  }

  async saveAgentStep(_runId: string, _step: AgentStep): Promise<void> {
    throw new Error("PrismaAgentRepository: not implemented — saveAgentStep")
  }

  async saveApproval(_runId: string, _approval: ApprovalRequest): Promise<void> {
    throw new Error("PrismaAgentRepository: not implemented — saveApproval")
  }
}
