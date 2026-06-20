import type { UsageEvent, UsageSummary } from "./types"
import type { UsageTracker } from "./tracker"

const MAX_EVENTS = 10000

export class InMemoryUsageTracker implements UsageTracker {
  private events: UsageEvent[] = []

  async trackToolExecution(event: UsageEvent): Promise<void> {
    this.events.push(event)
    if (this.events.length > MAX_EVENTS) this.events.shift()
  }

  async trackAgentRun(event: UsageEvent): Promise<void> {
    this.events.push(event)
    if (this.events.length > MAX_EVENTS) this.events.shift()
  }

  async getUsageSummary(organizationId?: string): Promise<UsageSummary> {
    const events = organizationId
      ? this.events.filter(e => e.organizationId === organizationId)
      : this.events

    const toolExecutions = events.filter(e => e.action === "tool_execution")
    const agentRuns = events.filter(e => e.action === "agent_run")

    const byOrganization: Record<string, number> = {}
    const byTool: Record<string, number> = {}

    for (const e of events) {
      byOrganization[e.organizationId] = (byOrganization[e.organizationId] ?? 0) + 1
      if (e.toolName) {
        byTool[e.toolName] = (byTool[e.toolName] ?? 0) + 1
      }
    }

    return {
      totalToolCalls: toolExecutions.length,
      totalAgentRuns: agentRuns.length,
      totalInputTokens: events.reduce((s, e) => s + (e.inputTokens ?? 0), 0),
      totalOutputTokens: events.reduce((s, e) => s + (e.outputTokens ?? 0), 0),
      byOrganization,
      byTool,
    }
  }
}
