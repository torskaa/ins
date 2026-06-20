import type { ToolPermission } from "../permissions/types"

export type JsonSchema = {
  type: "object"
  properties: Record<string, { type: string; description?: string; enum?: string[] }>
  required?: string[]
}

export interface ToolResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: JsonSchema
  outputSchema?: JsonSchema
  requiredPermissions: ToolPermission[]
  requiresApproval?: boolean
  execute: (args: Record<string, any>) => Promise<ToolResponse>
}
