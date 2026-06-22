"use client"

import { ArrowRight } from "lucide-react"

interface ActionSuggestion {
  id: string
  label: string
  description?: string
}

interface CopilotActionCardProps {
  actions: ActionSuggestion[]
}

export function CopilotActionCard({ actions }: CopilotActionCardProps) {
  if (!actions || actions.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground font-medium">Suggested actions</p>
      <div className="flex flex-wrap gap-1.5">
        {actions.map((a) => (
          <span
            key={a.id}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border/50 text-[11px] text-muted-foreground bg-card/50 cursor-default select-none"
            title={a.description}
          >
            {a.label}
            <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
          </span>
        ))}
      </div>
    </div>
  )
}
