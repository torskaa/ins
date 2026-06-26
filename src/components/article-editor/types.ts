export type BlockType =
  | "paragraph"
  | "heading"
  | "image"
  | "video"
  | "quote"
  | "code"
  | "divider"
  | "list"

export interface Block {
  id: string
  type: BlockType
  order: number
  content: string
  url?: string
  alt?: string
  caption?: string
  level?: 1 | 2 | 3
  items?: string[]
  language?: string
  listType?: "bullet" | "ordered"
}

export interface ArticleDocument {
  title: string
  coverImage?: string | null
  blocks: Block[]
}

export function createBlock(type: BlockType, order: number, overrides?: Partial<Block>): Block {
  const id = crypto.randomUUID?.() || Math.random().toString(36).slice(2)
  const base: Block = { id, type, order, content: "" }

  switch (type) {
    case "paragraph": return { ...base, content: "", ...overrides }
    case "heading": return { ...base, level: 2, content: "", ...overrides }
    case "image": return { ...base, url: "", ...overrides }
    case "video": return { ...base, url: "", ...overrides }
    case "quote": return { ...base, content: "", ...overrides }
    case "code": return { ...base, content: "", ...overrides }
    case "divider": return { ...base, ...overrides }
    case "list": return { ...base, items: [""], ...overrides }
    default: return { ...base, content: "", ...overrides }
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
