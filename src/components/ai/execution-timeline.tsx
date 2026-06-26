"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Loader2,
  XCircle,
  Clock,
  Bot,
  Database,
  Globe,
  FileText,
  Search,
  Code,
  ArrowRightLeft,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

type ToolStatus = "success" | "running" | "error" | "pending"

interface ToolStep {
  toolName: string
  status: ToolStatus
  input?: string
  output?: string
  duration?: string
}

interface ExecutionTimelineProps {
  steps: ToolStep[]
  className?: string
}

const toolIcons: Record<string, React.ReactNode> = {
  database: <Database className="size-4" />,
  search: <Search className="size-4" />,
  web: <Globe className="size-4" />,
  file: <FileText className="size-4" />,
  code: <Code className="size-4" />,
  transform: <ArrowRightLeft className="size-4" />,
}

function inferToolIcon(toolName: string): React.ReactNode {
  const lower = toolName.toLowerCase()
  for (const [key, icon] of Object.entries(toolIcons)) {
    if (lower.includes(key)) return icon
  }
  return <Bot className="size-4" />
}

const statusIcons: Record<ToolStatus, React.ReactNode> = {
  success: <CheckCircle2 className="size-4 text-success" />,
  running: <Loader2 className="size-4 text-info animate-spin" />,
  error: <XCircle className="size-4 text-destructive" />,
  pending: <Clock className="size-4 text-muted-foreground" />,
}

export function ExecutionTimeline({ steps, className }: ExecutionTimelineProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())

  const toggleStep = (index: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  if (!steps.length) return null

  return (
    <Card className={cn("rounded-xl bg-card/60 backdrop-blur-sm border border-border", className)}>
      <CardHeader className="px-4 py-3 border-b border-border/10">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <Clock className="size-4 text-muted-foreground" />
          Execution Timeline
          <Badge variant="outline" className="ml-auto text-xs text-muted-foreground border-border/30">
            {steps.length} step{steps.length > 1 ? "s" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-80">
          <div className="p-3 space-y-2">
            {steps.map((step, i) => {
              const isExpanded = expandedSteps.has(i)
              const isLast = i === steps.length - 1
              return (
                <div key={i} className="relative pl-8">
                  {!isLast && (
                    <div className="absolute left-[11px] top-5 bottom-0 w-px bg-border/40" />
                  )}
                  <div className="absolute left-[5px] top-1.5">{statusIcons[step.status]}</div>
                  <button
                    onClick={() => toggleStep(i)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg transition-colors border-l-2",
                      "hover:bg-surface",
                      step.status === "success" && "border-l-success",
                      step.status === "running" && "border-l-info",
                      step.status === "error" && "border-l-destructive",
                      step.status === "pending" && "border-l-muted-foreground",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0 text-muted-foreground">{inferToolIcon(step.toolName)}</span>
                        <span className="text-sm font-medium truncate">{step.toolName}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={cn(
                          "text-[10px] px-1.5 py-0",
                          step.status === "success" && "text-success border-success/20",
                          step.status === "running" && "text-info border-info/20",
                          step.status === "error" && "text-destructive border-destructive/20",
                          step.status === "pending" && "text-muted-foreground border-border/40",
                        )}>
                          {step.status}
                        </Badge>
                        {step.duration && (
                          <span className="text-xs text-muted-foreground font-mono">{step.duration}</span>
                        )}
                        {step.input || step.output ? (
                          isExpanded ? <ChevronDown className="size-3.5 text-muted-foreground" /> : <ChevronRight className="size-3.5 text-muted-foreground" />
                        ) : null}
                      </div>
                    </div>
                    {isExpanded && (step.input || step.output) && (
                      <div className="mt-3 space-y-2">
                        {step.input && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Input</p>
                            <pre className="text-xs bg-muted/20 rounded-lg px-3 py-2 overflow-x-auto font-mono">{step.input}</pre>
                          </div>
                        )}
                        {step.output && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Output</p>
                            <pre className="text-xs bg-muted/20 rounded-lg px-3 py-2 overflow-x-auto font-mono">{step.output}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
