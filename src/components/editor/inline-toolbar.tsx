"use client"

import { useEffect, useRef, useState } from "react"
import { Bold, Italic, Link, Code } from "lucide-react"
import { cn } from "@/lib/utils"

interface InlineToolbarProps {
  editorRef: React.RefObject<HTMLDivElement | null>
}

export function InlineToolbar({ editorRef }: InlineToolbarProps) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleSelection() {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setVisible(false)
        return
      }

      // Check if selection is within our editor
      const container = editorRef.current
      if (!container || !container.contains(sel.anchorNode)) {
        setVisible(false)
        return
      }

      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      setPosition({
        top: rect.top - 40,
        left: rect.left + (rect.width / 2),
      })
      setVisible(true)
    }

    function handleMouseUp() {
      setTimeout(handleSelection, 10)
    }

    function handleKeyUp() {
      setTimeout(handleSelection, 10)
    }

    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("keyup", handleKeyUp)

    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("keyup", handleKeyUp)
    }
  }, [editorRef])

  function exec(cmd: string, value?: string) {
    document.execCommand(cmd, false, value)
    setVisible(false)
    // Refocus
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      sel.getRangeAt(0).collapse(false)
    }
  }

  function isActive(cmd: string): boolean {
    return document.queryCommandState(cmd)
  }

  if (!visible) return null

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 flex items-center gap-0.5 rounded-lg border border-border/60 bg-background shadow-lg px-1.5 py-1"
      style={{
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
      }}
    >
      <ToolbarButton active={isActive("bold")} onClick={() => exec("bold")} icon={<Bold className="size-3.5" />} label="Bold" shortcut="⌘B" />
      <ToolbarButton active={isActive("italic")} onClick={() => exec("italic")} icon={<Italic className="size-3.5" />} label="Italic" shortcut="⌘I" />
      <ToolbarButton
        active={isActive("underline")}
        onClick={() => exec("createLink", window.prompt("Enter URL:") || "")}
        icon={<Link className="size-3.5" />}
        label="Link"
        shortcut="⌘K"
      />
      <ToolbarButton active={isActive("code")} onClick={() => exec("formatBlock", "<code>")} icon={<Code className="size-3.5" />} label="Code" />
    </div>
  )
}

function ToolbarButton({
  active,
  onClick,
  icon,
  label,
  shortcut,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  shortcut?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${label}${shortcut ? ` (${shortcut})` : ""}`}
      className={cn(
        "size-7 flex items-center justify-center rounded-sm transition-colors",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
      )}
    >
      {icon}
    </button>
  )
}
