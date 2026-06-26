"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Type,
  Heading1,
  ImageIcon,
  Video,
  Quote,
  Code,
  Minus,
  List,
} from "lucide-react"
import { type BlockType } from "./types"

interface MenuItem {
  type: BlockType
  label: string
  icon: React.ReactNode
}

const menuItems: MenuItem[] = [
  { type: "paragraph", label: "Text", icon: <Type className="size-4" /> },
  { type: "heading", label: "Heading", icon: <Heading1 className="size-4" /> },
  { type: "image", label: "Image", icon: <ImageIcon className="size-4" /> },
  { type: "video", label: "Video", icon: <Video className="size-4" /> },
  { type: "quote", label: "Quote", icon: <Quote className="size-4" /> },
  { type: "code", label: "Code", icon: <Code className="size-4" /> },
  { type: "divider", label: "Divider", icon: <Minus className="size-4" /> },
  { type: "list", label: "List", icon: <List className="size-4" /> },
]

interface AddBlockMenuProps {
  onSelect: (type: BlockType) => void
  onClose: () => void
  anchorEl?: Element | null
}

export function AddBlockMenu({ onSelect, onClose, anchorEl }: AddBlockMenuProps) {
  const [search, setSearch] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = search
    ? menuItems.filter((item) =>
        item.label.toLowerCase().includes(search.toLowerCase())
      )
    : menuItems

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [onClose])

  useEffect(() => {
    setActiveIndex(0)
  }, [search])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((prev) => Math.max(prev - 1, 0))
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        if (filtered[activeIndex]) {
          onSelect(filtered[activeIndex].type)
          onClose()
        }
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
        return
      }
    },
    [filtered, activeIndex, onSelect, onClose]
  )

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-56 rounded-lg border border-border/40 bg-popover shadow-xl"
      style={
        anchorEl
          ? { top: (anchorEl as HTMLElement).offsetTop + (anchorEl as HTMLElement).offsetHeight + 4, left: (anchorEl as HTMLElement).offsetLeft }
          : {}
      }
    >
      <div className="p-2 pb-0">
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Filter..."
          className="w-full rounded-md border border-border/30 bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground/40"
        />
      </div>
      <div className="p-1">
        {filtered.map((item, i) => (
          <button
            key={item.type}
            type="button"
            className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
              i === activeIndex
                ? "bg-surface text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-surface"
            }`}
            onMouseDown={(e) => {
              e.preventDefault()
              onSelect(item.type)
              onClose()
            }}
            onMouseEnter={() => setActiveIndex(i)}
          >
            <span className="shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="px-3 py-4 text-sm text-muted-foreground/50 text-center">
            No results
          </div>
        )}
      </div>
    </div>
  )
}
