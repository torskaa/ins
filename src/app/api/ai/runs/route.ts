import { apiHandler, respond } from "@/lib/middleware"
import { agentRepository } from "@/services/agents"
import { seedMockAgentRuns } from "@/ai/agents/seed-mock-runs"
import "@/ai/agents/setup"

seedMockAgentRuns()

export const GET = apiHandler(async () => {
  const runs = await agentRepository.getAgentRuns(undefined, 50)
  return respond({ runs })
})
