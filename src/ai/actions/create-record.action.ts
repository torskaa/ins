import type { ActionDefinition } from "./types"

export const createRecordAction: ActionDefinition = {
  name: "erp.createRecord",
  description: "Create a new ERP record (product, order, customer, etc.)",
  inputSchema: {
    type: "object",
    properties: {
      entityType: { type: "string", description: "Entity type (product, order, customer, invoice)" },
      data: { type: "object", description: "Record data fields" },
    },
    required: ["entityType", "data"],
  },
  requiredPermission: "erp:write",
  requiresApproval: false,
  async execute(input, context) {
    const { entityType, data } = input as { entityType: string; data: Record<string, unknown> }
    if (!entityType || !data) {
      return { success: false, error: { code: "INVALID_INPUT", message: "entityType and data are required" } }
    }
    return {
      success: true,
      data: {
        id: crypto.randomUUID(),
        entityType,
        data,
        createdBy: context.userId,
        organizationId: context.organizationId,
        createdAt: new Date().toISOString(),
      },
    }
  },
}
