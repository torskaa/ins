import type { PricingTable } from "./types"

export const DEFAULT_PRICING: PricingTable = {
  // OpenAI
  "gpt-4o": { inputPricePer1k: 0.0025, outputPricePer1k: 0.01 },
  "gpt-4o-mini": { inputPricePer1k: 0.00015, outputPricePer1k: 0.0006 },
  "gpt-4-turbo": { inputPricePer1k: 0.01, outputPricePer1k: 0.03 },
  "gpt-4": { inputPricePer1k: 0.03, outputPricePer1k: 0.06 },
  "gpt-3.5-turbo": { inputPricePer1k: 0.0005, outputPricePer1k: 0.0015 },

  // Anthropic
  "claude-3-5-sonnet-20241022": { inputPricePer1k: 0.003, outputPricePer1k: 0.015 },
  "claude-3-5-haiku-20241022": { inputPricePer1k: 0.0008, outputPricePer1k: 0.004 },
  "claude-3-opus-20240229": { inputPricePer1k: 0.015, outputPricePer1k: 0.075 },
  "claude-3-sonnet-20240229": { inputPricePer1k: 0.003, outputPricePer1k: 0.015 },
  "claude-3-haiku-20240307": { inputPricePer1k: 0.00025, outputPricePer1k: 0.00125 },

  // Local / free
  "local": { inputPricePer1k: 0, outputPricePer1k: 0 },
}
