"use client"

import { CheckCircle2, Loader2, Circle, XCircle, Brain, Cpu, Search, Database, BarChart3, FileSearch, GitBranch, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

type ActivityStatus = "pending" | "running" | "completed" | "failed"

export interface ActivityStep {
  id: string
  label: string
  status: ActivityStatus
}

interface CopilotActivityProps {
  steps: ActivityStep[]
}

const userFacingLabels: Record<string, string> = {
  "Understanding request": "Understanding your request",
  "Running getStock": "Checking inventory levels",
  "Running inventory.getStock": "Checking inventory levels",
  "Running inventory.getLowStock": "Analyzing stock risks",
  "Running orders.getActive": "Fetching active orders",
  "Running orders.getRecent": "Loading recent orders",
  "Running customers.getActive": "Looking up customer data",
  "Running finance.getSummary": "Generating financial summary",
  "Running sales.getSummary": "Compiling sales report",
  "Running reports.getDashboard": "Preparing dashboard report",
  "Running inventory.search": "Searching product catalog",
  "Running inventory.getProduct": "Retrieving product details",
  "Running orders.search": "Searching orders",
  "Running customers.search": "Finding customer records",
  "Running reports.getInventory": "Building inventory report",
  "Planning": "Planning next steps",
  "Thinking": "Analyzing your request",
  "Searching": "Searching across modules",
  "Querying": "Querying database",
  "Processing": "Processing your request",
}

function humanLabel(raw: string): string {
  return userFacingLabels[raw] || raw
}

const activityIcon = (status: ActivityStatus) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-3.5 h-3.5 text-success" />
    case "running":
      return <Loader2 className="w-3.5 h-3.5 text-info animate-spin" />
    case "failed":
      return <XCircle className="w-3.5 h-3.5 text-destructive" />
    default:
      return <Circle className="w-3.5 h-3.5 text-muted-foreground/40" />
  }
}

export function CopilotActivity({ steps }: CopilotActivityProps) {
  if (!steps || steps.length === 0) return null

  return (
    <div className="space-y-1.5">
      {steps.map((step) => (
        <div key={step.id} className="flex items-center gap-2.5">
          <span className="shrink-0">{activityIcon(step.status)}</span>
          <span
            className={cn(
              "text-xs",
              step.status === "running"
                ? "text-foreground font-medium"
                : step.status === "completed"
                  ? "text-muted-foreground"
                  : step.status === "failed"
                    ? "text-destructive"
                    : "text-muted-foreground/50",
            )}
          >
            {humanLabel(step.label)}
          </span>
        </div>
      ))}
    </div>
  )
}
