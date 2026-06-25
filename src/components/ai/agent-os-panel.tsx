"use client"

import type { ActivityStep } from "@/components/ai/copilot-activity"
import { CopilotActivity } from "@/components/ai/copilot-activity"
import type { CopilotPlan } from "@/ai/copilot/planner/types"
import {
  Sparkles,
  PanelRightClose,
  Bot,
  CheckCircle2,
  Activity,
  Gauge,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AgentOSPanelProps {
  isLoading: boolean
  streamSteps: ActivityStep[]
  currentPlan: CopilotPlan | null
  executing: boolean
  rightPanelOpen: boolean
  onTogglePanel: () => void
  onExecutePlan: () => void
  title?: string
}

export function AgentOSPanel({
  isLoading,
  streamSteps,
  currentPlan,
  executing,
  rightPanelOpen,
  onTogglePanel,
  onExecutePlan,
  title,
}: AgentOSPanelProps) {
  const hasActivity = isLoading || streamSteps.length > 0 || currentPlan !== null
  const activeStep = streamSteps.find((s) => s.status === "running")
  const completedCount = streamSteps.filter((s) => s.status === "completed").length
  const totalSteps = streamSteps.length
  const planCompletedCount = currentPlan?.steps.filter((s) => s.status === "completed" || s.status === "skipped").length || 0
  const planTotalCount = currentPlan?.steps.length || 0
  const progress = planTotalCount > 0 ? Math.round((planCompletedCount / planTotalCount) * 100) : 0

  if (!rightPanelOpen) return null

  return (
    <div className="h-full border-l border-border/10 bg-card flex flex-col w-80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{title || "Agent Runtime"}</span>
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
            <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-4 ring-1 ring-border/30">
              <Bot className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-foreground/80">Agent idle</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Start a conversation to activate</p>
          </div>
        )}

        {hasActivity && (
          <>
            {/* Agent Status Card */}
            <div className="rounded-xl bg-card/60 border border-border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full ring-2",
                    isLoading ? "bg-blue-500 ring-blue-500/20 animate-pulse" :
                    executing ? "bg-amber-500 ring-amber-500/20 animate-pulse" :
                    "bg-emerald-500 ring-emerald-500/20",
                  )} />
                  <span className="text-sm font-semibold">Primary Agent</span>
                </div>
                <Badge variant="outline" className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5",
                  isLoading ? "text-blue-500 border-blue-500/20 bg-blue-500/5" :
                  executing ? "text-amber-500 border-amber-500/20 bg-amber-500/5" :
                  "text-emerald-500 border-emerald-500/20 bg-emerald-500/5",
                )}>
                  {isLoading ? "Running" : executing ? "Executing" : "Ready"}
                </Badge>
              </div>

              {/* Current Task */}
              {activeStep && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 rounded-md px-2.5 py-1.5 border border-border/30">
                  <Activity className="size-3 shrink-0 text-blue-500" />
                  <span className="truncate">{activeStep.label}</span>
                </div>
              )}

              {/* Progress Bar */}
              {planTotalCount > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground/80">{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Live Activity */}
            {isLoading && streamSteps.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Gauge className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase leading-none">Execution</span>
                </div>
                <div className="rounded-xl bg-card/50 border border-border p-3">
                  <CopilotActivity steps={streamSteps} />
                </div>
              </div>
            )}

            {/* Plan */}
            {currentPlan && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Gauge className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase leading-none">Plan</span>
                </div>
                <div className="rounded-xl bg-card/60 border border-border p-3 space-y-2">
                  {currentPlan.steps.map((step, i) => (
                    <div key={step.id} className="flex items-center gap-2.5 text-sm">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center shrink-0 border",
                        step.status === "completed" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" :
                        step.status === "running" ? "bg-blue-500/10 border-blue-500/30 text-blue-500" :
                        step.status === "failed" ? "bg-red-500/10 border-red-500/30 text-red-500" :
                        "bg-muted/20 border-border/30 text-muted-foreground/50",
                      )}>
                        {step.status === "completed" ? (
                          <CheckCircle2 className="size-3" />
                        ) : step.status === "running" ? (
                          <div className="size-2 rounded-full bg-current animate-pulse" />
                        ) : (
                          <div className="size-1.5 rounded-full bg-current" />
                        )}
                      </div>
                      <span className={cn(
                        step.status === "completed" ? "text-muted-foreground" : "text-foreground font-medium",
                      )}>{step.label}</span>
                      {step.status === "completed" && (
                        <Badge variant="outline" className="ml-auto text-[9px] text-emerald-500 border-emerald-500/20 px-1 py-0">done</Badge>
                      )}
                    </div>
                  ))}
                  {currentPlan.status !== "completed" && (
                    <div className="pt-2 border-t border-border/20 mt-2">
                      {executing ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="size-2 rounded-full bg-amber-500 animate-pulse ring-2 ring-amber-500/20" />
                          Executing plan...
                        </div>
                      ) : (
                        <Button
                          onClick={onExecutePlan}
                          className="h-8 rounded-lg text-xs font-medium w-full"
                        >
                          Execute Plan
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Completed */}
            {!isLoading && streamSteps.length > 0 && !currentPlan && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Gauge className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase leading-none">Completed Steps</span>
                </div>
                <div className="rounded-xl bg-card/50 border border-border p-3">
                  <CopilotActivity steps={streamSteps} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
