"use client"

import { useRef, useCallback, useEffect } from "react"

interface PasteBlock {
  type: "paragraph" | "heading" | "list" | "code" | "quote" | "divider"
  content?: string
  level?: number
  items?: string[]
  language?: string
  listType?: "bullet" | "ordered"
}

interface ParagraphBlockProps {
  content: string
  placeholder?: string
  className?: string
  onChange: (content: string) => void
  onEnter: () => void
  onBackspaceEmpty: () => void
  onSlash: () => void
  onPaste?: (blocks: PasteBlock[]) => void
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
  onPaste,
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

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const html = e.clipboardData?.getData("text/html")
    const plain = e.clipboardData?.getData("text/plain")
    if (!html && !plain) return

    e.preventDefault()
    const doc = new DOMParser().parseFromString(html || `<p>${plain}</p>`, "text/html")
    const body = doc.body

    // Check if paste contains structured elements
    const hasHeading = body.querySelector("h1, h2, h3, h4, h5, h6")
    const hasList = body.querySelector("ul, ol")
    const hasCode = body.querySelector("pre")
    const hasQuote = body.querySelector("blockquote")
    const hasDivider = body.querySelector("hr")
    const hasParagraph = body.querySelector("p")

    const allowedInline = new Set(["b", "strong", "i", "em", "u", "s", "a", "code", "br", "span"])
    function cleanInline(html: string): string {
      const d = document.createElement("div")
      d.innerHTML = html
      function clean(n: Node): string {
        if (n.nodeType === 3) return n.textContent || ""
        if (n.nodeType !== 1) return ""
        const e = n as HTMLElement
        const t = e.tagName.toLowerCase()
        if (t === "style" || t === "script") return ""
        if (!allowedInline.has(t)) return Array.from(e.childNodes).map(clean).join("")
        const inner = Array.from(e.childNodes).map(clean).join("")
        if (t === "br") return "<br>"
        if (t === "a") {
          const href = (e as HTMLAnchorElement).getAttribute("href")
          return href ? `<a href="${href}">${inner}</a>` : inner
        }
        if (t === "span") return inner
        return `<${t}>${inner}</${t}>`
      }
      return Array.from(d.childNodes).map(clean).join("")
    }

    if ((hasHeading || hasList || hasCode || hasQuote || hasDivider) && onPaste) {
      const blocks: PasteBlock[] = []
      for (const node of Array.from(body.childNodes)) {
        if (node.nodeType !== 1) continue
        const el = node as HTMLElement
        const tag = el.tagName.toLowerCase()
        if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4" || tag === "h5" || tag === "h6") {
          blocks.push({ type: "heading", content: cleanInline(el.innerHTML), level: parseInt(tag[1]) as 1|2|3|4|5|6 })
        } else if (tag === "ul" || tag === "ol") {
          const items: string[] = []
          el.querySelectorAll("li").forEach(li => items.push(cleanInline(li.innerHTML)))
          blocks.push({ type: "list", items, listType: tag === "ul" ? "bullet" : "ordered" })
        } else if (tag === "pre") {
          const code = el.querySelector("code")
          blocks.push({ type: "code", content: code?.innerHTML || el.innerHTML, language: code?.className?.replace("language-", "") || "plaintext" })
        } else if (tag === "blockquote") {
          blocks.push({ type: "quote", content: cleanInline(el.innerHTML) })
        } else if (tag === "hr") {
          blocks.push({ type: "divider" })
        } else if (tag === "p" || tag === "div") {
          const inner = cleanInline(el.innerHTML).trim()
          if (inner) blocks.push({ type: "paragraph", content: inner })
        }
      }
      if (blocks.length > 0) {
        onPaste(blocks)
        return
      }
    }

    // Inline paste for plain text / simple HTML
    const allowed = new Set(["b", "strong", "i", "em", "u", "s", "a", "code", "pre", "br", "span"])

    function clean(node: Node): string {
      if (node.nodeType === 3) return node.textContent || ""
      if (node.nodeType !== 1) return ""
      const el = node as HTMLElement
      const tag = el.tagName.toLowerCase()
      if (tag === "style" || tag === "script") return ""
      if (!allowed.has(tag)) {
        return Array.from(el.childNodes).map(clean).join("")
      }
      const inner = Array.from(el.childNodes).map(clean).join("")
      if (tag === "br") return "<br>"
      if (tag === "a") {
        const href = (el as HTMLAnchorElement).getAttribute("href")
        return href ? `<a href="${href}">${inner}</a>` : inner
      }
      if (tag === "span") return inner
      return `<${tag}>${inner}</${tag}>`
    }

    const cleaned = Array.from(body.childNodes).map(clean).join("")

    const sel = window.getSelection()
    if (!sel?.rangeCount) {
      document.execCommand("insertHTML", false, cleaned)
      return
    }
    const range = sel.getRangeAt(0)
    range.deleteContents()
    const frag = range.createContextualFragment(cleaned)
    range.insertNode(frag)
    range.collapse(false)
    sel.removeAllRanges()
    sel.addRange(range)

    handleInput()
  }, [handleInput, onPaste])

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
      onPaste={handlePaste}
      onBlur={handleInput}
    />
  )
}
