"use client"

import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CopilotContextBar } from "@/components/ai/copilot-context-bar"
import { ActionCommandMenu } from "@/components/ai/action-command-menu"
import { ModelSelector } from "@/components/ai/model-selector"
import type { AiMode } from "@/components/ai/ai-mode-selector"
import { Send, Square, X, FileText, Image, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"

type Effort = "low" | "medium" | "high"

const placeholderTexts: Record<AiMode, string> = {
  ask: "Ask about your business...",
  analyze: "Describe what to analyze...",
  create: "Describe what to create...",
  automate: "Describe what to automate...",
  manage: "Describe what to manage...",
}

const slashCommands = [
  { id: "analyze", icon: "Search", label: "Analyze", description: "Analyze data or trends" },
  { id: "report", icon: "BarChart3", label: "Report", description: "Generate a report" },
  { id: "create", icon: "PenLine", label: "Create", description: "Create a new record or document" },
  { id: "automate", icon: "Workflow", label: "Automate", description: "Set up an automation workflow" },
  { id: "settings", icon: "Settings", label: "Settings", description: "Manage preferences" },
]

const mentionItems = [
  { id: "inventory", label: "Inventory", description: "Stock items & warehouses" },
  { id: "orders", label: "Orders", description: "Customer & supplier orders" },
  { id: "customers", label: "Customers", description: "Customer profiles & history" },
  { id: "suppliers", label: "Suppliers", description: "Supplier profiles & ratings" },
  { id: "invoices", label: "Invoices", description: "Invoice records & status" },
  { id: "reports", label: "Reports", description: "Generated reports & analytics" },
]

interface Attachment {
  id: string
  name: string
  type: string
  size: number
}

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
  onCancel?: () => void
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
  onCancel,
}: AiComposerProps) {
  const [model, setModel] = useState("claude-sonnet")
  const [effort, setEffort] = useState<Effort>("low")
  const [showCommands, setShowCommands] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const disabled = isLoading || executing
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const commandsRef = useRef<HTMLDivElement>(null)
  const mentionsRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        commandsRef.current && !commandsRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowCommands(false)
      }
      if (
        mentionsRef.current && !mentionsRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowMentions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleInputChange(value: string) {
    onInputChange(value)

    // @mentions detection
    const lastAtIndex = value.lastIndexOf("@")
    if (lastAtIndex >= 0) {
      const afterAt = value.slice(lastAtIndex + 1)
      if (!afterAt.includes(" ") && !afterAt.includes("\n")) {
        setShowMentions(true)
        setMentionQuery(afterAt.toLowerCase())
        setSelectedIndex(0)
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }

    // /commands detection
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

  function handleMentionSelect(item: typeof mentionItems[0]) {
    const lastAtIndex = input.lastIndexOf("@")
    const before = input.slice(0, lastAtIndex)
    const after = input.slice(lastAtIndex)
    const spaceIdx = after.indexOf(" ")
    const afterMention = spaceIdx >= 0 ? after.slice(spaceIdx) : ""
    const newVal = `${before}@${item.label} ${afterMention}`
    onInputChange(newVal)
    setShowMentions(false)
    inputRef.current?.focus()
  }

  function handleComposerKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (showCommands) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => (i + 1) % slashCommands.length); return }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => (i - 1 + slashCommands.length) % slashCommands.length); return }
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleCommandSelect(slashCommands[selectedIndex]); return }
      if (e.key === "Escape") { setShowCommands(false); return }
    }
    if (showMentions) {
      const filtered = mentionItems.filter((m) => m.id.includes(mentionQuery) || m.label.toLowerCase().includes(mentionQuery))
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => (i + 1) % filtered.length); return }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length); return }
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (filtered[selectedIndex]) { handleMentionSelect(filtered[selectedIndex]) }; return }
      if (e.key === "Escape") { setShowMentions(false); return }
    }
    onKeyDown(e)
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const newAttachments = files.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      type: f.type || "unknown",
      size: f.size,
    }))
    setAttachments((prev) => [...prev, ...newAttachments])
    e.target.value = ""
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const filteredCommands = showCommands
    ? slashCommands.filter((c) => input.startsWith("/") && (input.length === 1 || c.id.startsWith(input.slice(1).toLowerCase())))
    : slashCommands

  const filteredMentions = showMentions
    ? mentionItems.filter((m) => m.id.includes(mentionQuery) || m.label.toLowerCase().includes(mentionQuery))
    : mentionItems

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/60 border border-border/50 text-sm"
            >
              {att.type.startsWith("image/") ? (
                <Image className="size-3.5 text-muted-foreground" />
              ) : (
                <FileText className="size-3.5 text-muted-foreground" />
              )}
              <span className="text-xs truncate max-w-[120px]">{att.name}</span>
              <span className="text-[10px] text-muted-foreground/50">{formatSize(att.size)}</span>
              <button onClick={() => removeAttachment(att.id)} className="text-muted-foreground hover:text-foreground ml-1">
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        {/* @mentions dropdown */}
        {showMentions && filteredMentions.length > 0 && (
          <div
            ref={mentionsRef}
            className="absolute bottom-full left-0 right-0 mb-2 rounded-xl bg-popover/80 backdrop-blur-xl ring-1 ring-border/10 overflow-hidden"
          >
            <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/20 bg-muted/10">
              Mention context
            </div>
            {filteredMentions.map((item, i) => (
              <button
                key={item.id}
                onClick={() => handleMentionSelect(item)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2 text-left text-sm transition-colors",
                  i === selectedIndex ? "bg-surface text-foreground" : "hover:bg-surface"
                )}
              >
                <div className="flex flex-col">
                  <span className="font-medium">@{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* /commands dropdown */}
        {showCommands && filteredCommands.length > 0 && (
          <div
            ref={commandsRef}
            className="absolute bottom-full left-0 right-0 mb-2 rounded-xl bg-popover/80 backdrop-blur-xl ring-1 ring-border/10 overflow-hidden"
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
                  i === selectedIndex ? "bg-surface text-foreground" : "hover:bg-surface"
                )}
              >
                <span className="font-medium">{cmd.label}</span>
                <span className="text-xs text-muted-foreground ml-auto">{cmd.description}</span>
              </button>
            ))}
          </div>
        )}

        <div className="w-full rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl focus-within:border-black dark:focus-within:border-white focus-within:ring-2 focus-within:ring-ring/20 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder={placeholderTexts[mode]}
            disabled={disabled}
            rows={1}
            className="w-full border-0 ring-0 outline-none shadow-none focus:border-0 focus:ring-0 focus:outline-none focus:shadow-none focus-visible:border-0 focus-visible:ring-0 resize-none bg-transparent px-4 pt-4 pb-2 min-h-[56px] text-sm placeholder:text-muted-foreground/60"
          />

          <div className="w-full flex items-center justify-between gap-2 px-3 pb-3">
            <div className="flex items-center gap-1">
              <ActionCommandMenu
                onInsertText={(text) => {
                  const el = inputRef.current
                  if (el) {
                    const start = el.selectionStart ?? input.length
                    const end = el.selectionEnd ?? input.length
                    const newVal = input.slice(0, start) + text + input.slice(end)
                    onInputChange(newVal)
                    requestAnimationFrame(() => {
                      el.focus()
                      el.setSelectionRange(start + 2, start + 2)
                    })
                  }
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                disabled={disabled}
              >
                <Paperclip className="size-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <CopilotContextBar activeContext={contextFilter} onSelectContext={onContextFilterChange} />
            </div>
            <div className="flex items-center gap-2">
              <ModelSelector
                value={model}
                effort={effort}
                onValueChange={setModel}
                onEffortChange={setEffort}
              />
              {isLoading || executing ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onCancel}
                      size="icon"
                      className="size-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30"
                    >
                      <Square className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs flex-col items-start gap-1 px-3 py-2 text-left" side="bottom">
  <p className="text-sm font-medium">Cancel</p>
  <p className="text-background/70 text-xs leading-snug">
    Clear the current message
  </p>
</TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onSend}
                      size="icon"
                      className="size-8 rounded-lg"
                      disabled={!input.trim() || disabled}
                    >
                      <Send className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs flex-col items-start gap-1 px-3 py-2 text-left" side="bottom">
  <p className="text-sm font-medium">Send</p>
  <p className="text-background/70 text-xs leading-snug">
    Send your message to the AI
  </p>
</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
