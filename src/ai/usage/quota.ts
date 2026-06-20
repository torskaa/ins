import type { UsageQuota, UsageEvent, SaaSPlan, UsageLimit, UsageSummary } from "./types"
import { SAAS_PLANS } from "./types"
import type { UsageTracker } from "./tracker"

export class PassthroughQuota implements UsageQuota {
  private tracker: UsageTracker

  constructor(tracker: UsageTracker) {
    this.tracker = tracker
  }

  async checkLimit(
    _organizationId: string,
    _plan: SaaSPlan,
  ): Promise<{ allowed: boolean; reason?: string }> {
    return { allowed: true }
  }

  async recordUsage(
    organizationId: string,
    _plan: SaaSPlan,
    _event: UsageEvent,
  ): Promise<void> {
    this.tracker.trackToolExecution({
      ..._event,
      organizationId,
    })
  }

  async getRemaining(
    _organizationId: string,
    _plan: SaaSPlan,
  ): Promise<UsageLimit> {
    return { ...SAAS_PLANS[_plan] }
  }
}
