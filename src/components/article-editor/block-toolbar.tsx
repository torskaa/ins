"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Bold, Italic, Link, Code } from "lucide-react"

interface BlockToolbarProps {
  editorRef: React.RefObject<HTMLDivElement | null>
}

export function BlockToolbar({ editorRef }: BlockToolbarProps) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const toolbarRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      setVisible(false)
      return
    }

    const range = selection.getRangeAt(0)
    const editorEl = editorRef.current
    if (!editorEl || !editorEl.contains(range.commonAncestorContainer)) {
      setVisible(false)
      return
    }

    const rect = range.getBoundingClientRect()
    const toolbarHeight = 40
    const top = rect.top - toolbarHeight - 8
    const left = rect.left + rect.width / 2

    setPosition({ top: Math.max(8, top), left })
    setVisible(true)
  }, [editorRef])

  useEffect(() => {
    document.addEventListener("selectionchange", updatePosition)
    return () => document.removeEventListener("selectionchange", updatePosition)
  }, [updatePosition])

  function exec(command: string, value?: string) {
    document.execCommand(command, false, value)
    updatePosition()
    editorRef.current?.focus()
  }

  function handleLink() {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return

    // Check if already inside a link
    let existingUrl = ""
    let node = selection.anchorNode
    while (node && node !== editorRef.current) {
      if (node instanceof HTMLAnchorElement) {
        existingUrl = node.getAttribute("href") || ""
        break
      }
      node = node.parentNode
    }

    const url = window.prompt(existingUrl ? "Edit link URL:" : "Enter URL:", existingUrl || "https://")
    if (url === null) return
    if (url === "") {
      exec("unlink")
    } else {
      exec("createLink", url)
    }
  }

  if (!visible) return null

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 flex items-center gap-0.5 rounded-lg border border-border/30 bg-popover p-1 shadow-lg"
      style={{ top: position.top, left: position.left, transform: "translateX(-50%)" }}
    >
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); exec("bold") }}
        className="size-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Bold"
      >
        <Bold className="size-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); exec("italic") }}
        className="size-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Italic"
      >
        <Italic className="size-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); handleLink() }}
        className="size-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Link"
      >
        <Link className="size-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); exec("code") }}
        className="size-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Code"
      >
        <Code className="size-3.5" />
      </button>
    </div>
  )
}
