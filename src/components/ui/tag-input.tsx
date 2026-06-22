"use client"

import { useState, useEffect, useRef, type KeyboardEvent } from "react"
import { cn } from "@/lib/utils"

interface TagInputProps {
 value: string
 onChange: (value: string) => void
 placeholder?: string
 className?: string
 tagType?: string
}

interface Suggestion {
 id: string
 name: string
}

export function TagInput({ value, onChange, placeholder, className, tagType }: TagInputProps) {
 const [input, setInput] = useState("")
 const [suggestions, setSuggestions] = useState<Suggestion[]>([])
 const [allTags, setAllTags] = useState<Suggestion[]>([])
 const [focusedIdx, setFocusedIdx] = useState(-1)
 const [showDropdown, setShowDropdown] = useState(false)
 const inputRef = useRef<HTMLInputElement>(null)
 const dropdownRef = useRef<HTMLDivElement>(null)
 const [loadingTags, setLoadingTags] = useState(false)

 const tags = value ? value.split(",").map((t) => t.trim()).filter(Boolean) : []

 useEffect(() => {
 if (!tagType) return
 setLoadingTags(true)
 fetch(`/api/tags?type=${tagType}`)
 .then((r) => r.json())
 .then((data) => {
 setAllTags(data)
 })
 .catch(() => {})
 .finally(() => setLoadingTags(false))
 }, [tagType])

 useEffect(() => {
 if (!input.trim()) {
 setShowDropdown(false)
 setFocusedIdx(-1)
 return
 }
 const q = input.toLowerCase()
 const currentTags = value ? value.split(",").map((t) => t.trim()).filter(Boolean) : []
 const filtered = allTags.filter(
 (t) => t.name.toLowerCase().includes(q) && !currentTags.includes(t.name)
 )
 setSuggestions(filtered)
 setShowDropdown(filtered.length > 0)
 setFocusedIdx(-1)
 }, [input, allTags])

 useEffect(() => {
 function handleClick(e: MouseEvent) {
 if (
 dropdownRef.current &&
 !dropdownRef.current.contains(e.target as Node) &&
 inputRef.current &&
 !inputRef.current.contains(e.target as Node)
 ) {
 setShowDropdown(false)
 }
 }
 document.addEventListener("mousedown", handleClick)
 return () => document.removeEventListener("mousedown", handleClick)
 }, [])

 async function addTag(tag: string) {
 const trimmed = tag.trim()
 if (!trimmed || tags.includes(trimmed)) return
 const next = [...tags, trimmed].join(", ")
 onChange(next)
 setInput("")
 setShowDropdown(false)

 if (tagType && !allTags.find((t) => t.name === trimmed)) {
 try {
 const res = await fetch("/api/tags", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ name: trimmed, type: tagType }),
 })
 if (res.ok) {
 const created = await res.json()
 setAllTags((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
 }
 } catch {}
 }
 }

 function removeTag(tag: string) {
 const next = tags.filter((t) => t !== tag).join(", ")
 onChange(next)
 }

 function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
 if (e.key === "Enter" || e.key === ",") {
 e.preventDefault()
 if (showDropdown && focusedIdx >= 0) {
 addTag(suggestions[focusedIdx].name)
 } else if (input.trim()) {
 addTag(input)
 }
 return
 }

 if (e.key === "ArrowDown") {
 e.preventDefault()
 setFocusedIdx((prev) => Math.min(prev + 1, suggestions.length - 1))
 return
 }

 if (e.key === "ArrowUp") {
 e.preventDefault()
 setFocusedIdx((prev) => Math.max(prev - 1, 0))
 return
 }

 if (e.key === "Escape") {
 setShowDropdown(false)
 setFocusedIdx(-1)
 return
 }

 if (e.key === "Backspace" && !input && tags.length > 0) {
 removeTag(tags[tags.length - 1])
 }
 }

 return (
 <div className={cn("relative", className)}>
 <div
 className={cn(
 "flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/50 transition-all duration-150 min-h-[38px]"
 )}
 >
 {tags.map((tag) => (
 <span
 key={tag}
 className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary text-xs font-medium px-2 py-0.5"
 >
 {tag}
 <button
 type="button"
 onClick={() => removeTag(tag)}
 className="hover:bg-primary/20 rounded-sm p-0.5 transition-colors"
 >
 </button>
 </span>
 ))}
 <div className="relative flex-1 min-w-[80px]">
 <input
 ref={inputRef}
 value={input}
 onChange={(e) => setInput(e.target.value)}
 onKeyDown={handleKeyDown}
 onFocus={() => {
 if (input.trim() && suggestions.length > 0) setShowDropdown(true)
 }}
 placeholder={tags.length === 0 ? (placeholder || "Type and press Enter...") : ""}
 className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
 />
 {loadingTags && (
 <div className="absolute right-0 top-1/2 -translate-y-1/2">
 <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
 </div>
 )}
 </div>
 </div>

 {showDropdown && (
 <div
 ref={dropdownRef}
 className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden"
 >
 {suggestions.map((s, i) => (
 <button
 key={s.id}
 type="button"
 className={cn(
 "flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors",
 i === focusedIdx ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
 )}
 onMouseDown={(e) => {
 e.preventDefault()
 addTag(s.name)
 }}
 onMouseEnter={() => setFocusedIdx(i)}
 >
 {s.name}
 </button>
 ))}
 </div>
 )}
 </div>
 )
}
