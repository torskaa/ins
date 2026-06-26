"use client"

import { useRef, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"

interface TextBlockProps {
  content: string
  placeholder?: string
  onChange?: (html: string) => void
  onEnter?: () => void
  onBackspaceEmpty?: () => void
  onSlash?: () => void
  className?: string
  onSelect?: (e: React.SyntheticEvent) => void
}

export function TextBlock({
  content,
  placeholder,
  onChange,
  onEnter,
  onBackspaceEmpty,
  onSlash,
  className,
  onSelect,
}: TextBlockProps) {
  const ref = useRef<HTMLDivElement>(null)

  const setContent = useCallback((html: string) => {
    if (ref.current && ref.current.innerHTML !== html) {
      ref.current.innerHTML = html
    }
  }, [])

  useEffect(() => {
    setContent(content)
  }, [content, setContent])

  function handleInput() {
    if (ref.current) {
      const html = ref.current.innerHTML
      if (html !== content) {
        onChange?.(html)
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onEnter?.()
    }
    if (e.key === "Backspace") {
      if (ref.current && (ref.current.innerText.trim() === "" || ref.current.innerHTML === "<br>" || ref.current.innerHTML === "")) {
        e.preventDefault()
        onBackspaceEmpty?.()
      }
    }
    if (e.key === "/" && ref.current && ref.current.innerText.trim() === "") {
      onSlash?.()
    }
  }

  function handleMouseUp(e: React.MouseEvent) {
    const sel = window.getSelection()
    if (sel && !sel.isCollapsed) {
      onSelect?.(e)
    }
  }

  return (
    <div
      className={cn(
        "outline-none break-words [&_strong]:font-semibold [&_em]:italic relative text-base leading-relaxed text-foreground/90",
        !content && "before:content-[attr(data-placeholder)] before:text-muted-foreground/30 before:pointer-events-none before:absolute before:inset-0",
        className,
      )}
      data-placeholder={placeholder}
      ref={ref as React.RefObject<HTMLDivElement>}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onMouseUp={handleMouseUp}
      role="textbox"
      aria-multiline="true"
    />
  )
}
