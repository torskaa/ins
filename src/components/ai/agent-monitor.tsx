"use client"

import type { ActivityStep } from "@/components/ai/copilot-activity"
import { CopilotActivity } from "@/components/ai/copilot-activity"
import { PlanCard } from "@/components/ai/plan-card"
import type { CopilotPlan } from "@/ai/copilot/planner/types"
import { Sparkles, Clock, PanelRightClose } from "lucide-react"

interface AgentMonitorProps {
  isLoading: boolean
  streamSteps: ActivityStep[]
  currentPlan: CopilotPlan | null
  executing: boolean
  rightPanelOpen: boolean
  onTogglePanel: () => void
  onExecutePlan: () => void
}

export function AgentMonitor({
  isLoading,
  streamSteps,
  currentPlan,
  executing,
  rightPanelOpen,
  onTogglePanel,
  onExecutePlan,
}: AgentMonitorProps) {
  const hasActivity = isLoading || streamSteps.length > 0 || currentPlan !== null

  if (!rightPanelOpen) return null

  return (
    <div className="h-full border-l border-border/50 bg-card flex flex-col w-80">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 shrink-0">
        <span className="text-sm font-semibold text-muted-foreground">Agent Monitor</span>
        <button
          onClick={onTogglePanel}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
        >
          <PanelRightClose className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasActivity && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">Agent activity will appear here when running tasks</p>
          </div>
        )}

        {isLoading && streamSteps.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Live Activity</span>
            </div>
            <CopilotActivity steps={streamSteps} />
          </div>
        )}

        {currentPlan && (
          <div className="space-y-3">
            <span className="text-sm font-medium text-muted-foreground">Current Plan</span>
            <PlanCard
              plan={currentPlan}
              onApprove={onExecutePlan}
              readOnly={executing || currentPlan.status === "completed"}
            />
          </div>
        )}

        {!isLoading && streamSteps.length > 0 && !currentPlan && (
          <div className="space-y-3">
            <span className="text-sm font-medium text-muted-foreground">Completed Steps</span>
            <CopilotActivity steps={streamSteps} />
          </div>
        )}
      </div>
    </div>
  )
}
