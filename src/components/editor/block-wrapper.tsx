"use client"

import { useState, type ReactNode } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { GripVertical, Trash2 } from "lucide-react"
import { InsertBlockButton } from "./block-menu"
import { type Block } from "./types"

interface BlockWrapperProps {
  block: Block
  children: ReactNode
  onDelete: () => void
  onFocus?: () => void
  onBlur?: () => void
  showInsertBefore?: boolean
}

export function BlockWrapper({ block, children, onDelete, onFocus, onBlur, showInsertBefore }: BlockWrapperProps) {
  const [focused, setFocused] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  function handleFocus() {
    setFocused(true)
    onFocus?.()
  }

  function handleBlur(e: React.FocusEvent) {
    // Don't blur if focus moves within the block
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setFocused(false)
    onBlur?.()
  }

  function handleInsertClick(e: React.MouseEvent) {
    const event = new CustomEvent("blockeditor:insert", {
      detail: { blockId: block.id, position: "after", rect: (e.currentTarget as HTMLElement).getBoundingClientRect() },
      bubbles: true,
    })
    e.currentTarget?.dispatchEvent(event)
  }

  return (
    <div ref={setNodeRef} style={style} className="group/block">
      {showInsertBefore && (
        <InsertBlockButton onOpen={handleInsertClick} />
      )}
      <div
        className={cn(
          "relative flex items-start gap-1 rounded-sm transition-colors",
          focused && "bg-muted/10",
        )}
        onFocus={handleFocus}
        onBlur={handleBlur}
        tabIndex={-1}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className={cn(
            "mt-1.5 -ml-6 flex items-center justify-center size-5 rounded opacity-0 group-hover/block:opacity-100 transition-opacity cursor-grab",
            focused && "opacity-100",
            "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/30",
          )}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <GripVertical className="size-3.5" />
        </div>

        {/* Block content */}
        <div className="flex-1 min-w-0">{children}</div>

        {/* Delete button */}
        {block.type !== "divider" && (
          <button
            type="button"
            onClick={onDelete}
            className={cn(
              "mt-1.5 -mr-6 flex items-center justify-center size-5 rounded opacity-0 group-hover/block:opacity-100 transition-opacity",
              focused && "opacity-100",
              "text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10",
            )}
            tabIndex={-1}
          >
            <Trash2 className="size-3" />
          </button>
        )}
      </div>
    </div>
  )
}
