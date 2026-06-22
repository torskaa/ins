"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Bot, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react"

type Run = {
  id: string
  agentId: string
  agentName: string
  task: string
  status: string
  summary?: string
  error?: string
  startedAt: string
  completedAt?: string
  durationMs?: number
  steps: Array<{ id: string; toolName: string; status: string; durationMs?: number }>
}

export function AiRunsClient({ initialRuns }: { initialRuns: Run[] }) {
  const [runs] = useState(initialRuns)

  const statusIcon = (s: string) => {
    switch (s) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />
      case "running":
      case "executing":
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
      running: "info",
      executing: "info",
      waiting_approval: "warning",
      idle: "default",
    }
    return <Badge variant={(variants[s] || "default") as any}>{s}</Badge>
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Agent Runs</h1>
          <p>History of AI agent executions across your organization</p>
        </div>
      </div>

      {runs.length === 0 ? (
        <EmptyState
          icons={[<Bot key="b1" className="w-6 h-6" />]}
          title="No agent runs yet"
          description="AI agent executions will appear here once you start using AI Copilot."
          size="sm"
        />
      ) : (
        <div className="space-y-2">
          {runs.map((run) => (
            <Card key={run.id} className="hover:bg-surface/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 shrink-0">{statusIcon(run.status)}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{run.task}</span>
                        {statusBadge(run.status)}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Bot className="w-3 h-3" />
                          {run.agentName}
                        </span>
                        {run.steps && (
                          <span>{run.steps.length} step{run.steps.length !== 1 ? "s" : ""}</span>
                        )}
                        {run.durationMs != null && (
                          <span>{run.durationMs}ms</span>
                        )}
                      </div>
                      {run.summary && (
                        <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{run.summary}</p>
                      )}
                      {run.error && (
                        <p className="text-sm text-destructive mt-1.5">{run.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">
                    {run.startedAt && (
                      <span>{new Date(run.startedAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
