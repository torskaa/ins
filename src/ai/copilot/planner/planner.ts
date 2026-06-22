import type { Intent } from "../intent/types"
import type { CopilotPlan, PlanStep } from "./types"
import { actionRegistry } from "@/ai/actions/registry"

function buildStepsFromIntent(intent: Intent): PlanStep[] {
  const steps: PlanStep[] = []

  if (intent.type === "creation" && intent.entities.length > 0) {
    for (const entity of intent.entities) {
      let actionName: string | undefined
      let label: string
      let description: string

      switch (entity) {
        case "folder":
          actionName = "workspace.createFolder"
          label = `Create folder`
          description = `Create a new workspace folder`
          break
        case "file":
          actionName = "workspace.createFile"
          label = `Create file`
          description = `Create a new file in workspace`
          break
        case "tag":
          actionName = "workspace.createTag"
          label = `Create tag`
          description = `Create a new tag`
          break
        case "workflow":
          actionName = "workflow.create"
          label = `Create workflow`
          description = `Create an automated workflow`
          break
        case "view":
          actionName = "workspace.createView"
          label = `Create view`
          description = `Create a saved view`
          break
        default:
          actionName = "erp.createRecord"
          label = `Create ${entity}`
          description = `Create a new ${entity} record`
      }

      steps.push({
        id: crypto.randomUUID(),
        type: "action",
        label,
        description,
        actionName,
        actionInput: { entityType: entity },
        status: "pending",
      })
    }
  }

  if (intent.type === "query") {
    steps.push({
      id: crypto.randomUUID(),
      type: "query",
      label: `Search ${intent.primaryEntity || "data"}`,
      description: `Query ${intent.primaryEntity || "data"} based on your request`,
      status: "pending",
    })
  }

  if (intent.type === "analysis") {
    steps.push({
      id: crypto.randomUUID(),
      type: "analysis",
      label: "Analyze data",
      description: `Perform analysis on ${intent.primaryEntity || "available data"}`,
      status: "pending",
    })
  }

  if (intent.type === "workflow") {
    steps.push({
      id: crypto.randomUUID(),
      type: "action",
      label: "Design workflow",
      description: "Create workflow with triggers and steps",
      actionName: "workflow.create",
      status: "pending",
    })
  }

  if (steps.length === 0) {
    steps.push({
      id: crypto.randomUUID(),
      type: "query",
      label: "Process request",
      description: "Process your request",
      status: "pending",
    })
  }

  return steps
}

export function createPlan(intent: Intent): CopilotPlan {
  const steps = buildStepsFromIntent(intent)

  const summary = intent.type === "creation"
    ? `Create ${intent.entities.join(", ")}`
    : intent.type === "query"
      ? `Query ${intent.primaryEntity || "data"}`
      : intent.type === "analysis"
        ? `Analyze ${intent.primaryEntity || "data"}`
        : intent.type === "workflow"
          ? "Set up automation"
          : intent.type === "manage"
            ? "Manage workspace"
            : "Process request"

  return {
    id: crypto.randomUUID(),
    summary,
    steps,
    status: "draft",
    createdAt: new Date().toISOString(),
  }
}

export async function executePlanStep(
  step: PlanStep,
  context: import("@/ai/context/types").AiContext,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  if (step.type !== "action" || !step.actionName) {
    return { success: true, data: null }
  }

  const action = actionRegistry.get(step.actionName)
  if (!action) {
    return { success: false, error: `Action "${step.actionName}" not found` }
  }

  const result = await actionRegistry.execute(
    step.actionName,
    step.actionInput || {},
    context,
  )

  return {
    success: result.success,
    data: result.data,
    error: result.error?.message,
  }
}
