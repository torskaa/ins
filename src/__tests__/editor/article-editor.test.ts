import { describe, it, expect } from "vitest"
import {
  createBlock,
  serializeDocument,
  deserializeDocument,
  type Block,
} from "@/components/article-editor/types"
import { renderHook, act } from "@testing-library/react"
import { useArticleEditor } from "@/components/article-editor/use-article-editor"

// Helper to render React hooks
function renderUseArticleEditor(initialBlocks?: Block[]) {
  return renderHook(() => useArticleEditor(initialBlocks))
}

describe("createBlock", () => {
  it("creates a paragraph block", () => {
    const block = createBlock("paragraph", 0)
    expect(block.type).toBe("paragraph")
    expect(block.content).toBe("")
    expect(block.order).toBe(0)
    expect(block.id).toBeTruthy()
  })

  it("creates a heading block with default level 2", () => {
    const block = createBlock("heading", 1)
    expect(block.type).toBe("heading")
    expect(block.level).toBe(2)
    expect(block.content).toBe("")
  })

  it("creates an image block", () => {
    const block = createBlock("image", 2)
    expect(block.type).toBe("image")
    expect(block.url).toBe("")
  })

  it("creates a quote block", () => {
    const block = createBlock("quote", 3, { content: "Hello world" })
    expect(block.type).toBe("quote")
    expect(block.content).toBe("Hello world")
  })

  it("creates a code block", () => {
    const block = createBlock("code", 4, { content: "const x = 1", language: "javascript" })
    expect(block.type).toBe("code")
    expect(block.content).toBe("const x = 1")
    expect(block.language).toBe("javascript")
  })

  it("creates a divider block", () => {
    const block = createBlock("divider", 5)
    expect(block.type).toBe("divider")
  })

  it("creates a list block with one empty item", () => {
    const block = createBlock("list", 6)
    expect(block.type).toBe("list")
    expect(block.items).toEqual([""])
  })

  it("generates unique ids", () => {
    const a = createBlock("paragraph", 0)
    const b = createBlock("paragraph", 1)
    expect(a.id).not.toBe(b.id)
  })
})

describe("serializeDocument / deserializeDocument", () => {
  it("round-trips an article document", () => {
    const doc = {
      title: "Test",
      coverImage: "https://example.com/c.jpg",
      blocks: [
        createBlock("paragraph", 0, { content: "Hello" }),
        createBlock("image", 1, { url: "https://example.com/i.jpg" }),
        createBlock("divider", 2),
      ],
    }
    const json = serializeDocument(doc)
    const restored = deserializeDocument(json)
    expect(restored).not.toBeNull()
    expect(restored!.title).toBe("Test")
    expect(restored!.coverImage).toBe("https://example.com/c.jpg")
    expect(restored!.blocks).toHaveLength(3)
    expect(restored!.blocks[0].type).toBe("paragraph")
    expect(restored!.blocks[2].type).toBe("divider")
  })

  it("returns null for invalid JSON", () => {
    expect(deserializeDocument("")).toBeNull()
    expect(deserializeDocument("not json")).toBeNull()
    expect(deserializeDocument("{}")).toBeNull()
  })
})

