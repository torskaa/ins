"use client"

import { useRef, useCallback } from "react"
import { BlockEditor } from "./block-editor"
import { type Block, type BlockType } from "./types"

interface ArticleEditorProps {
  title: string
  blocks: Block[]
  coverImage: string | null
  onTitleChange: (title: string) => void
  onBlocksChange: (blocks: Block[]) => void
  onCoverImageChange: (url: string | null) => void
  onAddBlock: (type: BlockType, afterId?: string) => void
  onRemoveBlock: (id: string) => void
  onUpdateBlock: (id: string, updates: Partial<Block>) => void
  onReorder: (fromIndex: number, toIndex: number) => void
}

export function ArticleEditor({
  title,
  blocks,
  coverImage,
  onTitleChange,
  onBlocksChange,
  onCoverImageChange,
  onAddBlock,
  onRemoveBlock,
  onUpdateBlock,
  onReorder,
}: ArticleEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCoverUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const json = await res.json()
      onCoverImageChange(json.data?.url || json.url)
    } catch {
      const reader = new FileReader()
      reader.onload = (e) => onCoverImageChange(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }, [onCoverImageChange])

  function handleCoverPasteUrl() {
    const url = window.prompt("Paste cover image URL:")
    if (url) onCoverImageChange(url)
  }

  return (
    <div className="w-full">
      {/* Title */}
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Title"
        className="w-full text-4xl font-bold tracking-tight text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/20 pb-1 mb-8"
      />

      {/* Cover Image */}
      <div className="mb-10">
        {coverImage ? (
          <div className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt="Cover"
              className="w-full aspect-[2/1] object-cover rounded-xl border border-border/10"
            />
            <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 px-3 rounded-lg bg-background/90 backdrop-blur-sm text-sm text-foreground border border-border/30 hover:bg-background transition-colors"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => onCoverImageChange(null)}
                className="size-8 flex items-center justify-center rounded-lg bg-background/90 backdrop-blur-sm text-muted-foreground border border-border/30 hover:text-destructive transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-border/30 hover:border-border/60 transition-colors text-muted-foreground/50 hover:text-muted-foreground cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click() }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="group-hover:text-primary transition-colors">
              <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
              <path d="M3 14l3-3 2 2 4-4 5 5v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-1z" fill="currentColor" opacity="0.5" />
            </svg>
            <span className="text-sm font-medium">Add a cover image</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); handleCoverPasteUrl() }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); handleCoverPasteUrl() } }}
              className="ml-1 text-xs text-muted-foreground/40 hover:text-muted-foreground underline underline-offset-2 cursor-pointer"
            >
              or paste URL
            </span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f) }}
        />
      </div>

      {/* Blocks */}
      <BlockEditor
        blocks={blocks}
        onChange={onBlocksChange}
        onAddBlock={onAddBlock}
        onRemoveBlock={onRemoveBlock}
        onUpdateBlock={onUpdateBlock}
        onReorder={onReorder}
      />

      {/* Add block at the bottom */}
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={() => onAddBlock("paragraph")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
        >
          <span className="size-5 rounded-full border border-border/40 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          Add block
        </button>
      </div>
    </div>
  )
}
