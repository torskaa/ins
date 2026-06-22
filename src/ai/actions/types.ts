import type { AiContext } from "@/ai/context/types"

export type ActionStatus = "pending" | "running" | "success" | "error" | "waiting_approval"

export interface ActionResult {
  success: boolean
  data?: unknown
  error?: { code: string; message: string }
  approvalRequired?: boolean
  approvalReason?: string
}

export interface ActionDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  requiredPermission: string
  requiresApproval: boolean
  execute(
    input: Record<string, unknown>,
    context: AiContext,
  ): Promise<ActionResult>
}

export interface ActionStep {
  id: string
  actionName: string
  label: string
  input: Record<string, unknown>
  status: ActionStatus
  result?: ActionResult
}
