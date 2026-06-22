import type { ActionDefinition } from "./types"

export const createTagAction: ActionDefinition = {
  name: "workspace.createTag",
  description: "Create a tag for categorizing entities",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Tag name" },
      color: { type: "string", description: "Tag color (hex)", optional: true },
    },
    required: ["name"],
  },
  requiredPermission: "workspace:write",
  requiresApproval: false,
  async execute(input, context) {
    const { name, color } = input as { name: string; color?: string }
    if (!name || typeof name !== "string") {
      return { success: false, error: { code: "INVALID_INPUT", message: "Tag name is required" } }
    }
    return {
      success: true,
      data: {
        id: crypto.randomUUID(),
        name,
        color: color || "#6366f1",
        organizationId: context.organizationId,
        createdAt: new Date().toISOString(),
      },
    }
  },
}
