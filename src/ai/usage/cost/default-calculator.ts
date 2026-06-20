import type { UsageEvent } from "../types"
import type { CostCalculator } from "./calculator"
import type { CostResult, PricingTable } from "./types"
import { DEFAULT_PRICING } from "./pricing"

export class DefaultCostCalculator implements CostCalculator {
  private pricing: PricingTable
  private fallbackPricePer1k: number

  constructor(pricing?: PricingTable, fallbackPricePer1k = 0.001) {
    this.pricing = pricing ?? DEFAULT_PRICING
    this.fallbackPricePer1k = fallbackPricePer1k
  }

  async calculateCost(event: UsageEvent): Promise<CostResult> {
    const model = event.model ?? "unknown"
    const provider = event.provider ?? ""
    const modelKey = this.resolveModelKey(provider, model)
    const pricing = this.pricing[modelKey]

    const inputPricePer1k = pricing?.inputPricePer1k ?? this.fallbackPricePer1k
    const outputPricePer1k = pricing?.outputPricePer1k ?? this.fallbackPricePer1k

    const inputTokens = event.inputTokens ?? 0
    const outputTokens = event.outputTokens ?? 0

    const inputCost = (inputTokens / 1000) * inputPricePer1k
    const outputCost = (outputTokens / 1000) * outputPricePer1k
    const amount = Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000

    return {
      currency: "USD",
      amount,
      estimated: !pricing,
      breakdown: {
        inputTokens,
        outputTokens,
        inputCost: Math.round(inputCost * 1_000_000) / 1_000_000,
        outputCost: Math.round(outputCost * 1_000_000) / 1_000_000,
      },
    }
  }

  private resolveModelKey(provider: string, model: string): string {
    const key = `${provider}:${model}`
    if (this.pricing[key]) return key
    if (this.pricing[model]) return model
    return model
  }
}
