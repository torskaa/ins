"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, ShoppingCart, BarChart3, TrendingUp, ChevronDown, ChevronRight, ArrowRight, ExternalLink, Eye, Download } from "lucide-react"

type ResultType = "inventory" | "orders" | "finance" | "sales" | "general"

interface ToolCallInfo {
  toolName: string
  output?: string
}

interface CopilotResultCardProps {
  type: ResultType
  summary: string
  toolCalls?: ToolCallInfo[]
}

interface Metric {
  label: string
  value: string
  trend?: "up" | "down" | "neutral"
}

const typeConfig: Record<ResultType, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  inventory: { icon: <Package className="w-4 h-4" />, label: "Inventory Review", color: "text-blue-500", bg: "bg-blue-500/10" },
  orders: { icon: <ShoppingCart className="w-4 h-4" />, label: "Order Summary", color: "text-violet-500", bg: "bg-violet-500/10" },
  finance: { icon: <BarChart3 className="w-4 h-4" />, label: "Financial Overview", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  sales: { icon: <TrendingUp className="w-4 h-4" />, label: "Sales Report", color: "text-rose-500", bg: "bg-rose-500/10" },
  general: { icon: <BarChart3 className="w-4 h-4" />, label: "Response", color: "text-muted-foreground", bg: "bg-card/50" },
}

function extractMetrics(type: ResultType, summary: string): Metric[] {
  const metrics: Metric[] = []

  if (type === "inventory") {
    const stockMatch = summary.match(/(\d+)\s*(items?|products?|units?)/i)
    if (stockMatch) metrics.push({ label: "Items", value: stockMatch[1] })
    const lowStockMatch = summary.match(/(\d+)\s*(low stock|below|critical|attention)/i)
    if (lowStockMatch) metrics.push({ label: "Needs attention", value: lowStockMatch[1], trend: "down" })
  }

  if (type === "orders") {
    const orderMatch = summary.match(/(\d+)\s*orders?/i)
    if (orderMatch) metrics.push({ label: "Orders", value: orderMatch[1] })
    const totalMatch = summary.match(/total[:\s]+\$?([0-9,]+(\.[0-9]+)?)/i)
    if (totalMatch) metrics.push({ label: "Total", value: `$${totalMatch[1]}` })
  }

  if (type === "finance") {
    const revenueMatch = summary.match(/revenue[:\s]+\$?([0-9,]+(\.[0-9]+)?)/i)
    if (revenueMatch) metrics.push({ label: "Revenue", value: `$${revenueMatch[1]}`, trend: "up" })
    const expenseMatch = summary.match(/expenses?[:\s]+\$?([0-9,]+(\.[0-9]+)?)/i)
    if (expenseMatch) metrics.push({ label: "Expenses", value: `$${expenseMatch[1]}`, trend: "down" })
  }

  return metrics
}

export function CopilotResultCard({ type, summary, toolCalls }: CopilotResultCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const config = typeConfig[type]
  const metrics = extractMetrics(type, summary)
  const lastOutput = toolCalls?.find((tc) => tc.output)?.output

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm">
      <div className={`px-3.5 py-2 flex items-center gap-2.5 ${config.bg} border-b border-border/20`}>
        <span className={config.color}>{config.icon}</span>
        <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
      </div>

      <CardContent className="p-3.5 space-y-3">
        <p className="text-sm leading-relaxed text-foreground">{summary}</p>

        {metrics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {metrics.map((m) => (
              <div key={m.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/10 border border-border/30">
                <span className="text-[10px] text-muted-foreground">{m.label}</span>
                <span className="text-xs font-semibold">{m.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 flex-wrap">
          <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1 px-2.5">
            <Eye className="size-3" />
            View details
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1 px-2.5 text-muted-foreground">
            <Download className="size-3" />
            Export
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1 px-2.5 text-muted-foreground">
            <ExternalLink className="size-3" />
            Open in module
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
