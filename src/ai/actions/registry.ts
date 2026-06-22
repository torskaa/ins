import type { ActionDefinition, ActionResult } from "./types"
import type { AiContext } from "@/ai/context/types"

class ActionRegistry {
  private actions = new Map<string, ActionDefinition>()

  register(action: ActionDefinition): void {
    if (this.actions.has(action.name)) {
      console.warn(`[ActionRegistry] Action "${action.name}" already registered, overwriting`)
    }
    this.actions.set(action.name, action)
  }

  get(name: string): ActionDefinition | undefined {
    return this.actions.get(name)
  }

  getAll(): ActionDefinition[] {
    return Array.from(this.actions.values())
  }

  getByPermission(permission: string): ActionDefinition[] {
    return this.getAll().filter((a) => a.requiredPermission === permission)
  }

  getRequiringApproval(): ActionDefinition[] {
    return this.getAll().filter((a) => a.requiresApproval)
  }

  async execute(
    name: string,
    input: Record<string, unknown>,
    context: AiContext,
  ): Promise<ActionResult> {
    const action = this.get(name)
    if (!action) {
      return { success: false, error: { code: "ACTION_NOT_FOUND", message: `Action "${name}" not found` } }
    }

    const hasPermission = context.permissions?.includes(action.requiredPermission) || context.permissions?.includes("admin")
    if (!hasPermission) {
      return { success: false, error: { code: "PERMISSION_DENIED", message: `Missing permission: ${action.requiredPermission}` } }
    }

    if (action.requiresApproval) {
      return {
        success: false,
        approvalRequired: true,
        approvalReason: `Action "${action.name}" requires approval before execution`,
        error: { code: "APPROVAL_REQUIRED", message: "This action requires approval" },
      }
    }

    try {
      return await action.execute(input, context)
    } catch (error) {
      return {
        success: false,
        error: {
          code: "ACTION_ERROR",
          message: error instanceof Error ? error.message : "Unknown error executing action",
        },
      }
    }
  }
}

export const actionRegistry = new ActionRegistry()
