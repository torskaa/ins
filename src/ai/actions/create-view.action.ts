import type { ActionDefinition } from "./types"

export const createViewAction: ActionDefinition = {
  name: "workspace.createView",
  description: "Create a saved view or filter configuration",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "View name" },
      entityType: { type: "string", description: "Entity type this view applies to" },
      config: { type: "object", description: "View configuration (filters, columns, sort)", optional: true },
    },
    required: ["name", "entityType"],
  },
  requiredPermission: "workspace:write",
  requiresApproval: false,
  async execute(input, context) {
    const { name, entityType, config } = input as {
      name: string
      entityType: string
      config?: Record<string, unknown>
    }
    if (!name || !entityType) {
      return { success: false, error: { code: "INVALID_INPUT", message: "name and entityType are required" } }
    }
    return {
      success: true,
      data: {
        id: crypto.randomUUID(),
        name,
        entityType,
        config: config || {},
        createdBy: context.userId,
        organizationId: context.organizationId,
        createdAt: new Date().toISOString(),
      },
    }
  },
}
