import type { ActionDefinition } from "./types"

export const createWorkflowAction: ActionDefinition = {
  name: "workflow.create",
  description: "Create an automated workflow with triggers and actions",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Workflow name" },
      trigger: { type: "string", description: "Trigger event or schedule" },
      steps: { type: "array", description: "List of workflow action steps", items: { type: "object" } },
      description: { type: "string", description: "Workflow description", optional: true },
    },
    required: ["name", "trigger", "steps"],
  },
  requiredPermission: "workflow:write",
  requiresApproval: true,
  async execute(input, context) {
    const { name, trigger, steps, description } = input as {
      name: string
      trigger: string
      steps: unknown[]
      description?: string
    }
    if (!name || !trigger || !steps) {
      return { success: false, error: { code: "INVALID_INPUT", message: "name, trigger, and steps are required" } }
    }
    return {
      success: true,
      data: {
        id: crypto.randomUUID(),
        name,
        trigger,
        steps,
        description: description || "",
        createdBy: context.userId,
        organizationId: context.organizationId,
        createdAt: new Date().toISOString(),
      },
    }
  },
}
