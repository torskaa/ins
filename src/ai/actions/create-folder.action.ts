import type { ActionDefinition } from "./types"

export const createFolderAction: ActionDefinition = {
  name: "workspace.createFolder",
  description: "Create a workspace folder to organize files",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Folder name" },
      parentId: { type: "string", description: "Parent folder ID (optional)", optional: true },
    },
    required: ["name"],
  },
  requiredPermission: "workspace:write",
  requiresApproval: false,
  async execute(input, context) {
    const { name, parentId } = input as { name: string; parentId?: string }
    if (!name || typeof name !== "string") {
      return { success: false, error: { code: "INVALID_INPUT", message: "Folder name is required" } }
    }
    return {
      success: true,
      data: {
        id: crypto.randomUUID(),
        name,
        parentId: parentId || null,
        workspaceId: context.workspaceId || context.organizationId,
        createdBy: context.userId,
        organizationId: context.organizationId,
        createdAt: new Date().toISOString(),
      },
    }
  },
}
