export interface CostResult {
  currency: "USD"
  amount: number
  estimated: boolean
  breakdown: {
    inputTokens: number
    outputTokens: number
    inputCost: number
    outputCost: number
  }
}

export interface ModelPricing {
  inputPricePer1k: number
  outputPricePer1k: number
}

export type PricingTable = Record<string, ModelPricing>
