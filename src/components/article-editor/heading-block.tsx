"use client"

import { useRef, useCallback, useEffect } from "react"

interface HeadingBlockProps {
  content: string
  level: 1 | 2 | 3
  onChange: (content: string) => void
  onEnter: () => void
  onBackspaceEmpty: () => void
  onSlash: () => void
}

const levelStyles: Record<number, string> = {
  1: "text-3xl font-bold tracking-tight",
  2: "text-2xl font-bold tracking-tight",
  3: "text-xl font-semibold tracking-tight",
}

export function HeadingBlock({
  content,
  level,
  onChange,
  onEnter,
  onBackspaceEmpty,
  onSlash,
}: HeadingBlockProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== content) {
      ref.current.innerHTML = content
    }
  }, [content])

  const handleInput = useCallback(() => {
    if (ref.current) {
      onChange(ref.current.innerHTML)
    }
  }, [onChange])

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
      className={`outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/30 ${levelStyles[level]}`}
      data-placeholder={content ? "" : `Heading ${level}`}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onBlur={handleInput}
    />
  )
}
