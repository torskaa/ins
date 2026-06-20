import type { UsageEvent } from "../types"
import type { CostResult } from "./types"

export interface CostCalculator {
  calculateCost(event: UsageEvent): Promise<CostResult>
}
