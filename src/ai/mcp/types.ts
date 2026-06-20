export interface McpTool {
  name: string
  description?: string
  inputSchema: Record<string, unknown>
}

export interface McpTextContent {
  type: "text"
  text: string
}

export type McpContent = McpTextContent

export interface McpCallToolResult {
  content: McpContent[]
  isError: boolean
  meta?: {
    cost?: {
      amount: number
      currency: string
      estimated: boolean
    }
  }
}

export interface JsonRpcRequest {
  jsonrpc: "2.0"
  id: string | number
  method: string
  params?: unknown
}

export interface JsonRpcError {
  code: number
  message: string
  data?: unknown
}

export interface JsonRpcResponse {
  jsonrpc: "2.0"
  id: string | number
  result?: unknown
  error?: JsonRpcError
}

export const MCP_ERROR_CODES = {
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  PERMISSION_DENIED: -32001,
  TOOL_NOT_FOUND: -32002,
} as const
