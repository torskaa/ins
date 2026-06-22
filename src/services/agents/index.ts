import type { AgentRepository } from "./agent.repository"
import { InMemoryAgentRepository } from "./mock-agent.repository"
import { PrismaAgentRepository } from "./prisma-agent.repository"

export type { AgentRepository } from "./agent.repository"
export { InMemoryAgentRepository } from "./mock-agent.repository"
export { PrismaAgentRepository } from "./prisma-agent.repository"

let repository: AgentRepository | null = null

function getRepo(): AgentRepository {
  if (!repository) {
    repository = process.env.NODE_ENV === "production"
      ? new PrismaAgentRepository()
      : new InMemoryAgentRepository()
  }
  return repository
}

export function setAgentRepository(repo: AgentRepository) {
  repository = repo
}

export const agentRepository: AgentRepository = {
  createAgentRun(run) {
    return getRepo().createAgentRun(run)
  },
  getAgentRun(runId) {
    return getRepo().getAgentRun(runId)
  },
  getAgentRuns(agentId, limit) {
    return getRepo().getAgentRuns(agentId, limit)
  },
  updateAgentRun(runId, updates) {
    return getRepo().updateAgentRun(runId, updates)
  },
  saveAgentStep(runId, step) {
    return getRepo().saveAgentStep(runId, step)
  },
  saveApproval(runId, approval) {
    return getRepo().saveApproval(runId, approval)
  },
}
