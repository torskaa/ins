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
  disabled?: boolean
}

export function AiModeSelector({ value, onChange, className, disabled }: AiModeSelectorProps) {
  return (
    <div className={cn("inline-flex items-center p-1 gap-2 rounded-lg bg-white dark:bg-zinc-900 border border-border/50", disabled && "opacity-50", className)}>
      {modes.map((mode) => {
        const isActive = mode.value === value
        return (
          <button
            key={mode.value}
            onClick={() => !disabled && onChange(mode.value)}
            className={cn(
              "inline-flex shrink-0 items-center justify-center gap-1.5 px-2.5 h-8 rounded-[min(var(--radius-md),12px)] text-xs font-medium whitespace-nowrap transition-all",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
              disabled && "cursor-not-allowed",
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
