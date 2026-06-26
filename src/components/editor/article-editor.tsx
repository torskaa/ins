"use client"

import { useRef, useCallback, useState } from "react"
import { BlockEditor } from "./block-editor"
import { type Block, createBlock } from "./types"
import { CoverImage } from "./block-renderer"
import { ImageIcon, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ArticleEditorProps {
  blocks?: Block[]
  coverImage?: string | null
  onBlocksChange: (blocks: Block[]) => void
  onCoverImageChange?: (url: string | null) => void
  className?: string
}

export function ArticleEditor({
  blocks = [createBlock("paragraph")],
  coverImage,
  onBlocksChange,
  onCoverImageChange,
  className,
}: ArticleEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const json = await res.json()
      onCoverImageChange?.(json.data?.url || json.url)
    } catch {
      const reader = new FileReader()
      reader.onload = (e) => onCoverImageChange?.(e.target?.result as string)
      reader.readAsDataURL(file)
    } finally {
      setUploading(false)
    }
  }, [onCoverImageChange])

  function handlePasteUrl() {
    const url = window.prompt("Paste image URL:")
    if (url) onCoverImageChange?.(url)
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Cover image */}
      {coverImage ? (
        <div className="relative group mb-6">
          <CoverImage url={coverImage} className="mb-0" />
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-3" /> Replace
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-7"
              onClick={() => onCoverImageChange?.(null)}
            >
              <X className="size-3" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-6 rounded-lg border-2 border-dashed border-border/40 hover:border-border/70 transition-colors text-muted-foreground hover:text-foreground group"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-sm">Uploading...</span>
              </>
            ) : (
              <>
                <ImageIcon className="size-5 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
                <span className="text-sm font-medium">Add a cover image</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); handlePasteUrl() }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); handlePasteUrl() } }}
                  className="ml-1 text-xs text-muted-foreground/50 hover:text-muted-foreground underline underline-offset-2 transition-colors cursor-pointer"
                >
                  or paste URL
                </span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
        </div>
      )}

      {/* Blocks */}
      <BlockEditor
        blocks={blocks}
        onChange={onBlocksChange}
      />
    </div>
  )
}
