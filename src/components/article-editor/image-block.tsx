"use client"

import { useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ImageIcon, Upload, X } from "lucide-react"

interface ImageBlockProps {
  url?: string
  alt?: string
  caption?: string
  onChange: (data: { url?: string; alt?: string; caption?: string }) => void
  onDelete: () => void
}

export function ImageBlock({ url, alt, caption, onChange, onDelete }: ImageBlockProps) {
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
      onChange({ url: json.data?.url || json.url, alt: file.name })
    } catch {
      const reader = new FileReader()
      reader.onload = (e) => onChange({ url: e.target?.result as string, alt: file.name })
      reader.readAsDataURL(file)
    } finally {
      setUploading(false)
    }
  }, [onChange])

  if (url) {
    return (
      <div className="group relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt || ""}
          className="w-full rounded-lg border border-border/20 object-cover max-h-96"
        />
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="sm"
            className="h-7 text-xs"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-3" /> Replace
          </Button>
          <Button variant="destructive" size="sm" className="h-7" onClick={onDelete}>
            <X className="size-3" />
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        <input
          value={caption || ""}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="Add a caption..."
          className="mt-2 w-full text-sm text-center text-muted-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/30"
        />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        className="flex items-center justify-center gap-2 py-6 rounded-lg border-2 border-dashed border-border/40 hover:border-border/70 transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click() }}
      >
        {uploading ? (
          <>
            <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-sm">Uploading...</span>
          </>
        ) : (
          <>
            <ImageIcon className="size-5" />
            <span className="text-sm font-medium">Upload image</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                const url = window.prompt("Paste image URL:")
                if (url) onChange({ url })
              }}
              className="ml-1 text-xs text-muted-foreground/50 hover:text-muted-foreground underline underline-offset-2"
            >
              or paste URL
            </button>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}
