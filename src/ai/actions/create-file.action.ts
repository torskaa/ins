import type { ActionDefinition } from "./types"

export const createFileAction: ActionDefinition = {
  name: "workspace.createFile",
  description: "Create a file inside a workspace folder",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "File name with extension" },
      folderId: { type: "string", description: "Parent folder ID" },
      content: { type: "string", description: "File content (optional)", optional: true },
      type: { type: "string", description: "File type (text/markdown/json)", optional: true },
    },
    required: ["name", "folderId"],
  },
  requiredPermission: "workspace:write",
  requiresApproval: false,
  async execute(input, context) {
    const { name, folderId, content, type } = input as {
      name: string
      folderId: string
      content?: string
      type?: string
    }
    if (!name || !folderId) {
      return { success: false, error: { code: "INVALID_INPUT", message: "File name and folderId are required" } }
    }
    return {
      success: true,
      data: {
        id: crypto.randomUUID(),
        name,
        folderId,
        content: content || "",
        type: type || "text",
        createdBy: context.userId,
        organizationId: context.organizationId,
        createdAt: new Date().toISOString(),
      },
    }
  },
}
