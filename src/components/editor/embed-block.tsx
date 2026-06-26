"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Video, Link, Trash2 } from "lucide-react"

interface EmbedBlockProps {
  url: string
  caption?: string
  provider?: string
  onChange: (data: { url: string; caption?: string; provider?: string }) => void
  onDelete?: () => void
}

const EMBED_PROVIDERS = [
  { pattern: /youtube\.com|youtu\.be/, provider: "youtube" },
  { pattern: /vimeo\.com/, provider: "vimeo" },
  { pattern: /twitter\.com|x\.com/, provider: "twitter" },
]

function detectProvider(url: string): string | undefined {
  const match = EMBED_PROVIDERS.find((p) => p.pattern.test(url))
  return match?.provider
}

function getEmbedUrl(url: string, provider?: string): string {
  if (!provider || provider === "generic") return url
  if (provider === "youtube") {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    if (match) return `https://www.youtube.com/embed/${match[1]}`
  }
  if (provider === "vimeo") {
    const match = url.match(/vimeo\.com\/(\d+)/)
    if (match) return `https://player.vimeo.com/video/${match[1]}`
  }
  return url
}

export function EmbedBlock({ url, caption, provider, onChange, onDelete }: EmbedBlockProps) {
  const [showInput, setShowInput] = useState(!url)

  if (showInput || !url) {
    return (
      <div className="space-y-2 py-2">
        <div className="flex items-center gap-2">
          <Input
            value={url}
            onChange={(e) => {
              const val = e.target.value
              const p = detectProvider(val)
              onChange({ url: val, provider: p })
            }}
            placeholder="Paste embed URL (YouTube, Vimeo, Twitter...)"
            className="h-9 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && url) setShowInput(false)
              if (e.key === "Escape") { setShowInput(false); onDelete?.() }
            }}
          />
          <Button
            variant="secondary"
            size="sm"
            className="h-9 shrink-0"
            onClick={() => { if (url) setShowInput(false) }}
            disabled={!url}
          >
            Embed
          </Button>
        </div>
      </div>
    )
  }

  const embedUrl = getEmbedUrl(url, provider)

  return (
    <div className="group relative my-4">
      <div className="aspect-video rounded-lg overflow-hidden border border-border/20 bg-muted/30">
        <iframe
          src={embedUrl}
          title={caption || "Embedded content"}
          className="w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
      <input
        value={caption || ""}
        onChange={(e) => onChange({ url, caption: e.target.value, provider })}
        placeholder="Add caption..."
        className="w-full text-center text-sm text-muted-foreground bg-transparent border-none outline-none mt-1.5 placeholder:text-muted-foreground/30"
      />
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="secondary"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => setShowInput(true)}
        >
          <Link className="size-3" /> Change URL
        </Button>
        <Button variant="destructive" size="sm" className="h-7" onClick={onDelete}>
          <Trash2 className="size-3" />
        </Button>
      </div>
    </div>
  )
}
