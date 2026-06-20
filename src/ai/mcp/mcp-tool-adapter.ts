import type { ToolDefinition } from "../tools/types"
import type { McpTool } from "./types"
import { ToolSchemaMapper } from "./tool-schema-mapper"

export class McpToolAdapter {
  private schemaMapper: ToolSchemaMapper

  constructor(schemaMapper?: ToolSchemaMapper) {
    this.schemaMapper = schemaMapper ?? new ToolSchemaMapper()
  }

  toMcpTool(tool: ToolDefinition): McpTool {
    return {
      name: tool.name,
      description: tool.description,
      inputSchema: this.schemaMapper.toJsonSchema(tool.inputSchema),
    }
  }

  toMcpTools(tools: ToolDefinition[]): McpTool[] {
    return tools.map(t => this.toMcpTool(t))
  }
}
