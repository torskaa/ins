"use client"

import type { ChatMessage } from "@/hooks/use-ai-chat"

interface AiActionCardProps {
  suggestions: NonNullable<ChatMessage["actionSuggestions"]>
}

export function AiActionCard({ suggestions }: AiActionCardProps) {
  if (!suggestions || suggestions.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium">Suggested actions</p>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border/50 text-xs text-muted-foreground bg-muted/30 cursor-default select-none"
            title={s.description}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}
