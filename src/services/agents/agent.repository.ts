import type { AgentRun, AgentStep, ApprovalRequest } from "@/ai/agents/types"

export interface AgentRepository {
  createAgentRun(run: AgentRun): Promise<void>
  getAgentRun(runId: string): Promise<AgentRun | undefined>
  getAgentRuns(agentId?: string, limit?: number): Promise<AgentRun[]>
  updateAgentRun(runId: string, updates: Partial<AgentRun>): Promise<void>
  saveAgentStep(runId: string, step: AgentStep): Promise<void>
  saveApproval(runId: string, approval: ApprovalRequest): Promise<void>
}
