import { type Block } from "./types"

interface PreviewRendererProps {
  blocks: Block[]
  coverImage?: string | null
}

export function PreviewRenderer({ blocks, coverImage }: PreviewRendererProps) {
  return (
    <article className="max-w-[680px] mx-auto px-4">
      {coverImage && (
        <div className="mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImage}
            alt="Cover"
            className="w-full aspect-[2/1] object-cover rounded-xl border border-border/10"
          />
        </div>
      )}

      <div className="space-y-6">
        {blocks.map((block) => (
          <div key={block.id}>
            {block.type === "paragraph" && (
              <p
                className="text-lg leading-relaxed text-foreground/90"
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            )}
            {block.type === "heading" && (
              <h2
                className={
                  block.level === 1
                    ? "text-3xl font-bold tracking-tight"
                    : block.level === 2
                    ? "text-2xl font-bold tracking-tight"
                    : "text-xl font-semibold tracking-tight"
                }
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            )}
            {block.type === "image" && (
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.url}
                  alt={block.alt || ""}
                  className="w-full rounded-lg border border-border/10"
                />
                {block.caption && (
                  <figcaption className="mt-2 text-sm text-center text-muted-foreground">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            )}
            {block.type === "quote" && (
              <blockquote className="border-l-2 border-primary/30 pl-6 italic text-lg text-muted-foreground">
                <p dangerouslySetInnerHTML={{ __html: block.content }} />
              </blockquote>
            )}
            {block.type === "code" && (
              <pre className="bg-muted/30 rounded-lg p-4 overflow-x-auto border border-border/20">
                <code className="text-sm font-mono leading-relaxed">
                  {block.content}
                </code>
              </pre>
            )}
            {block.type === "divider" && (
              <hr className="border-t border-border/30" />
            )}
            {block.type === "list" && (
              <ol className="space-y-2 list-decimal pl-6 text-lg text-foreground/90">
                {(block.items || []).map((item, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                ))}
              </ol>
            )}
          </div>
        ))}
      </div>
    </article>
  )
}
