import { BaseAgent } from "../base-agent"
import type { AgentStep } from "../types"

export class FinanceAgent extends BaseAgent {
  id = "finance-agent"
  name = "Finance Agent"
  role = "Financial Analyst"
  goal = "Monitor financial health and outstanding payments"
  instructions =
    "Check financial summaries, outstanding amounts, and invoice statuses"
  availableTools = ["finance.getSummary", "finance.getOutstanding"]

  protected buildSummary(steps: AgentStep[], task: string): string {
    const successSteps = steps.filter(s => s.status === "success")
    const errorSteps = steps.filter(s => s.status === "error")

    if (errorSteps.length > 0) {
      return `Finance check completed with ${errorSteps.length} error(s).`
    }

    const summaries: string[] = []
    for (const step of successSteps) {
      const output = step.output as any
      if (step.toolName === "finance.getSummary" && output?.data) {
        const d = output.data
        const parts: string[] = []
        if (d.totalInvoiced != null) parts.push(`Total invoiced: $${Number(d.totalInvoiced).toLocaleString()}`)
        if (d.totalCollected != null) parts.push(`Collected: $${Number(d.totalCollected).toLocaleString()}`)
        if (d.outstanding != null) parts.push(`Outstanding: $${Number(d.outstanding).toLocaleString()}`)
        if (d.overdueCount != null) parts.push(`${d.overdueCount} overdue invoice(s)`)
        if (parts.length > 0) summaries.push(parts.join(", "))
      }
      if (step.toolName === "finance.getOutstanding" && output?.data) {
        const amt = output.data.outstanding ?? output.data
        const val = typeof amt === "number" ? amt : amt?.outstanding
        summaries.push(`Outstanding amount: $${Number(val ?? 0).toLocaleString()}`)
      }
    }

    return summaries.length > 0
      ? summaries.join(". ") + "."
      : `Finance check complete for: "${task}".`
  }
}
