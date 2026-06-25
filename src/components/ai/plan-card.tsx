"use client"

import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
  Search,
  FileText,
  BrainCircuit,
  AlertTriangle,
  Code,
  TerminalSquare,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useRef } from "react"
import type { CopilotPlan, PlanStep as CopilotPlanStep } from "@/ai/copilot/planner/types"
import { Button } from "@/components/ui/button"

type PlanStepStatus = "pending" | "active" | "success" | "error"

interface DisplayStep {
  id: string
  title: string
  content?: React.ReactNode
  status: PlanStepStatus
  icon?: React.ReactNode
  duration?: string
  defaultExpanded?: boolean
}

interface PlanCardProps {
  plan: CopilotPlan
  onApprove?: () => void
  onEdit?: () => void
  readOnly?: boolean
}

const modelIcon = {
  query: <Search className="w-3.5 h-3.5" />,
  analysis: <FileText className="w-3.5 h-3.5" />,
  action: <TerminalSquare className="w-3.5 h-3.5" />,
  approval: <AlertTriangle className="w-3.5 h-3.5" />,
}

function mapStatus(s: CopilotPlanStep["status"]): PlanStepStatus {
  switch (s) {
    case "running": return "active"
    case "completed": return "success"
    case "failed": return "error"
    default: return "pending"
  }
}

function isTerminal(s: CopilotPlanStep["status"]): boolean {
  return s === "completed" || s === "failed" || s === "skipped"
}

