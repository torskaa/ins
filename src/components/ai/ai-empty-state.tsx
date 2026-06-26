"use client"

import { Sparkles, Package, ShoppingCart, Users, BarChart3, TrendingUp } from "lucide-react"
import type { CopilotCapability } from "@/ai/copilot/capabilities"
import { getCapabilities } from "@/ai/copilot/capabilities"

const capabilityIcons: Record<string, React.ReactNode> = {
  inventory_analysis: <Package className="w-4 h-4" />,
  inventory_tracking: <Package className="w-4 h-4" />,
  order_management: <ShoppingCart className="w-4 h-4" />,
  customer_insights: <Users className="w-4 h-4" />,
  sales_performance: <TrendingUp className="w-4 h-4" />,
  financial_analysis: <BarChart3 className="w-4 h-4" />,
}

interface AiEmptyStateProps {
  onSuggestionClick: (text: string) => void
}

export function AiEmptyState({ onSuggestionClick }: AiEmptyStateProps) {
  const capabilities: CopilotCapability[] = getCapabilities()

  const quickActions = [
    "Show low stock items",
    "What's my revenue?",
    "Recent orders",
    "Top customers",
  ]

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center px-4">
      <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center mb-4">
        <Sparkles className="w-6 h-6 text-success" />
      </div>
      <h3 className="text-sm font-semibold mb-1">AI Business Assistant</h3>
      <p className="text-xs text-muted-foreground max-w-[260px] mb-5">
        Ask me about your inventory, orders, customers, or finances
      </p>

      <div className="grid grid-cols-2 gap-2 w-full max-w-[320px] mb-5">
        {capabilities.slice(0, 4).map((cap) => (
          <button
            key={cap.name}
            onClick={() => onSuggestionClick(cap.description.split(",")[0])}
            className="flex items-start gap-2 p-2.5 rounded-lg border border-border/50 text-left hover:bg-surface hover:border-border transition-colors group"
          >
            <span className="shrink-0 mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors">
              {capabilityIcons[cap.name] || <Sparkles className="w-4 h-4" />}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">
                {cap.name
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5 line-clamp-2">
                {cap.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {quickActions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            className="px-2.5 py-1 rounded-lg border border-border/60 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}
