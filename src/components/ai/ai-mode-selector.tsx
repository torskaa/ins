"use client"

import { MessageSquare, BarChart3, PlusCircle, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

export type AiMode = "ask" | "analyze" | "create" | "automate" | "manage"

const modes: { value: AiMode; label: string; icon: React.ReactNode }[] = [
  { value: "ask", label: "Ask", icon: <MessageSquare className="size-3.5" /> },
  { value: "analyze", label: "Analyze", icon: <BarChart3 className="size-3.5" /> },
  { value: "create", label: "Create", icon: <PlusCircle className="size-3.5" /> },
  { value: "automate", label: "Automate", icon: <Zap className="size-3.5" /> },
]

interface AiModeSelectorProps {
  value: AiMode
  onChange: (mode: AiMode) => void
  className?: string
}

export function AiModeSelector({ value, onChange, className }: AiModeSelectorProps) {
  return (
    <div className={cn("inline-flex items-center p-0.5 rounded-lg bg-muted/50 border border-border/40", className)}>
      {modes.map((mode) => {
        const isActive = mode.value === value
        return (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              isActive
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {mode.icon}
            {mode.label}
          </button>
        )
      })}
    </div>
  )
}