function buildDisplaySteps(steps: CopilotPlanStep[]): DisplayStep[] {
  return steps.map((s) => {
    const status = mapStatus(s.status)
    return {
      id: s.id,
      title: s.label,
      status,
      icon: modelIcon[s.type] || <Code className="w-3.5 h-3.5" />,
      defaultExpanded: status === "active" || (status === "error" && !isTerminal(s.status)),
      content: (
        <div className="space-y-2 font-mono text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Action:</span>
            <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-semibold flex items-center gap-1">
              {modelIcon[s.type] || <TerminalSquare className="w-3 h-3" />}
              {s.actionName || s.type}
            </span>
          </div>
          {s.description && (
            <div className="p-3 rounded-md bg-card border border-border text-muted-foreground">
              {s.description}
            </div>
          )}
          {s.actionInput && Object.keys(s.actionInput).length > 0 && (
            <div className="grid grid-cols-[80px_1fr] gap-1.5 mt-3 bg-secondary/30 p-2.5 rounded-md border border-border/50">
              {Object.entries(s.actionInput).map(([key, val]) => (
                <div key={key}>
                  <span className="text-foreground/50 font-medium">{key}:</span>
                  <span className="text-foreground ml-1">{String(val)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    }
  })
}

const getStatusColor = (status: PlanStepStatus) => {
  switch (status) {
    case "success": return "bg-emerald-100 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400"
    case "active": return "bg-blue-100 text-blue-600 ring-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400"
    case "error": return "bg-rose-100 text-rose-600 ring-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400"
    case "pending": return "bg-secondary text-muted-foreground ring-border/50 dark:bg-secondary/50"
  }
}

export function PlanCard({ plan, onApprove, onEdit, readOnly }: PlanCardProps) {
  const steps = buildDisplaySteps(plan.steps)
  const allDone = plan.steps.every((s) => s.status === "completed" || s.status === "skipped")
  const hasFailure = plan.steps.some((s) => s.status === "failed")
  const hasActive = steps.some((s) => s.status === "active")
  const allSuccess = steps.every((s) => s.status === "success")

  const [isMainExpanded, setIsMainExpanded] = useState(true)
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>(
    steps.reduce((acc, s) => {
      acc[s.id] = s.defaultExpanded ?? false
      return acc
    }, {} as Record<string, boolean>),
  )

  const mainContentRef = useRef<HTMLDivElement>(null)

  const toggleStep = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedSteps((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const headerIcon = hasActive ? (
    <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
  ) : allSuccess ? (
    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
  ) : hasFailure ? (
    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
  ) : (
    <BrainCircuit className="w-4 h-4 text-muted-foreground" />
  )

  const headerTitle = hasActive ? "Executing plan..." : allDone ? "Plan completed" : plan.summary

  return (
    <div className="w-full mx-auto font-sans text-foreground">
      <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl overflow-hidden transition-all duration-300">
        <div
          onClick={() => setIsMainExpanded(!isMainExpanded)}
          className={cn(
            "flex items-center justify-between px-4 py-3 cursor-pointer select-none transition-colors",
            isMainExpanded ? "bg-secondary/50 border-b border-border/10" : "hover:bg-secondary/30",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-5 h-5 text-foreground">{headerIcon}</div>
            <span className="text-[15px] font-semibold text-foreground tracking-tight">{headerTitle}</span>
          </div>
          <div className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-secondary text-muted-foreground transition-colors">
            {isMainExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </div>

        <div
          className={cn(
            "grid transition-all duration-500 ease-in-out bg-card",
            isMainExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div ref={mainContentRef} className="p-5 flex flex-col">
              {steps.map((step, index) => {
                const isStepExpanded = expandedSteps[step.id]
                const isLast = index === steps.length - 1

                return (
                  <div
                    key={step.id}
                    className={cn(
                      "relative flex gap-4 animate-in fade-in slide-in-from-top-4 duration-500 fill-mode-both",
                      step.status === "pending" ? "opacity-60 grayscale" : "opacity-100",
                    )}
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    {!isLast && (
                      <div className="absolute left-[11px] top-7 bottom-[-10px] w-[2px] bg-border/60 z-0" />
                    )}

                    <div className="relative z-10 flex-none w-6 h-6 mt-0.5">
                      <div
                        className={cn(
                          "flex items-center justify-center w-full h-full rounded-full ring-4 ring-card transition-colors duration-300",
                          getStatusColor(step.status),
                        )}
                      >
                        {step.status === "success" ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : step.status === "active" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          step.icon || <div className="w-1.5 h-1.5 rounded-full bg-current" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 pb-6">
                      <div
                        className={cn(
                          "flex items-center justify-between group rounded-md -mx-2 px-2 py-1 transition-colors",
                          step.content ? "cursor-pointer hover:bg-secondary/50" : "",
                        )}
                        onClick={(e) => step.content && toggleStep(step.id, e)}
                      >
                        <span
                          className={cn(
                            "text-[14px] tracking-tight transition-colors duration-200",
                            step.status === "active"
                              ? "text-foreground font-semibold"
                              : step.status === "error"
                                ? "text-rose-600 dark:text-rose-400 font-semibold"
                                : "text-foreground/80 group-hover:text-foreground font-medium",
                          )}
                        >
                          {step.title}
                        </span>

                        <div className="flex items-center gap-3">
                          {step.duration && (
                            <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                              {step.duration}
                            </span>
                          )}
                          {step.content && (
                            <div className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                              {isStepExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </div>
                          )}
                        </div>
                      </div>

                      {step.content && (
                        <div
                          className={cn(
                            "grid transition-all duration-400 ease-in-out",
                            isStepExpanded ? "grid-rows-[1fr] mt-2 opacity-100" : "grid-rows-[0fr] mt-0 opacity-0",
                          )}
                        >
                          <div className="overflow-hidden">
                            <div className="pt-1 pb-2">{step.content}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {allDone && !readOnly && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                  {onEdit && (
                    <Button variant="outline" size="sm" onClick={onEdit}>
                      Edit
                    </Button>
                  )}
                  {onApprove && (
                    <Button size="sm" onClick={onApprove}>
                      <ArrowRight className="w-3.5 h-3.5 mr-1" />
                      Re-execute
                    </Button>
                  )}
                </div>
              )}

              {!readOnly && !allDone && !hasActive && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                  {onEdit && (
                    <Button variant="outline" size="sm" onClick={onEdit}>
                      Edit
                    </Button>
                  )}
                  {onApprove && (
                    <Button size="sm" onClick={onApprove}>
                      <ArrowRight className="w-3.5 h-3.5 mr-1" />
                      Execute
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
