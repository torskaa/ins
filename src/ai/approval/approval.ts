import type { ToolDefinition } from "../tools/types"

export function checkToolRequiresApproval(tool: ToolDefinition): boolean {
  return tool.requiresApproval === true
}

export interface ApprovalDecision {
  approved: boolean
  resolvedBy: string
  resolvedAt: Date
  reason?: string
}
