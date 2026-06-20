import { BaseAgent } from "../base-agent"
import type { AgentStep } from "../types"

export class InventoryAgent extends BaseAgent {
  id = "inventory-agent"
  name = "Inventory Agent"
  role = "Inventory Manager"
  goal = "Monitor and manage inventory stock levels"
  instructions =
    "Check stock levels, identify low stock items, and forecast future stock needs"
  availableTools = [
    "inventory.getStock",
    "inventory.getLowStock",
    "inventory.forecast",
  ]

  protected buildSummary(steps: AgentStep[], task: string): string {
    const successSteps = steps.filter(s => s.status === "success")
    const errorSteps = steps.filter(s => s.status === "error")

    if (errorSteps.length > 0) {
      return `Completed inventory check with ${errorSteps.length} error(s). ${successSteps.length} tool(s) succeeded.`
    }

    const summaries: string[] = []
    for (const step of successSteps) {
      const output = step.output as any
      if (step.toolName === "inventory.getLowStock" && output?.data) {
        const items = Array.isArray(output.data) ? output.data : output.data?.items ?? []
        summaries.push(`Found ${items.length} low stock item(s)`)
      } else if (step.toolName === "inventory.forecast" && output?.data) {
        summaries.push("Stock forecast calculated")
      } else if (step.toolName === "inventory.getStock" && output?.data) {
        const items = Array.isArray(output.data) ? output.data : output.data?.stock ?? []
        summaries.push(`Checked ${items.length} stock item(s)`)
      }
    }

    return summaries.length > 0
      ? summaries.join(". ") + "."
      : `Completed inventory check for: "${task}".`
  }
}
