"use client"

import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { CopilotContextBar } from "@/components/ai/copilot-context-bar"
import type { AiMode } from "@/components/ai/ai-mode-selector"
import { Paperclip, Keyboard, Send, Bot, Search, BarChart3, PenLine, Workflow, Settings, Sparkles } from "lucide-react"

type AiModel = "gpt-4o" | "gpt-4o-mini" | "claude-sonnet" | "claude-haiku" | "auto"

const models: { value: AiModel; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "claude-sonnet", label: "Claude Sonnet" },
  { value: "claude-haiku", label: "Claude Haiku" },
]

const placeholderTexts: Record<AiMode, string> = {
  ask: "Ask about your business...",
  analyze: "Describe what to analyze...",
  create: "Describe what to create...",
  automate: "Describe what to automate...",
  manage: "Describe what to manage...",
}

const slashCommands = [
  { id: "analyze", icon: Search, label: "Analyze", description: "Analyze data or trends" },
  { id: "report", icon: BarChart3, label: "Report", description: "Generate a report" },
  { id: "create", icon: PenLine, label: "Create", description: "Create a new record or document" },
  { id: "automate", icon: Workflow, label: "Automate", description: "Set up an automation workflow" },
  { id: "settings", icon: Settings, label: "Settings", description: "Manage preferences" },
]

interface AiComposerProps {
  input: string
  mode: AiMode
  isLoading: boolean
  executing: boolean
  contextFilter: string | null
  onInputChange: (value: string) => void
  onSend: () => void
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void
  onContextFilterChange: (value: string | null) => void
}

export function AiComposer({
  input,
  mode,
  isLoading,
  executing,
  contextFilter,
  onInputChange,
  onSend,
  onKeyDown,
  onContextFilterChange,
}: AiComposerProps) {
  const [model, setModel] = useState<AiModel>("auto")
  const [showCommands, setShowCommands] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const disabled = isLoading || executing
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const commandsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (commandsRef.current && !commandsRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowCommands(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleInputChange(value: string) {
    onInputChange(value)
    if (value.startsWith("/")) {
      setShowCommands(true)
      setSelectedIndex(0)
    } else if (!value.startsWith("/")) {
      setShowCommands(false)
    }
  }

  function handleCommandSelect(cmd: typeof slashCommands[0]) {
    onInputChange(`/${cmd.id} `)
    setShowCommands(false)
    inputRef.current?.focus()
  }

  function handleComposerKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (!showCommands) {
      onKeyDown(e)
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((i) => (i + 1) % slashCommands.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((i) => (i - 1 + slashCommands.length) % slashCommands.length)
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleCommandSelect(slashCommands[selectedIndex])
    } else if (e.key === "Escape") {
      setShowCommands(false)
    } else {
      onKeyDown(e)
    }
  }

  const filteredCommands = showCommands
    ? slashCommands.filter((c) => input.startsWith("/") && (input.length === 1 || c.id.startsWith(input.slice(1).toLowerCase())))
    : slashCommands

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="relative">
        {showCommands && filteredCommands.length > 0 && (
          <div
            ref={commandsRef}
            className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-border/50 bg-card shadow-lg overflow-hidden"
          >
            <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/20 bg-muted/10">
              Commands
            </div>
            {filteredCommands.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => handleCommandSelect(cmd)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2 text-left text-sm transition-colors",
                  i === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted/20"
                )}
              >
                <cmd.icon className="size-4 text-muted-foreground shrink-0" />
                <div className="flex flex-col">
                  <span className="font-medium">{cmd.label}</span>
                  <span className="text-xs text-muted-foreground">{cmd.description}</span>
                </div>
              </button>
            ))}
          </div>
        )}
        <Card className="w-full rounded-lg border-border/50 shadow-sm">
          <CardContent className="p-4">
            <CopilotContextBar activeContext={contextFilter} onSelectContext={onContextFilterChange} />
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder={placeholderTexts[mode]}
              disabled={disabled}
              className="flex-grow border-none ring-0 outline-none shadow-none focus:border-none focus:ring-0 focus:outline-none focus:ring-offset-0 resize-none bg-transparent min-h-[44px] text-sm"
            />

            <div className="w-full flex items-center justify-between gap-2 pt-3">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9 text-muted-foreground/60">
                  <Paperclip className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9 text-muted-foreground/60" aria-label="Keyboard shortcuts">
                  <Keyboard className="size-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Select value={model} onValueChange={(v) => setModel(v as AiModel)}>
                  <SelectTrigger className="h-9 rounded-lg text-sm gap-1.5 px-3">
                    <SelectValue placeholder="Model" />
                  </SelectTrigger>
                  <SelectContent className="text-sm">
                    {models.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        <span className="flex items-center gap-2">
                          <Bot className="size-4 text-muted-foreground" />
                          {m.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={onSend}
                  size="icon"
                  className="rounded-lg h-9 w-9"
                  disabled={!input.trim() || disabled}
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