describe("useArticleEditor", () => {
  it("starts with one paragraph block", () => {
    const { result } = renderUseArticleEditor()
    expect(result.current.blocks).toHaveLength(1)
    expect(result.current.blocks[0].type).toBe("paragraph")
    expect(result.current.title).toBe("")
    expect(result.current.coverImage).toBeNull()
  })

  it("addBlock adds a block after the specified block", () => {
    const { result } = renderUseArticleEditor()
    const firstId = result.current.blocks[0].id

    act(() => {
      result.current.addBlock("image", firstId)
    })

    expect(result.current.blocks).toHaveLength(2)
    expect(result.current.blocks[1].type).toBe("image")
    expect(result.current.blocks[0].order).toBe(0)
    expect(result.current.blocks[1].order).toBe(1)
  })

  it("addBlock appends when no afterId given", () => {
    const { result } = renderUseArticleEditor()

    act(() => {
      result.current.addBlock("heading")
    })

    expect(result.current.blocks).toHaveLength(2)
    expect(result.current.blocks[1].type).toBe("heading")
  })

  it("addBlock can add all block types", () => {
    const { result } = renderUseArticleEditor()
    const firstId = result.current.blocks[0].id

    act(() => { result.current.addBlock("heading", firstId) })
    act(() => { result.current.addBlock("image", firstId) })
    act(() => { result.current.addBlock("quote", firstId) })
    act(() => { result.current.addBlock("code", firstId) })
    act(() => { result.current.addBlock("divider", firstId) })
    act(() => { result.current.addBlock("list", firstId) })

    const types = result.current.blocks.map(b => b.type)
    expect(types).toContain("heading")
    expect(types).toContain("image")
    expect(types).toContain("quote")
    expect(types).toContain("code")
    expect(types).toContain("divider")
    expect(types).toContain("list")
  })

  it("removeBlock removes a block", () => {
    const { result } = renderUseArticleEditor()
    act(() => { result.current.addBlock("heading") })
    const headingId = result.current.blocks[1].id

    act(() => {
      result.current.removeBlock(headingId)
    })

    expect(result.current.blocks).toHaveLength(1)
    expect(result.current.blocks[0].type).toBe("paragraph")
  })

  it("removeBlock does not go below 1 block", () => {
    const { result } = renderUseArticleEditor()
    const id = result.current.blocks[0].id

    act(() => {
      result.current.removeBlock(id)
    })

    expect(result.current.blocks).toHaveLength(1)
    expect(result.current.blocks[0].type).toBe("paragraph")
  })

  it("updateBlock updates a block's content", () => {
    const { result } = renderUseArticleEditor()
    const id = result.current.blocks[0].id

    act(() => {
      result.current.updateBlock(id, { content: "Updated content" })
    })

    expect(result.current.blocks[0].content).toBe("Updated content")
  })

  it("updateBlock updates heading level", () => {
    const { result } = renderUseArticleEditor()
    act(() => { result.current.addBlock("heading") })
    const headingId = result.current.blocks[1].id

    act(() => {
      result.current.updateBlock(headingId, { level: 1 })
    })

    expect(result.current.blocks[1].level).toBe(1)
  })

  it("reorderBlocks moves a block up", () => {
    const { result } = renderUseArticleEditor()
    act(() => { result.current.addBlock("heading") })
    act(() => { result.current.addBlock("image") })

    // Move image (index 2) to position 1
    act(() => {
      result.current.reorderBlocks(2, 1)
    })

    expect(result.current.blocks[1].type).toBe("image")
    expect(result.current.blocks[2].type).toBe("heading")
  })

  it("reorderBlocks maintains correct order values", () => {
    const { result } = renderUseArticleEditor()
    act(() => { result.current.addBlock("heading") })
    act(() => { result.current.addBlock("image") })

    act(() => {
      result.current.reorderBlocks(2, 0)
    })

    result.current.blocks.forEach((b, i) => {
      expect(b.order).toBe(i)
    })
  })

  it("setTitle updates title", () => {
    const { result } = renderUseArticleEditor()
    act(() => {
      result.current.setTitle("My Article")
    })
    expect(result.current.title).toBe("My Article")
  })

  it("setCoverImage updates coverImage", () => {
    const { result } = renderUseArticleEditor()
    act(() => {
      result.current.setCoverImage("https://example.com/cover.jpg")
    })
    expect(result.current.coverImage).toBe("https://example.com/cover.jpg")

    act(() => {
      result.current.setCoverImage(null)
    })
    expect(result.current.coverImage).toBeNull()
  })

  it("accepts initial blocks", () => {
    const initial = [
      createBlock("heading", 0, { level: 1, content: "Title" }),
      createBlock("paragraph", 1, { content: "Body" }),
    ]
    const { result } = renderUseArticleEditor(initial)
    expect(result.current.blocks).toHaveLength(2)
    expect(result.current.blocks[0].content).toBe("Title")
    expect(result.current.blocks[1].content).toBe("Body")
  })

  it("maintains order after multiple add and remove operations", () => {
    const { result } = renderUseArticleEditor()

    act(() => { result.current.addBlock("heading") })
    act(() => { result.current.addBlock("image") })
    act(() => { result.current.addBlock("quote") })
    act(() => { result.current.addBlock("code") })

    // Remove image (index 2) should keep order sequential
    const imageId = result.current.blocks[2].id
    act(() => { result.current.removeBlock(imageId) })

    result.current.blocks.forEach((b, i) => {
      expect(b.order).toBe(i)
    })
    expect(result.current.blocks).toHaveLength(4)
  })
})
