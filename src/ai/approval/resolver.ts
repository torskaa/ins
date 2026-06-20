import type { ApprovalRequest, ApprovalDecision } from "../approval/approval"
import type { AgentRun } from "../agents/types"

export function resolveApproval(
  run: AgentRun,
  decision: ApprovalDecision,
): AgentRun {
  if (!run.approvalRequest) {
    throw new Error("Run has no pending approval request")
  }

  run.approvalRequest.status = decision.approved ? "approved" : "denied"
  run.approvalRequest.resolvedAt = decision.resolvedAt
  run.approvalRequest.resolvedBy = decision.resolvedBy

  if (!decision.approved) {
    run.status = "cancelled"
    run.summary = `Approval denied: "${run.approvalRequest.reason}" — ${decision.reason ?? "No reason provided"}`
    return run
  }

  return run
}
