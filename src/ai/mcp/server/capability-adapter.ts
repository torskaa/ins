import type { CopilotCapability } from "@/ai/copilot/capabilities"
import type { McpCapability } from "./types"

export class McpCapabilityAdapter {
  toMcpCapability(cap: CopilotCapability): McpCapability {
    return {
      name: cap.name,
      description: cap.description,
      tools: cap.tools,
      requiredPermissions: cap.requiredPermissions,
    }
  }

  toMcpCapabilities(caps: CopilotCapability[]): McpCapability[] {
    return caps.map((c) => this.toMcpCapability(c))
  }
}
