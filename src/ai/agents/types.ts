import type { AiContext } from "../context/types"

export interface AgentDefinition {
  id: string
  name: string
  role: string
  goal: string
  instructions: string
  availableTools: string[]
}

export type StepStatus = "pending" | "running" | "waiting_approval" | "success" | "error"

export interface AgentStep {
  id: string
  toolName: string
  input: Record<string, unknown>
  output?: unknown
  status: StepStatus
  errorMessage?: string
  startedAt?: Date
  completedAt?: Date
  durationMs?: number
}

export type AgentRunStatus =
  | "idle"
  | "planning"
  | "executing"
  | "waiting_approval"
  | "summarizing"
  | "completed"
  | "failed"
  | "cancelled"

export type ApprovalStatus = "pending" | "approved" | "denied"

export interface ApprovalRequest {
  id: string
  toolName: string
  input: Record<string, unknown>
  reason: string
  status: ApprovalStatus
  requestedBy: string
  requestedAt: Date
  resolvedAt?: Date
  resolvedBy?: string
}

export interface AgentRun {
  id: string
  agentId: string
  agentName: string
  task: string
  context: AiContext
  steps: AgentStep[]
  summary?: string
  status: AgentRunStatus
  approvalRequest?: ApprovalRequest
  startedAt: Date
  completedAt?: Date
  durationMs?: number
  error?: string
}

export interface PlannedStep {
  toolName: string
  input: Record<string, unknown>
  description: string
  reason?: string
  order?: number
}
