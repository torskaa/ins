"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ThumbsUp, ThumbsDown, MessageSquareText, X } from "lucide-react"

interface FeedbackProps {
  type: "inline"
  label?: string
  onFeedback?: (value: "positive" | "negative", message?: string) => void
  className?: string
}

export function Feedback({ label = "Was this helpful?", onFeedback, className }: FeedbackProps) {
  const [selected, setSelected] = useState<"positive" | "negative" | null>(null)
  const [showInput, setShowInput] = useState(false)
  const [message, setMessage] = useState("")

  function handleSelect(value: "positive" | "negative") {
    setSelected(value)
    if (value === "negative") {
      setShowInput(true)
    } else {
      onFeedback?.(value)
    }
  }

  function handleSubmit() {
    if (selected) {
      onFeedback?.(selected, message)
    }
    setShowInput(false)
    setMessage("")
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{label}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleSelect("positive")}
            className={cn(
              "size-7 flex items-center justify-center rounded-md transition-colors",
              selected === "positive"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground/50 hover:text-foreground hover:bg-surface"
            )}
          >
            <ThumbsUp className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleSelect("negative")}
            className={cn(
              "size-7 flex items-center justify-center rounded-md transition-colors",
              selected === "negative"
                ? "text-destructive bg-destructive/10"
                : "text-muted-foreground/50 hover:text-foreground hover:bg-surface"
            )}
          >
            <ThumbsDown className="size-3.5" />
          </button>
        </div>
      </div>

      {showInput && (
        <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
          <div className="flex items-start gap-2">
            <div className="relative flex-1">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What went wrong? (optional)..."
                rows={2}
                className="w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>
            <button
              type="button"
              onClick={() => { setShowInput(false); setSelected(null) }}
              className="size-6 flex items-center justify-center rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <MessageSquareText className="size-3" />
              Send feedback
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
