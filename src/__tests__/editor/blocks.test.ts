import { describe, it, expect } from "vitest"
import {
  createBlock,
  serializeDocument,
  deserializeDocument,
  blocksToHtml,
  type Block,
  type ParagraphBlock,
  type ArticleDocument,
} from "@/components/editor/types"

describe("createBlock", () => {
  it("creates a paragraph block with default content", () => {
    const block = createBlock("paragraph") as ParagraphBlock
    expect(block.type).toBe("paragraph")
    expect(block.content).toBe("")
    expect(block.id).toBeTruthy()
  })

  it("creates a heading block with default level 2", () => {
    const block = createBlock("heading")
    expect(block.type).toBe("heading")
    if (block.type === "heading") {
      expect(block.level).toBe(2)
    }
  })

  it("creates an image block with empty url", () => {
    const block = createBlock("image")
    expect(block.type).toBe("image")
    if (block.type === "image") {
      expect(block.url).toBe("")
    }
  })

  it("creates a cover_image block", () => {
    const block = createBlock("cover_image")
    expect(block.type).toBe("cover_image")
    if (block.type === "cover_image") {
      expect(block.url).toBe("")
    }
  })

  it("creates an embed block", () => {
    const block = createBlock("embed")
    expect(block.type).toBe("embed")
    if (block.type === "embed") {
      expect(block.url).toBe("")
    }
  })

  it("creates a checklist block with empty items", () => {
    const block = createBlock("checklist")
    expect(block.type).toBe("checklist")
    if (block.type === "checklist") {
      expect(block.items).toEqual([])
    }
  })

  it("creates a quote block", () => {
    const block = createBlock("quote", { content: "Hello world" })
    expect(block.type).toBe("quote")
    if (block.type === "quote") {
      expect(block.content).toBe("Hello world")
    }
  })

  it("creates a code block", () => {
    const block = createBlock("code", { content: "const x = 1" })
    expect(block.type).toBe("code")
    if (block.type === "code") {
      expect(block.content).toBe("const x = 1")
    }
  })

  it("creates a divider block", () => {
    const block = createBlock("divider")
    expect(block.type).toBe("divider")
  })

  it("creates a list block with one empty item", () => {
    const block = createBlock("list")
    expect(block.type).toBe("list")
    if (block.type === "list" || block.type === "bulletList") {
      expect(block.items).toEqual([""])
    }
  })

  it("creates a bulletList block", () => {
    const block = createBlock("bulletList")
    expect(block.type).toBe("bulletList")
    if (block.type === "bulletList") {
      expect(block.items).toEqual([""])
    }
  })

  it("applies overrides", () => {
    const block = createBlock("paragraph", { content: "Override content" }) as ParagraphBlock
    expect(block.content).toBe("Override content")
  })

  it("generates unique ids for each block", () => {
    const a = createBlock("paragraph")
    const b = createBlock("paragraph")
    expect(a.id).not.toBe(b.id)
  })
})

describe("serializeDocument / deserializeDocument", () => {
  it("serializes and deserializes an article document", () => {
    const doc: ArticleDocument = {
      title: "Test Article",
      coverImage: "https://example.com/cover.jpg",
      blocks: [
        createBlock("paragraph", { content: "Hello" }),
        createBlock("heading", { level: 2, content: "Section" }),
        createBlock("image", { url: "https://example.com/img.jpg", caption: "A photo" }),
      ],
    }
    const json = serializeDocument(doc)
    const restored = deserializeDocument(json)
    expect(restored).not.toBeNull()
    expect(restored!.title).toBe("Test Article")
    expect(restored!.coverImage).toBe("https://example.com/cover.jpg")
    expect(restored!.blocks).toHaveLength(3)
    expect(restored!.blocks[0].type).toBe("paragraph")
    expect(restored!.blocks[1].type).toBe("heading")
    expect(restored!.blocks[2].type).toBe("image")
  })

  it("deserializes cover_image and embed blocks", () => {
    const doc: ArticleDocument = {
      title: "Rich Article",
      blocks: [
        createBlock("cover_image", { url: "https://example.com/cover.jpg" }),
        createBlock("embed", { url: "https://youtube.com/watch?v=abc123", provider: "youtube" }),
        createBlock("checklist", { items: [{ id: "1", text: "Task 1", checked: false }] }),
      ],
    }
    const json = serializeDocument(doc)
    const restored = deserializeDocument(json)
    expect(restored!.blocks[0].type).toBe("cover_image")
    expect(restored!.blocks[1].type).toBe("embed")
    expect(restored!.blocks[2].type).toBe("checklist")
  })

  it("returns null for invalid JSON", () => {
    expect(deserializeDocument("")).toBeNull()
    expect(deserializeDocument("not json")).toBeNull()
    expect(deserializeDocument("{}")).toBeNull()
    expect(deserializeDocument('{"blocks": "not array"}')).toBeNull()
  })
})

