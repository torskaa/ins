import type { UsageTracker } from "./tracker"
import { InMemoryUsageTracker } from "./memory-tracker"
import { PrismaUsageTracker } from "./prisma-tracker"
import { PassthroughQuota } from "./quota"
import type { UsageQuota } from "./types"

export type { UsageEvent, UsageSummary, UsageQuota, UsageLimit, SaaSPlan } from "./types"
export { SAAS_PLANS } from "./types"
export type { UsageTracker } from "./tracker"
export { InMemoryUsageTracker } from "./memory-tracker"
export { PrismaUsageTracker } from "./prisma-tracker"
export { PassthroughQuota } from "./quota"
export type { CostCalculator, CostResult, ModelPricing, PricingTable } from "./cost"
export { DefaultCostCalculator, DEFAULT_PRICING } from "./cost"

const isProd = process.env.NODE_ENV === "production"
let tracker: UsageTracker = isProd ? new PrismaUsageTracker() : new InMemoryUsageTracker()

let quota: UsageQuota = new PassthroughQuota(tracker)

export function setUsageTracker(t: UsageTracker) {
  tracker = t
  quota = new PassthroughQuota(tracker)
}

export function getUsageTracker(): UsageTracker {
  return tracker
}

export function setUsageQuota(q: UsageQuota) {
  quota = q
}

export function getUsageQuota(): UsageQuota {
  return quota
}
