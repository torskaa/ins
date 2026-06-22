import type { ActionDefinition } from "./types"

export const updateRecordAction: ActionDefinition = {
  name: "erp.updateRecord",
  description: "Update an existing ERP record",
  inputSchema: {
    type: "object",
    properties: {
      entityType: { type: "string", description: "Entity type (product, order, customer, invoice)" },
      recordId: { type: "string", description: "Record ID to update" },
      data: { type: "object", description: "Fields to update" },
    },
    required: ["entityType", "recordId", "data"],
  },
  requiredPermission: "erp:write",
  requiresApproval: true,
  async execute(input, context) {
    const { entityType, recordId, data } = input as {
      entityType: string
      recordId: string
      data: Record<string, unknown>
    }
    if (!entityType || !recordId || !data) {
      return { success: false, error: { code: "INVALID_INPUT", message: "entityType, recordId, and data are required" } }
    }
    return {
      success: true,
      data: {
        id: recordId,
        entityType,
        updated: data,
        updatedBy: context.userId,
        updatedAt: new Date().toISOString(),
      },
    }
  },
}
