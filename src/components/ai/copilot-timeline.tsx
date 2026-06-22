"use client"

import { CheckCircle2, Loader2, XCircle, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimelineStep {
  id: string
  label: string
  status: "pending" | "running" | "completed" | "failed"
}

interface CopilotTimelineProps {
  steps: TimelineStep[]
}

const icon = (status: TimelineStep["status"]) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-3.5 h-3.5 text-success" />
    case "running":
      return <Loader2 className="w-3.5 h-3.5 text-info animate-spin" />
    case "failed":
      return <XCircle className="w-3.5 h-3.5 text-destructive" />
    default:
      return <Circle className="w-3 h-3 text-muted-foreground/30" />
  }
}

export function CopilotTimeline({ steps }: CopilotTimelineProps) {
  if (!steps || steps.length === 0) return null

  return (
    <div className="space-y-1">
      {steps.map((step, i) => (
        <div key={step.id} className="flex gap-2.5">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center",
                step.status === "running"
                  ? "bg-info/10"
                  : step.status === "completed"
                    ? "bg-success/10"
                    : step.status === "failed"
                      ? "bg-destructive/10"
                      : "bg-muted/30",
              )}
            >
              {icon(step.status)}
            </div>
            {i < steps.length - 1 && (
              <div className="w-px h-3 bg-border/30" />
            )}
          </div>
          <div className="pb-2 min-w-0">
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
              {step.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
