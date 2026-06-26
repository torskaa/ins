"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ToolStepCard } from "@/components/ai/tool-step-card"
import { ApprovalCard } from "@/components/ai/approval-card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Bot, CheckCircle2, XCircle, Clock, Loader2, ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { SerializedRun } from "./page"
import type { ApprovalStatus, StepStatus } from "@/ai/agents/types"

const statusIcon = (s: string) => {
  switch (s) {
    case "completed":
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    case "failed":
      return <XCircle className="w-4 h-4 text-destructive" />
    case "executing":
    case "running":
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
    case "waiting_approval":
      return <Clock className="w-4 h-4 text-amber-500" />
    default:
      return <Bot className="w-4 h-4 text-muted-foreground" />
  }
}

const statusBadge = (s: string) => {
  const variants: Record<string, string> = {
    completed: "success",
    failed: "destructive",
    executing: "info",
    running: "info",
    waiting_approval: "warning",
    idle: "default",
    planning: "info",
    summarizing: "info",
    cancelled: "destructive",
  }
  return <Badge variant={(variants[s] || "default") as any}>{s}</Badge>
}

export function AiRunsDetailClient({ run: initialRun }: { run: SerializedRun }) {
  const [run, setRun] = useState(initialRun)

  const duration = run.durationMs != null
    ? run.durationMs >= 1000
      ? `${(run.durationMs / 1000).toFixed(1)}s`
      : `${run.durationMs}ms`
    : null

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/ai/runs">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs flex-col items-start gap-1 px-3 py-2 text-left" side="bottom">
          <p className="text-sm font-medium">Back</p>
          <p className="text-background/70 text-xs leading-snug">
            Go back to AI runs list
          </p>
        </TooltipContent>
        </Tooltip>
        <h1 className="text-xl font-semibold">Run Details</h1>
      </div>

      <Card className="shadow-sm bg-white dark:bg-zinc-950">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 shrink-0">{statusIcon(run.status)}</div>
              <div className="min-w-0">
                <h2 className="font-medium">{run.task}</h2>
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Avatar className="size-5">
                      <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(run.agentName.replace(/\s+/g, ""))}`} />
                      <AvatarFallback className="text-[8px]">{run.agentName[0]}</AvatarFallback>
                    </Avatar>
                    {run.agentName}
                  </span>
                  {duration && <span>{duration}</span>}
                  <span>{new Date(run.startedAt).toLocaleString()}</span>
                </div>
                {run.summary && (
                  <p className="text-sm text-muted-foreground mt-3 bg-muted/50 rounded p-3">
                    {run.summary}
                  </p>
                )}
                {run.error && (
                  <p className="text-sm text-destructive mt-3 bg-destructive/5 rounded p-3">
                    {run.error}
                  </p>
                )}
              </div>
            </div>
            <div className="shrink-0">{statusBadge(run.status)}</div>
          </div>
        </CardContent>
      </Card>

      {run.approvalRequest && (
        <ApprovalCard
          runId={run.id}
          toolName={run.approvalRequest.toolName}
          input={run.approvalRequest.input as Record<string, unknown>}
          reason={run.approvalRequest.reason}
          status={run.approvalRequest.status as ApprovalStatus}
          onResolved={() => {
            window.location.reload()
          }}
        />
      )}

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Execution Steps ({run.steps.length})
        </h3>
        <div className="space-y-2">
          {run.steps.map((step, index) => (
            <div key={step.id} className="relative pl-6">
              {index < run.steps.length - 1 && (
                <div className="absolute left-[11px] top-5 bottom-0 w-px bg-border" />
              )}
              <div className="absolute left-0 top-[14px] w-[22px] h-[22px] rounded-full border-2 border-background bg-muted flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
              </div>
              <ToolStepCard
                toolName={step.toolName}
                status={step.status as StepStatus}
                input={step.input as Record<string, unknown>}
                output={step.output ?? undefined}
                error={step.errorMessage ?? undefined}
                durationMs={step.durationMs ?? undefined}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
