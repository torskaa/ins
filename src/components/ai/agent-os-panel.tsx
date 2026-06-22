"use client"

import type { ActivityStep } from "@/components/ai/copilot-activity"
import { CopilotActivity } from "@/components/ai/copilot-activity"
import type { CopilotPlan } from "@/ai/copilot/planner/types"
import {
  Sparkles,
  Clock,
  PanelRightClose,
  Bot,
  Cpu,
  Timer,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AgentOSPanelProps {
  isLoading: boolean
  streamSteps: ActivityStep[]
  currentPlan: CopilotPlan | null
  executing: boolean
  rightPanelOpen: boolean
  onTogglePanel: () => void
  onExecutePlan: () => void
}

export function AgentOSPanel({
  isLoading,
  streamSteps,
  currentPlan,
  executing,
  rightPanelOpen,
  onTogglePanel,
  onExecutePlan,
}: AgentOSPanelProps) {
  const hasActivity = isLoading || streamSteps.length > 0 || currentPlan !== null
  const activeStep = streamSteps.find((s) => s.status === "running")
  const completedCount = streamSteps.filter((s) => s.status === "completed").length
  const totalSteps = streamSteps.length

  if (!rightPanelOpen) return null

  return (
    <div className="h-full border-l border-border/50 bg-card flex flex-col w-80">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-info/20 to-primary/20 flex items-center justify-center">
            <Sparkles className="size-3 text-primary" />
          </div>
          <span className="text-sm font-semibold">AI Activity</span>
        </div>
        <button
          onClick={onTogglePanel}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
        >
          <PanelRightClose className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasActivity && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-4">
              <Bot className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">Agent idle</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Start a conversation to activate</p>
          </div>
        )}

        {hasActivity && (
          <>
            {/* Active Agent */}
            <div className="rounded-lg border border-border/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isLoading ? "bg-info animate-pulse" : "bg-success",
                  )} />
                  <span className="text-sm font-medium">Primary Agent</span>
                </div>
                <Badge variant="outline" className={cn(
                  "text-xs",
                  isLoading ? "text-info border-info/20" : "text-success border-success/20",
                )}>
                  {isLoading ? "Running" : "Ready"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Cpu className="size-3" />
                  Tools: {totalSteps}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Timer className="size-3" />
                  1.2s
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <DollarSign className="size-3" />
                  $0.004
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="size-3 text-success" />
                  {completedCount}/{totalSteps}
                </div>
              </div>
            </div>

            {/* Live Activity */}
            {isLoading && streamSteps.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Execution</span>
                </div>
                <CopilotActivity steps={streamSteps} />
              </div>
            )}

            {/* Plan */}
            {currentPlan && (
              <div className="space-y-3">
                <span className="text-sm font-medium text-muted-foreground">Plan</span>
                <div className="rounded-lg border border-border/40 p-3 space-y-2">
                  {currentPlan.steps.map((step, i) => (
                    <div key={step.id} className="flex items-center gap-2 text-sm">
                      {step.status === "completed" ? (
                        <CheckCircle2 className="size-4 text-success shrink-0" />
                      ) : step.status === "running" ? (
                        <Clock className="size-4 text-info animate-pulse shrink-0" />
                      ) : (
                        <div className="size-4 shrink-0" />
                      )}
                      <span className={cn(
                        step.status === "completed" ? "text-muted-foreground" : "text-foreground",
                      )}>{step.label}</span>
                      {step.status === "completed" && (
                        <Badge variant="outline" className="ml-auto text-[10px] text-success border-success/20">done</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed */}
            {!isLoading && streamSteps.length > 0 && !currentPlan && (
              <div className="space-y-3">
                <span className="text-sm font-medium text-muted-foreground">Completed Steps</span>
                <CopilotActivity steps={streamSteps} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
