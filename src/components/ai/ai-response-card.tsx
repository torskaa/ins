"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  BotMessageSquare,
  Package,
  ShoppingCart,
  BarChart3,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Loader2,
  XCircle,
  Clock,
  Copy,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

type AiResponseStatus = "completed" | "running" | "failed" | "pending"

interface Metric {
  label: string
  value: string
  trend?: "up" | "down" | "neutral"
}

interface AiResponseCardProps {
  agentName?: string
  status?: AiResponseStatus
  summary: string
  metrics?: Metric[]
  toolCalls?: Array<{ toolName: string; output?: string }>
  tag?: string | null
  timestamp?: Date
}

const statusConfig: Record<AiResponseStatus, { label: string; icon: React.ReactNode; className: string }> = {
  completed: { label: "Completed", icon: <CheckCircle2 className="size-3" />, className: "text-success bg-success/10 border-success/20" },
  running: { label: "Running", icon: <Loader2 className="size-3 animate-spin" />, className: "text-info bg-info/10 border-info/20" },
  failed: { label: "Failed", icon: <XCircle className="size-3" />, className: "text-destructive bg-destructive/10 border-destructive/20" },
  pending: { label: "Pending", icon: <Clock className="size-3" />, className: "text-muted-foreground bg-muted/10 border-muted/20" },
}

const agentIcons: Record<string, React.ReactNode> = {
  inventory: <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=Inventory" />,
  orders: <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=Orders" />,
  finance: <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=Finance" />,
  sales: <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=Sales" />,
}

const businessSummaries: Record<string, string[]> = {
  inventory: [
    "Inventory analysis completed. Found items requiring attention.",
    "Stock levels reviewed. Low stock items identified.",
    "Inventory report generated. Summary available below.",
  ],
  orders: [
    "Order analysis completed. Recent orders summarized.",
    "Customer orders reviewed. Key metrics available.",
  ],
  finance: [
    "Financial analysis completed. Revenue and expense summary available.",
    "Financial overview generated. Key metrics highlighted.",
  ],
  sales: [
    "Sales analysis completed. Performance summary available.",
    "Sales report generated. Trends identified.",
  ],
}

function detectAgentType(toolCalls?: Array<{ toolName: string }>): string {
  if (!toolCalls?.length) return "general"
  const name = toolCalls[0].toolName
  if (name.startsWith("inventory")) return "inventory"
  if (name.startsWith("orders") || name.startsWith("customers")) return "orders"
  if (name.startsWith("sales")) return "sales"
  if (name.startsWith("finance")) return "finance"
  return "general"
}

const agentNames: Record<string, string> = {
  inventory: "Inventory Agent",
  orders: "Orders Agent",
  finance: "Finance Agent",
  sales: "Sales Agent",
  general: "AI Assistant",
}

export function AiResponseCard({
  agentName,
  status = "completed",
  summary,
  metrics,
  toolCalls,
  tag,
  timestamp,
}: AiResponseCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [copied, setCopied] = useState(false)
  const type = detectAgentType(toolCalls)
  const name = agentName || agentNames[type] || agentNames.general
  const st = statusConfig[status]
  const defaultSummary = businessSummaries[type]?.[0] || summary

  async function handleCopy() {
    await navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-card/60 backdrop-blur-sm rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2.5">
        <Avatar className="size-6">
          {agentIcons[type] || <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=AI" />}
          <AvatarFallback className="text-[10px]">{name[0]}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-foreground">{name}</span>
        {tag && (
          <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 text-muted-foreground/50 border-border/40">
            {tag}
          </Badge>
        )}
        <span className={cn("inline-flex items-center gap-1 ml-auto text-xs font-medium", st.className)}>
          {st.icon}
          {st.label}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-foreground">{defaultSummary}</p>

        {metrics && metrics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {metrics.map((m) => (
              <div key={m.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/20 border border-border/40">
                <span className="text-xs text-muted-foreground">{m.label}</span>
                <span className="text-sm font-semibold">{m.value}</span>
                {m.trend === "up" && <TrendingUp className="size-3.5 text-success" />}
                {m.trend === "down" && <TrendingUp className="size-3.5 text-destructive rotate-180" />}
              </div>
            ))}
          </div>
        )}

        {toolCalls && toolCalls.length > 0 && (
          <>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showDetails ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              {showDetails ? "Hide technical details" : `View ${toolCalls.length} step${toolCalls.length > 1 ? "s" : ""}`}
            </button>
            {showDetails && (
              <div className="space-y-2 border border-border/30 rounded-lg p-3 bg-muted/10">
                {toolCalls.map((tc, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">{tc.toolName}</span>
                      {tc.output && <Badge variant="outline" className="text-[10px] px-1.5 py-0">complete</Badge>}
                    </div>
                    {tc.output && (
                      <pre className="text-[11px] text-muted-foreground bg-muted/20 rounded px-2 py-1.5 overflow-x-auto font-mono">
                        {tc.output.length > 200 ? tc.output.slice(0, 200) + "..." : tc.output}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 rounded-lg text-xs gap-1.5 text-muted-foreground">
              <TrendingUp className="size-3.5" />
              Apply
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-lg text-xs gap-1.5 text-muted-foreground"
              onClick={handleCopy}
            >
              {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 rounded-lg text-xs gap-1.5 text-muted-foreground">
              Dismiss
            </Button>
          </div>
        </div>

        {timestamp && (
          <p className="text-xs text-muted-foreground/50">
            {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
    </div>
  )
}