describe("blocksToHtml", () => {
  it("converts all block types to HTML", () => {
    const blocks: Block[] = [
      createBlock("paragraph", { content: "<strong>Bold</strong> text" }),
      createBlock("heading", { level: 1, content: "Title" }),
      createBlock("image", { url: "/img.png", alt: "Alt text", caption: "Caption" }),
      createBlock("cover_image", { url: "/cover.png" }),
      createBlock("quote", { content: "A quote" }),
      createBlock("code", { content: "const x = 1", language: "javascript" }),
      createBlock("divider"),
      createBlock("list", { items: ["Item 1", "Item 2"] }),
      createBlock("bulletList", { items: ["Bullet 1"] }),
      createBlock("embed", { url: "https://youtube.com/embed/abc", provider: "youtube", caption: "Video" }),
      createBlock("checklist", { items: [{ id: "1", text: "Done", checked: true }] }),
    ]
    const html = blocksToHtml(blocks)

    expect(html).toContain("<p>")
    expect(html).toContain("<strong>Bold</strong>")
    expect(html).toContain("<h1>")
    expect(html).toContain("<figure><img")
    expect(html).toContain("cover-image")
    expect(html).toContain("<blockquote>")
    expect(html).toContain("<pre><code")
    expect(html).toContain("language-javascript")
    expect(html).toContain("<hr />")
    expect(html).toContain("<ol>")
    expect(html).toContain("<ul>")
    expect(html).toContain("checklist")
    expect(html).toContain("checked")
    expect(html).toContain("Video")
  })
})

describe("reorder simulation", () => {
  it("array order can be changed to simulate block reorder", () => {
    const blocks: ParagraphBlock[] = [
      createBlock("paragraph", { content: "First" }) as ParagraphBlock,
      createBlock("paragraph", { content: "Second" }) as ParagraphBlock,
      createBlock("paragraph", { content: "Third" }) as ParagraphBlock,
    ]

    // Simulate moving "Third" to position 1 (swap with "Second")
    const idx = blocks.findIndex((b) => b.content === "Third")
    const targetIdx = 1
    const reordered = [...blocks]
    reordered.splice(targetIdx, 0, reordered.splice(idx, 1)[0])

    expect(reordered[1].content).toBe("Third")
    expect(reordered[2].content).toBe("Second")
    expect(reordered).toHaveLength(3)
  })

  it("arrayMove utility works correctly", () => {
    const blocks: ParagraphBlock[] = [
      createBlock("paragraph", { content: "A" }) as ParagraphBlock,
      createBlock("paragraph", { content: "B" }) as ParagraphBlock,
      createBlock("paragraph", { content: "C" }) as ParagraphBlock,
    ]

    const arrayMove = (arr: ParagraphBlock[], from: number, to: number) => {
      const result = [...arr]
      const [removed] = result.splice(from, 1)
      result.splice(to, 0, removed)
      return result
    }

    const moved = arrayMove(blocks, 2, 0)
    expect(moved[0].content).toBe("C")
    expect(moved[1].content).toBe("A")
    expect(moved[2].content).toBe("B")
  })
})
