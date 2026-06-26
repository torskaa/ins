"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ExternalLink } from "lucide-react"

interface OgData {
  title: string | null
  description: string | null
  image: string | null
  favicon: string | null
}

interface LinkPreviewProps {
  url: string
  position: { x: number; y: number } | null
}

export function LinkPreview({ url, position }: LinkPreviewProps) {
  const [og, setOg] = useState<OgData | null>(null)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (!position) return
    let cancelled = false
    const hostname = new URL(url).hostname
    setOg({
      title: hostname,
      description: null,
      image: null,
      favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
    })
    setImageError(false)
    fetch(`/api/og?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setOg(data)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [url, position])

  if (!position) return null

  return (
    <AnimatePresence>
      {position && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="fixed z-[999] w-72 overflow-hidden rounded-xl border bg-popover shadow-xl"
          style={{ left: position.x, top: position.y }}
        >
          {/* Preview image */}
          <div className="relative h-36 bg-muted overflow-hidden">
            {og?.image && !imageError ? (
              <img
                src={og.image}
                alt=""
                className="size-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <div className="size-12 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                  <ExternalLink className="size-5 text-muted-foreground/40" />
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-3 space-y-1.5">
            <div className="flex items-center gap-2">
              {og?.favicon && (
                <img src={og.favicon} alt="" className="size-4 rounded shrink-0" />
              )}
              <span className="text-xs text-muted-foreground truncate">
                {new URL(url).hostname}
              </span>
            </div>
            {og?.title && (
              <p className="text-sm font-medium leading-snug line-clamp-2">{og.title}</p>
            )}
            {og?.description && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {og.description}
              </p>
            )}
            <div className="pt-1">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => window.open(url, "_blank")}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors"
              >
                Open link
                <ExternalLink className="size-3" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
