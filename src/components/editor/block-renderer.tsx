"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { type Block } from "./types"
import { cn } from "@/lib/utils"

interface BlockRendererProps {
  block: Block
  className?: string
}

export function BlockRenderer({ block, className }: BlockRendererProps) {
  switch (block.type) {
    case "paragraph":
      return (
        <p
          className={cn("text-base leading-relaxed text-foreground/80 mb-4", className)}
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      )
    case "heading": {
      const H = `h${block.level}` as "h1" | "h2" | "h3"
      return (
        <H
          className={cn(
            "font-semibold tracking-tight",
            block.level === 1 && "text-3xl mt-10 mb-4",
            block.level === 2 && "text-2xl mt-8 mb-3",
            block.level === 3 && "text-xl mt-6 mb-2",
            className,
          )}
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      )
    }
    case "image":
      return (
        <figure className="my-6 space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.url}
            alt={block.alt || ""}
            className="w-full rounded-lg border border-border/20"
          />
          {block.caption && (
            <figcaption className="text-center text-sm text-muted-foreground">
              {block.caption}
            </figcaption>
          )}
        </figure>
      )
    case "cover_image":
      return (
        <div className="w-full rounded-xl overflow-hidden border border-border/20 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.url}
            alt={block.alt || "Cover"}
            className="w-full aspect-[2/1] object-cover"
          />
        </div>
      )
    case "quote":
      return (
        <blockquote className={cn("border-l-2 border-primary pl-4 italic text-muted-foreground my-6", className)}>
          <p dangerouslySetInnerHTML={{ __html: block.content }} />
        </blockquote>
      )
    case "code":
      return (
        <pre className="bg-muted/80 rounded-lg p-4 overflow-x-auto border border-border/30 my-6">
          <code className="text-sm font-mono leading-relaxed" dangerouslySetInnerHTML={{ __html: block.content }} />
        </pre>
      )
    case "divider":
      return <hr className="my-8 border-t border-border/40" />
    case "list":
    case "bulletList": {
      const ListTag = block.type === "list" ? "ol" : "ul"
      return (
        <ListTag className={cn("my-4 pl-6", block.type === "list" ? "list-decimal" : "list-disc", className)}>
          {block.items.map((item, i) => (
            <li
              key={i}
              className="text-base leading-relaxed text-foreground/80 mb-1"
              dangerouslySetInnerHTML={{ __html: item }}
            />
          ))}
        </ListTag>
      )
    }
    case "embed": {
      return (
        <div className="my-6 space-y-2">
          <div className="aspect-video rounded-lg overflow-hidden border border-border/20 bg-muted/30">
            <iframe
              src={block.url}
              title={block.caption || "Embedded content"}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
          {block.caption && (
            <figcaption className="text-center text-sm text-muted-foreground">
              {block.caption}
            </figcaption>
          )}
        </div>
      )
    }
    case "checklist": {
      return (
        <div className="my-4 space-y-2">
          {block.items.map((item) => (
            <div key={item.id} className="flex items-start gap-2.5">
              <Checkbox
                id={`check-${item.id}`}
                checked={item.checked}
                disabled
                className="mt-0.5"
              />
              <Label
                htmlFor={`check-${item.id}`}
                className={cn(
                  "text-base leading-relaxed",
                  item.checked && "line-through text-muted-foreground",
                )}
              >
                {item.text}
              </Label>
            </div>
          ))}
        </div>
      )
    }
    default:
      return null
  }
}

interface CoverImageProps {
  url?: string | null
  alt?: string
  className?: string
}

export function CoverImage({ url, alt, className }: CoverImageProps) {
  if (!url) return null
  return (
    <div className={cn("w-full rounded-xl overflow-hidden border border-border/20 mb-8", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt || "Cover image"}
        className="w-full aspect-[2/1] object-cover"
      />
    </div>
  )
}
