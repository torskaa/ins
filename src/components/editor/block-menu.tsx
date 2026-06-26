"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"
import { type BlockMenuOption, type BlockType } from "./types"

const DEFAULT_BLOCK_MENU_OPTIONS: BlockMenuOption[] = [
  { type: "paragraph", label: "Text", description: "Plain text paragraph", icon: <span className="text-sm font-normal">T</span> },
  { type: "heading", label: "Heading", description: "Section heading", icon: <span className="text-sm font-bold">H</span> },
  { type: "image", label: "Image", description: "Upload or embed an image", icon: <span className="size-4 text-muted-foreground">🖼</span> },
  { type: "embed", label: "Embed", description: "YouTube, Vimeo, Twitter, or any URL", icon: <span className="text-sm font-mono">&lt;&gt;</span> },
  { type: "quote", label: "Quote", description: "Blockquote", icon: <span className="text-sm">&ldquo;</span> },
  { type: "code", label: "Code", description: "Code block", icon: <span className="text-sm font-mono">&lt;/&gt;</span> },
  { type: "checklist", label: "Checklist", description: "To-do list with checkboxes", icon: <span className="text-sm">☑</span> },
  { type: "divider", label: "Divider", description: "Horizontal rule", icon: <span className="text-sm">&mdash;</span> },
  { type: "bulletList", label: "List", description: "Bullet list", icon: <span className="text-sm">&bull;</span> },
]

interface BlockMenuProps {
  open: boolean
  anchorEl?: HTMLElement | null
  onSelect: (type: BlockType) => void
  onClose: () => void
}

export function BlockMenu({ open, anchorEl, onSelect, onClose }: BlockMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = DEFAULT_BLOCK_MENU_OPTIONS.filter(
    (opt) => opt.label.toLowerCase().includes(search.toLowerCase()) || opt.description.toLowerCase().includes(search.toLowerCase()),
  )

  // Auto-focus input on mount
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (!open) return
      if (e.key === "Escape") { e.preventDefault(); onClose(); return }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); return }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); return }
      if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault()
        onSelect(filtered[selectedIndex].type)
        onClose()
        return
      }
      if (e.key === "Backspace" && search === "") {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, filtered, selectedIndex, onSelect, onClose, search])

  if (!open) return null

  const style: React.CSSProperties = {}
  if (anchorEl) {
    const rect = anchorEl.getBoundingClientRect()
    style.position = "fixed"
    style.top = `${rect.bottom + 4}px`
    style.left = `${rect.left}px`
    style.zIndex = 50
  }

  return (
    <div
      ref={ref}
      className="w-64 rounded-lg border border-border/60 bg-background shadow-lg p-1"
      style={style}
    >
      <div className="px-2 pb-1">
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelectedIndex(0) }}
          placeholder="Filter blocks..."
          className="w-full text-xs bg-transparent border-none outline-none py-1.5 placeholder:text-muted-foreground/30"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground px-2 py-3 text-center">No blocks found</p>
      ) : (
        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {filtered.map((opt, i) => (
            <button
              key={opt.type}
              type="button"
              className={cn(
                "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors",
                i === selectedIndex ? "bg-muted/50" : "hover:bg-muted/30",
              )}
              onClick={() => { onSelect(opt.type); onClose() }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="size-7 flex items-center justify-center rounded-md bg-muted/30 text-muted-foreground text-sm">
                {opt.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground truncate">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function InsertBlockButton({ onOpen }: { onOpen: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex items-center gap-1.5 w-full py-1 text-xs text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
    >
      <span className="size-4 flex items-center justify-center rounded-full border border-current">
        <Plus className="size-2.5" />
      </span>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity">Add block</span>
    </button>
  )
}
