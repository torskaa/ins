import type { ToolDefinition } from "@/ai/tools/types"
import { McpToolAdapter as BaseToolAdapter } from "../mcp-tool-adapter"
import type { McpTool } from "../types"

export class McpServerToolAdapter {
  private adapter: BaseToolAdapter

  constructor(adapter?: BaseToolAdapter) {
    this.adapter = adapter ?? new BaseToolAdapter()
  }

  toMcpTool(tool: ToolDefinition): McpTool {
    return this.adapter.toMcpTool(tool)
  }

  toMcpTools(tools: ToolDefinition[]): McpTool[] {
    return this.adapter.toMcpTools(tools)
  }
}
