import { apiHandler, respond, requireAuth } from "@/lib/middleware"
import { agentRepository } from "@/services/agents"
import { resolveApproval } from "@/ai/approval/resolver"

export const POST = apiHandler(async (req: Request) => {
  const session = await requireAuth()
  const body = await req.json()
  const { runId, approved, reason } = body as {
    runId: string
    approved: boolean
    reason?: string
  }

  if (!runId || typeof approved !== "boolean") {
    return Response.json(
      { success: false, error: "runId (string) and approved (boolean) are required" },
      { status: 400 },
    )
  }

  const run = await agentRepository.getAgentRun(runId)
  if (!run) {
    return Response.json({ success: false, error: "Run not found" }, { status: 404 })
  }

  if (!run.approvalRequest || run.approvalRequest.status !== "pending") {
    return Response.json(
      { success: false, error: "No pending approval request for this run" },
      { status: 400 },
    )
  }

  resolveApproval(run, {
    approved,
    resolvedBy: session.user.id,
    resolvedAt: new Date(),
    reason,
  })

  await agentRepository.updateAgentRun(runId, {
    status: run.status,
    summary: run.summary,
    completedAt: run.completedAt,
  })
  if (run.approvalRequest) {
    await agentRepository.saveApproval(runId, run.approvalRequest)
  }

  return respond(run)
})
