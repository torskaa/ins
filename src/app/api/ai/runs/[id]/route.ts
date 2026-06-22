import { apiHandler, respond, requireAuth } from "@/lib/middleware"
import { agentRepository } from "@/services/agents"

export const GET = apiHandler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAuth()
  const { id } = await params
  const run = await agentRepository.getAgentRun(id)
  if (!run) {
    return Response.json({ success: false, error: "Run not found" }, { status: 404 })
  }
  return respond(run)
})
