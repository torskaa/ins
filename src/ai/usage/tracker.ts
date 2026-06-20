import type { UsageEvent, UsageSummary } from "./types"

export interface UsageTracker {
  trackToolExecution(event: UsageEvent): Promise<void>
  trackAgentRun(event: UsageEvent): Promise<void>
  getUsageSummary(organizationId?: string): Promise<UsageSummary>
}
