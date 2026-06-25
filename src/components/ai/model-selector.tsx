"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, ChevronDown, ChevronRight, Check, ExternalLink, Sparkles, Zap, Cpu, Rocket } from "lucide-react"
import { cn } from "@/lib/utils"

type Effort = "low" | "medium" | "high"

interface Model {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  premium?: boolean
}

const models: Model[] = [
  { id: "claude-sonnet", name: "Claude Sonnet", description: "Best for complex tasks", icon: Zap, premium: false },
  { id: "claude-haiku", name: "Claude Haiku", description: "Most efficient for everyday tasks", icon: Cpu, premium: false },
  { id: "gpt-4o", name: "GPT-4o", description: "High accuracy reasoning", icon: Bot, premium: false },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast and lightweight", icon: Bot, premium: false },
  { id: "claude-opus", name: "Claude Opus", description: "Premium model for advanced analysis", icon: Sparkles, premium: true },
  { id: "gpt-5", name: "GPT-5", description: "Next-gen reasoning & coding", icon: Rocket, premium: true },
]

const effortLabels: Record<Effort, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
}

interface ModelSelectorProps {
  value: string
  effort: Effort
  onValueChange: (value: string) => void
  onEffortChange: (effort: Effort) => void
}

export function ModelSelector({ value, effort, onValueChange, onEffortChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const [effortOpen, setEffortOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const effortRef = useRef<HTMLDivElement>(null)

  const activeModel = models.find((m) => m.id === value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setEffortOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => { setOpen(!open); setEffortOpen(false) }}
        className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground bg-transparent rounded-full hover:bg-muted/20 hover:text-foreground transition-colors duration-150"
      >
        <Bot className="size-3.5 text-muted-foreground" />
        <span className="truncate">{activeModel?.name ?? "Model"}</span>
        <ChevronDown className="size-3 text-muted-foreground/60" />
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-0 mb-2 w-72 rounded-xl border border-border/60 bg-popover ring-1 ring-foreground/5 overflow-hidden animate-scale-in origin-bottom-left"
        >
          <div className="max-h-[300px] overflow-y-auto py-1">
            {models.map((model) => {
              const Icon = model.icon
              const isActive = model.id === value
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    if (!model.premium) {
                      onValueChange(model.id)
                      setOpen(false)
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors hover:bg-muted/20",
                    isActive && "bg-muted/10"
                  )}
                >
                  <div className="flex items-center justify-center size-8 rounded-lg bg-muted/20 shrink-0">
                    <Icon className={cn("size-4", isActive ? "text-foreground" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-medium", isActive ? "text-foreground" : "")}>{model.name}</span>
                      {model.premium && (
                        <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-md">Upgrade</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{model.description}</span>
                  </div>
                  {isActive && <Check className="size-4 text-foreground shrink-0" />}
                  {model.premium && <ExternalLink className="size-3.5 text-muted-foreground/40 shrink-0" />}
                </button>
              )
            })}
          </div>

          <div className="border-t border-border/50">
            <div className="relative">
              <button
                onClick={() => setEffortOpen(!effortOpen)}
                className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
              >
                <span>Effort</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground/70 capitalize">{effortLabels[effort]}</span>
                  <ChevronRight className={cn("size-3.5 transition-transform", effortOpen && "rotate-90")} />
                </div>
              </button>
              {effortOpen && (
                <div ref={effortRef} className="border-t border-border/40 bg-muted/10">
                  {(Object.entries(effortLabels) as [Effort, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { onEffortChange(key); setEffortOpen(false) }}
                      className="flex items-center justify-between w-full px-3 py-2 pl-10 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                    >
                      {label}
                      {effort === key && <Check className="size-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-muted-foreground/60 hover:text-foreground hover:bg-muted/20 transition-colors border-t border-border/50"
            >
              <ExternalLink className="size-3.5" />
              More models
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
