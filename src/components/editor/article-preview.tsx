"use client"

import { User, Clock } from "lucide-react"
import { SemanticBadge } from "@/components/ui/badge"
import { type Block, deserializeDocument } from "./types"
import { BlockRenderer, CoverImage } from "./block-renderer"

interface ArticlePreviewProps {
  title: string
  content?: string
  blocks?: Block[]
  coverImage?: string | null
  author?: string
  readTime?: string
  category?: string
  excerpt?: string
}

export function ArticlePreview({ title, content, blocks: propBlocks, coverImage, author, readTime, category, excerpt }: ArticlePreviewProps) {
  let blocks = propBlocks

  if (!blocks && content) {
    const doc = deserializeDocument(content)
    if (doc && doc.blocks.length > 0) {
      blocks = doc.blocks
      if (!coverImage) coverImage = doc.coverImage
    }
  }

  const hasContent = blocks && blocks.length > 0

  return (
    <article className="max-w-2xl mx-auto py-8">
      <CoverImage url={coverImage} />

      <header className="mb-10">
        {category && (
          <div className="mb-4">
            <SemanticBadge semantic={category} category="category">{category}</SemanticBadge>
          </div>
        )}
        <h1 className="text-4xl font-bold tracking-tight text-foreground leading-tight mb-4">
          {title}
        </h1>
        {excerpt && (
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            {excerpt}
          </p>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User className="size-3.5" />
            {author || "Admin"}
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {readTime || "3 min"} read
          </span>
        </div>
      </header>

      {hasContent ? (
        <div className="space-y-4">
          {blocks!.map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
        </div>
      ) : content ? (
        <div
          className="prose prose-base max-w-none
            prose-headings:font-semibold prose-headings:tracking-tight
            prose-h1:text-3xl prose-h1:mt-10 prose-h1:mb-4
            prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3
            prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-2
            prose-p:leading-relaxed prose-p:text-foreground/80
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-primary prose-blockquote:bg-muted/20 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
            prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
            prose-pre:bg-muted/80 prose-pre:rounded-lg prose-pre:border prose-pre:border-border/50
            prose-img:rounded-lg prose-img:border prose-img:border-border/30
            prose-ul:list-disc prose-ol:list-decimal
            prose-li:marker:text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <p className="text-muted-foreground italic">No content</p>
      )}
    </article>
  )
}
