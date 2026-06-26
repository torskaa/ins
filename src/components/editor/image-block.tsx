"use client"

import { useState, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { ImageIcon, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageBlockProps {
  url: string
  alt?: string
  caption?: string
  onChange: (data: { url: string; alt?: string; caption?: string }) => void
  onDelete?: () => void
}

export function ImageBlock({ url, alt, caption, onChange, onDelete }: ImageBlockProps) {
  const inputRef = useRef<HTMLInputElement>(null)
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
      const uploadedUrl = json.data?.url || json.url
      onChange({ url: uploadedUrl, alt: file.name })
    } catch {
      const reader = new FileReader()
      reader.onload = (e) => onChange({ url: e.target?.result as string, alt: file.name })
      reader.readAsDataURL(file)
    } finally {
      setUploading(false)
    }
  }, [onChange])

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) handleFile(file)
      }
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0]
    if (file) handleFile(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  if (!url) {
    return (
      <div
        className={cn(
          "relative border-2 border-dashed border-border/50 rounded-lg p-8 text-center transition-colors",
          uploading && "opacity-60 pointer-events-none",
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onPaste={handlePaste}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center">
                <ImageIcon className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Add an image</p>
                <p className="text-xs">Click to browse, drag & drop, or paste</p>
              </div>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
            <Button variant="outline" size="sm" className="mt-3" onClick={() => inputRef.current?.click()}>
              <Upload className="size-3.5 mr-1.5" /> Upload Image
            </Button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="group relative">
      <figure className="space-y-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt || ""}
          className="w-full rounded-lg object-cover max-h-[500px] border border-border/20"
          onDoubleClick={() => onChange({ url: "", alt })} // click to replace
        />
        {caption !== undefined && (
          <input
            value={caption || ""}
            onChange={(e) => onChange({ url, alt, caption: e.target.value })}
            placeholder="Add a caption..."
            className="w-full text-center text-sm text-muted-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/30"
          />
        )}
      </figure>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button
          variant="secondary"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-3" /> Replace
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="h-7"
          onClick={onDelete}
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}
