import type { ActionStep } from "@/ai/actions/types"

export interface PlanStep {
  id: string
  type: "action" | "query" | "analysis" | "approval"
  label: string
  description: string
  actionName?: string
  actionInput?: Record<string, unknown>
  status: "pending" | "running" | "completed" | "failed" | "skipped"
}

export interface CopilotPlan {
  id: string
  summary: string
  steps: PlanStep[]
  status: "draft" | "executing" | "completed" | "failed"
  createdAt: string
}

export interface PlanResult {
  plan: CopilotPlan
  results: ActionStep[]
}
