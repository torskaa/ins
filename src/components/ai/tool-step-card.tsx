"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, XCircle, Clock, ChevronDown, ChevronRight, Package, ShoppingCart, Users, BarChart3, Cpu } from "lucide-react"
import type { StepStatus } from "@/ai/agents/types"

interface ToolStepCardProps {
  toolName: string
  status: StepStatus
  input?: Record<string, unknown>
  output?: unknown
  error?: string
  durationMs?: number
}

const toolLabels: Record<string, string> = {
  "inventory.getStock": "Checking inventory stock levels",
  "inventory.getLowStock": "Checking low stock items",
  "inventory.forecast": "Running demand forecast",
  "inventory.getMovement": "Tracking inventory movements",
  "inventory.getSummary": "Generating inventory summary",
  "inventory.getWarehouses": "Looking up warehouse data",
  "orders.getActive": "Fetching active orders",
  "orders.getRecent": "Getting recent orders",
  "orders.getByStatus": "Filtering orders by status",
  "orders.getByCustomer": "Looking up customer orders",
  "orders.getSalesSummary": "Calculating sales summary",
  "orders.getRecentQuotations": "Getting recent quotations",
  "customers.search": "Searching customers",
  "customers.getTop": "Finding top customers",
  "customers.getDetails": "Loading customer details",
  "finance.getSummary": "Pulling financial summary",
  "finance.getOutstanding": "Checking outstanding amounts",
  "finance.getInvoices": "Fetching invoices",
  "finance.getOverdueInvoices": "Checking overdue invoices",
  "finance.getInvoicesByCustomer": "Looking up customer invoices",
  "finance.getPayments": "Fetching payment records",
}

const toolIcons: Record<string, React.ReactNode> = {
  inventory: <Package className="w-4 h-4" />,
  orders: <ShoppingCart className="w-4 h-4" />,
  customers: <Users className="w-4 h-4" />,
  finance: <BarChart3 className="w-4 h-4" />,
}

const statusIcon = (status: StepStatus) => {
  switch (status) {
    case "running":
      return <Loader2 className="w-4 h-4 text-info animate-spin" />
    case "success":
      return <CheckCircle2 className="w-4 h-4 text-success" />
    case "error":
      return <XCircle className="w-4 h-4 text-destructive" />
    case "waiting_approval":
      return <Clock className="w-4 h-4 text-warning" />
    case "pending":
      return <Clock className="w-4 h-4 text-muted-foreground" />
  }
}

const statusBadge = (status: StepStatus) => {
  const variants: Record<string, "success" | "destructive" | "info" | "warning"> = {
    success: "success",
    error: "destructive",
    running: "info",
    waiting_approval: "warning",
  }
  const labels: Record<string, string> = {
    success: "Done",
    error: "Failed",
    running: "Running",
    waiting_approval: "Needs Approval",
  }
  const v = variants[status]
  if (!v) return null
  return (
    <Badge variant={v} size="xs">
      {labels[status] || status}
    </Badge>
  )
}

export function ToolStepCard({
  toolName,
  status,
  input,
  output,
  error,
  durationMs,
}: ToolStepCardProps) {
  const [expanded, setExpanded] = useState(false)

  const friendlyLabel = toolLabels[toolName] || `Running ${toolName.replace(/\./g, " ")}`
  const prefix = toolName.split(".")[0]
  const icon = toolIcons[prefix] || <Cpu className="w-4 h-4" />
  const hasDetails = (input && Object.keys(input).length > 0) || output !== undefined || error

  return (
    <Card className="border-l-4 border-l-border overflow-hidden">
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => hasDetails && setExpanded(!expanded)}
          className={`flex items-center gap-2.5 w-full text-left p-3 ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
        >
          <div className="shrink-0">{statusIcon(status)}</div>
          <div className="shrink-0 text-muted-foreground">{icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{friendlyLabel}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {durationMs != null && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {durationMs >= 1000
                    ? `${(durationMs / 1000).toFixed(1)}s`
                    : `${durationMs}ms`}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {statusBadge(status)}
            {hasDetails && (
              <span className="text-muted-foreground">
                {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </span>
            )}
          </div>
        </button>

        {expanded && hasDetails && (
          <div className="px-3 pb-3 space-y-2 border-t border-border/40 pt-2.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Technical details</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Tool:</span>
              <span className="text-xs font-mono">{toolName}</span>
            </div>
            {input && Object.keys(input).length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Input</span>
                <pre className="mt-1 text-xs bg-muted rounded p-1.5 overflow-x-auto">{JSON.stringify(input, null, 2)}</pre>
              </div>
            )}
            {output !== undefined && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Output</span>
                <pre className="mt-1 text-xs bg-muted rounded p-1.5 overflow-x-auto max-h-32 overflow-y-auto">{typeof output === "string" ? output : JSON.stringify(output, null, 2)}</pre>
              </div>
            )}
            {error && (
              <div>
                <span className="text-xs font-medium text-destructive">Error</span>
                <pre className="mt-1 text-xs bg-destructive/5 text-destructive rounded p-1.5 overflow-x-auto">{error}</pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
