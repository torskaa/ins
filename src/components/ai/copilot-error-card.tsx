"use client"

import { ShieldAlert } from "lucide-react"

interface CopilotErrorCardProps {
  message?: string
  actionLabel?: string
  onAction?: () => void
}

export function CopilotErrorCard({
  message,
  actionLabel,
  onAction,
}: CopilotErrorCardProps) {
  return (
    <div className="bg-warning/5 backdrop-blur-sm rounded-xl p-3.5 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Unable to complete request</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {message || "You don't have permission to access this data."}
          </p>
          {actionLabel && (
            <button
              onClick={onAction}
              className="mt-2 px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs font-medium hover:bg-warning/20 transition-colors"
            >
              {actionLabel}
            </button>
          )}
        </div>
    </div>
  )
}
