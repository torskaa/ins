"use client"

import { useRef, useCallback, useEffect } from "react"

interface ParagraphBlockProps {
  content: string
  placeholder?: string
  className?: string
  onChange: (content: string) => void
  onEnter: () => void
  onBackspaceEmpty: () => void
  onSlash: () => void
  autoFocus?: boolean
}

export function ParagraphBlock({
  content,
  placeholder = "Start writing...",
  className = "",
  onChange,
  onEnter,
  onBackspaceEmpty,
  onSlash,
  autoFocus,
}: ParagraphBlockProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus()
    }
  }, [autoFocus])

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== content) {
      ref.current.innerHTML = content
    }
  }, [content])

  const handleInput = useCallback(() => {
    if (ref.current) {
      const html = ref.current.innerHTML
      if (html !== content) {
        onChange(html)
      }
    }
  }, [content, onChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        onEnter()
        return
      }
      if (e.key === "Backspace") {
        if (ref.current && (ref.current.innerHTML === "" || ref.current.innerHTML === "<br>")) {
          e.preventDefault()
          onBackspaceEmpty()
          return
        }
      }
      if (e.key === "/") {
        const selection = window.getSelection()
        if (selection && ref.current) {
          const text = ref.current.textContent || ""
          if (text.length === 0 || selection.anchorOffset === 0) {
            onSlash()
          }
        }
      }
    },
    [onEnter, onBackspaceEmpty, onSlash]
  )

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      className={`outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/30 ${className}`}
      data-placeholder={content ? "" : placeholder}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onBlur={handleInput}
    />
  )
}
