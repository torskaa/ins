import { BaseAgent } from "../base-agent"
import type { AgentStep } from "../types"

export class SalesAgent extends BaseAgent {
  id = "sales-agent"
  name = "Sales Agent"
  role = "Sales Representative"
  goal = "Track sales orders and find customer information"
  instructions =
    "Look up active orders and search for customer details"
  availableTools = ["orders.getActive", "customers.search"]

  protected buildSummary(steps: AgentStep[], task: string): string {
    const successSteps = steps.filter(s => s.status === "success")
    const errorSteps = steps.filter(s => s.status === "error")

    if (errorSteps.length > 0) {
      return `Sales check completed with ${errorSteps.length} error(s).`
    }

    const summaries: string[] = []
    for (const step of successSteps) {
      const output = step.output as any
      if (step.toolName === "orders.getActive" && output?.data) {
        const orders = Array.isArray(output.data) ? output.data : output.data?.orders ?? []
        summaries.push(`${orders.length} active order(s)`)
      }
      if (step.toolName === "customers.search" && output?.data) {
        const customers = Array.isArray(output.data) ? output.data : output.data?.customers ?? output.data?.results ?? []
        summaries.push(`Found ${customers.length} customer(s)`)
      }
    }

    return summaries.length > 0
      ? summaries.join(". ") + "."
      : `Sales check complete for: "${task}".`
  }
}
