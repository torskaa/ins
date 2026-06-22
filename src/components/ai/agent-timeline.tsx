"use client"

import { CheckCircle2, XCircle, Loader2, Brain, ListChecks, Cpu, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TimelineStep {
  id: string
  type: "thinking" | "planning" | "tool_start" | "tool_result" | "failed"
  label: string
  status: "running" | "success" | "error" | "pending"
  message?: string
}

interface AgentTimelineProps {
  steps: TimelineStep[]
}

const stepIcon = (type: TimelineStep["type"], status: TimelineStep["status"]) => {
  if (status === "running" && type === "thinking") return <Brain className="w-3.5 h-3.5" />
  if (status === "running" && type === "planning") return <ListChecks className="w-3.5 h-3.5" />
  if (status === "running") return <Loader2 className="w-3.5 h-3.5 animate-spin" />
  if (status === "success") return <CheckCircle2 className="w-3.5 h-3.5 text-success" />
  if (status === "error") return <XCircle className="w-3.5 h-3.5 text-destructive" />
  if (type === "tool_start") return <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
  return <Clock className="w-3.5 h-3.5 text-muted-foreground" />
}

export function AgentTimeline({ steps }: AgentTimelineProps) {
  if (!steps || steps.length === 0) return null

  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center border",
                step.status === "running"
                  ? "border-primary/30 bg-primary/5"
                  : step.status === "success"
                    ? "border-success/30 bg-success/5"
                    : step.status === "error"
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-border/50 bg-muted/30",
              )}
            >
              {stepIcon(step.type, step.status)}
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "w-px h-4",
                  step.status === "success" ? "bg-success/30" : "bg-border/40",
                )}
              />
            )}
          </div>
          <div className="pb-3 min-w-0">
            <p
              className={cn(
                "text-xs font-medium leading-6",
                step.status === "running"
                  ? "text-foreground"
                  : step.status === "error"
                    ? "text-destructive"
                    : "text-muted-foreground",
              )}
            >
              {step.label}
            </p>
            {step.message && (
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">{step.message}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
