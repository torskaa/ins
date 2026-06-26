"use client"

export type BlockType = "paragraph" | "heading" | "image" | "quote" | "code" | "divider" | "list" | "bulletList" | "embed" | "checklist" | "cover_image"

export interface BaseBlock {
  id: string
  type: BlockType
}

export interface ParagraphBlock extends BaseBlock {
  type: "paragraph"
  content: string
}

export interface HeadingBlock extends BaseBlock {
  type: "heading"
  level: 1 | 2 | 3
  content: string
}

export interface ImageBlock extends BaseBlock {
  type: "image"
  url: string
  alt?: string
  caption?: string
}

export interface CoverImageBlock extends BaseBlock {
  type: "cover_image"
  url: string
  alt?: string
}

export interface QuoteBlock extends BaseBlock {
  type: "quote"
  content: string
}

export interface CodeBlock extends BaseBlock {
  type: "code"
  content: string
  language?: string
}

export interface DividerBlock extends BaseBlock {
  type: "divider"
}

export interface ListBlock extends BaseBlock {
  type: "list" | "bulletList"
  items: string[]
}

export interface EmbedBlock extends BaseBlock {
  type: "embed"
  url: string
  provider?: "youtube" | "vimeo" | "twitter" | "generic"
  caption?: string
}

export interface ChecklistBlock extends BaseBlock {
  type: "checklist"
  items: { id: string; text: string; checked: boolean }[]
}

export type Block = ParagraphBlock | HeadingBlock | ImageBlock | CoverImageBlock | QuoteBlock | CodeBlock | DividerBlock | ListBlock | EmbedBlock | ChecklistBlock

export interface ArticleDocument {
  title: string
  coverImage?: string
  blocks: Block[]
}

export interface BlockMenuOption {
  type: BlockType
  label: string
  description: string
  icon: React.ReactNode
}

export function createBlock(type: BlockType, overrides?: Partial<Block>): Block {
  const id = crypto.randomUUID?.() || Math.random().toString(36).slice(2)
  const base = { id }
  switch (type) {
    case "paragraph": return { ...base, type, content: "", ...overrides } as ParagraphBlock
    case "heading": return { ...base, type, level: 2, content: "", ...overrides } as HeadingBlock
    case "image": return { ...base, type, url: "", ...overrides } as ImageBlock
    case "cover_image": return { ...base, type, url: "", ...overrides } as CoverImageBlock
    case "quote": return { ...base, type, content: "", ...overrides } as QuoteBlock
    case "code": return { ...base, type, content: "", ...overrides } as CodeBlock
    case "divider": return { ...base, type, ...overrides } as DividerBlock
    case "list":
    case "bulletList": return { ...base, type, items: [""], ...overrides } as ListBlock
    case "embed": return { ...base, type, url: "", ...overrides } as EmbedBlock
    case "checklist": return { ...base, type, items: [], ...overrides } as ChecklistBlock
    default: return { ...base, type: "paragraph", content: "", ...overrides } as ParagraphBlock
  }
}

export function serializeDocument(doc: ArticleDocument): string {
  return JSON.stringify(doc)
}

export function deserializeDocument(json: string): ArticleDocument | null {
  try {
    const doc = JSON.parse(json)
    if (doc && typeof doc === "object" && Array.isArray(doc.blocks)) {
      return doc as ArticleDocument
    }
    return null
  } catch {
    return null
  }
}

export function blocksToHtml(blocks: Block[]): string {
  return blocks.map(blockToHtml).join("\n")
}

export function blockToHtml(block: Block): string {
  switch (block.type) {
    case "paragraph": return `<p>${block.content}</p>`
    case "heading": return `<h${block.level}>${block.content}</h${block.level}>`
    case "image": return `<figure><img src="${block.url}" alt="${block.alt || ""}" />${block.caption ? `<figcaption>${block.caption}</figcaption>` : ""}</figure>`
    case "cover_image": return `<figure class="cover-image"><img src="${block.url}" alt="${block.alt || ""}" /></figure>`
    case "quote": return `<blockquote><p>${block.content}</p></blockquote>`
    case "code": return `<pre><code${block.language ? ` class="language-${block.language}"` : ""}>${block.content}</code></pre>`
    case "divider": return `<hr />`
    case "list":
    case "bulletList": {
      const tag = block.type === "list" ? "ol" : "ul"
      return `<${tag}>${block.items.map(i => `<li>${i}</li>`).join("")}</${tag}>`
    }
    case "embed": {
      const providerClass = block.provider && block.provider !== "generic" ? ` class="embed-${block.provider}"` : ""
      return `<div${providerClass}><iframe src="${block.url}" frameborder="0" allowfullscreen></iframe>${block.caption ? `<figcaption>${block.caption}</figcaption>` : ""}</div>`
    }
    case "checklist": {
      return `<ul class="checklist">${block.items.map(i => `<li class="${i.checked ? "checked" : ""}"><input type="checkbox" ${i.checked ? "checked" : ""} />${i.text}</li>`).join("")}</ul>`
    }
    default: return ""
  }
}
