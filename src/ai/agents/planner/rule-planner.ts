import type { AiContext } from "../../context/types"
import type { PlannedStep } from "../types"
import type { Planner } from "./types"

const toolRules: Record<
  string,
  {
    keywords: string[]
    getInput?: (task: string) => Record<string, unknown>
  }
> = {
  "inventory.getLowStock": {
    keywords: ["low", "below", "minimum", "alert", "restock"],
  },
  "inventory.forecast": {
    keywords: ["forecast", "predict", "projection", "trend"],
    getInput: (task) => {
      const match = task.match(/item\s+(\S+)/i)
      return { itemId: match?.[1] }
    },
  },
  "inventory.getStock": {
    keywords: [
      "stock", "inventory", "level", "quantity",
      "all", "available", "on hand",
    ],
  },
  "finance.getOutstanding": {
    keywords: ["outstanding", "unpaid", "owed", "due", "debt", "collect"],
  },
  "finance.getSummary": {
    keywords: [
      "summary", "overview", "financial", "health",
      "status", "total", "invoiced", "collected", "all",
    ],
  },
  "orders.getActive": {
    keywords: ["order", "active", "pending", "sale", "open", "current"],
  },
  "customers.search": {
    keywords: ["search", "find", "lookup", "customer", "client", "contact", "who"],
    getInput: (task) => {
      const match = task.match(/search\s+for\s+(.+)/i)
        || task.match(/find\s+(.+?)(?:\s+please|\s+for|\s*$)/i)
      const lower = task.toLowerCase()
      return {
        query: (match?.[1] ?? lower.replace(/search|find|customer|client|contact|who|is/g, "").trim()) || "all",
      }
    },
  },
}

const defaultFallback: Record<string, () => PlannedStep[]> = {
  "inventory.getLowStock": () => [],
  "inventory.forecast": () => [],
  "inventory.getStock": () => [{
    toolName: "inventory.getStock",
    input: {},
    description: "Get current stock levels",
    reason: "Default inventory check",
    order: 0,
  }],
  "finance.getOutstanding": () => [{
    toolName: "finance.getOutstanding",
    input: {},
    description: "Check outstanding amounts",
    reason: "Default finance check",
    order: 1,
  }],
  "finance.getSummary": () => [{
    toolName: "finance.getSummary",
    input: {},
    description: "Get financial summary",
    reason: "Default finance check",
    order: 0,
  }],
  "orders.getActive": () => [{
    toolName: "orders.getActive",
    input: {},
    description: "Get active orders",
    reason: "Default sales check",
    order: 1,
  }],
  "customers.search": () => [{
    toolName: "customers.search",
    input: { query: "all" },
    description: "Search customers",
    reason: "Default customer lookup",
    order: 0,
  }],
}

export class RulePlanner implements Planner {
  async plan(
    task: string,
    _context: AiContext,
    availableTools: string[],
  ): Promise<PlannedStep[]> {
    const lower = task.toLowerCase()
    const matchedSteps: PlannedStep[] = []
    let order = 0

    const inventoryTools = ["inventory.getStock", "inventory.getLowStock", "inventory.forecast"]
    const financeTools = ["finance.getSummary", "finance.getOutstanding"]
    const salesTools = ["orders.getActive", "customers.search"]

    for (const tool of availableTools) {
      const rule = toolRules[tool]
      if (!rule) continue

      const matched = rule.keywords.some(k => lower.includes(k))
      if (!matched) continue

      matchedSteps.push({
        toolName: tool,
        input: rule.getInput ? rule.getInput(task) : {},
        description: rule.keywords[0]
          ? `Matched keyword "${rule.keywords.find(k => lower.includes(k))}"`
          : `Check ${tool}`,
        reason: `Keyword match: "${rule.keywords.find(k => lower.includes(k))}"`,
        order: order++,
      })
    }

    if (matchedSteps.length > 0) return matchedSteps

    const toolGroupMatch = (tools: string[], defaultOrder: number): PlannedStep[] => {
      const matched = tools.filter(t => availableTools.includes(t))
      if (matched.length === 0) return []

      const inventoryScope = tools[0]?.startsWith("inventory.")
      const financeScope = tools[0]?.startsWith("finance.")
      const salesScope = tools[0]?.startsWith("orders.") || tools[0]?.startsWith("customers.")

      let scope = ""
      if (inventoryScope) scope = "inventory"
      else if (financeScope) scope = "finance"
      else if (salesScope) scope = "sales"

      if (scope === "inventory") {
        if (matched.includes("inventory.getStock")) {
          return [defaultFallback["inventory.getStock"]!()[0]]
        }
      }
      if (scope === "finance") {
        return [
          defaultFallback["finance.getSummary"]!()[0],
          defaultFallback["finance.getOutstanding"]!()[0],
        ]
      }
      if (scope === "sales") {
        return [
          defaultFallback["customers.search"]!()[0],
          defaultFallback["orders.getActive"]!()[0],
        ]
      }

      return matched.map((t, i) => ({
        toolName: t,
        input: toolRules[t]?.getInput?.(task) ?? {},
        description: `Check ${t}`,
        reason: "Default fallback",
        order: defaultOrder + i,
      }))
    }

    if (availableTools.some(t => inventoryTools.includes(t))) {
      return toolGroupMatch(inventoryTools, 0)
    }
    if (availableTools.some(t => financeTools.includes(t))) {
      return toolGroupMatch(financeTools, 0)
    }
    if (availableTools.some(t => salesTools.includes(t))) {
      return toolGroupMatch(salesTools, 0)
    }

    return matchedSteps
  }
}
