import type { McpCallToolResult, McpTool } from "../types"

export interface McpCapability {
  name: string
  description: string
  tools: string[]
  requiredPermissions: string[]
}

export interface ListToolsResult {
  tools: McpTool[]
}

export interface ListCapabilitiesResult {
  capabilities: McpCapability[]
}

export interface CallToolInput {
  name: string
  arguments?: Record<string, unknown>
}

export { McpTool }
export type { McpCallToolResult }
