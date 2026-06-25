"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Package, ShoppingCart, BarChart3, TrendingUp, ExternalLink, Eye, Download } from "lucide-react"

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

const moduleRoutes: Record<ResultType, string> = {
  inventory: "/inventory",
  orders: "/orders",
  finance: "/finance",
  sales: "/reports",
  general: "/dashboard",
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
  const router = useRouter()
  const config = typeConfig[type]
  const metrics = extractMetrics(type, summary)
  const lastOutput = toolCalls?.find((tc) => tc.output)?.output

  const handleExport = useCallback(() => {
    const blob = new Blob([summary], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${type}-summary.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [summary, type])

  const handleOpenModule = useCallback(() => {
    router.push(moduleRoutes[type])
  }, [router, type])

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-3.5 space-y-3">
      <div className="flex items-center gap-2.5">
        <span className="text-muted-foreground">{config.icon}</span>
        <span className="text-xs font-semibold text-foreground">{config.label}</span>
      </div>
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

        {showDetails && lastOutput && (
          <pre className="text-xs bg-muted/10 rounded-lg p-2.5 border border-border/30 overflow-x-auto max-h-40">
            {(() => {
              try { return JSON.stringify(JSON.parse(lastOutput), null, 2) }
              catch { return lastOutput }
            })()}
          </pre>
        )}

        <div className="flex items-center gap-1.5 flex-wrap">
          {lastOutput && (
            <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1 px-2.5" onClick={() => setShowDetails(!showDetails)}>
              <Eye className="size-3" />
              {showDetails ? "Hide details" : "View details"}
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1 px-2.5 text-muted-foreground" onClick={handleExport}>
            <Download className="size-3" />
            Export
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1 px-2.5 text-muted-foreground" onClick={handleOpenModule}>
            <ExternalLink className="size-3" />
            Open in module
          </Button>
        </div>
    </div>
  )
}
