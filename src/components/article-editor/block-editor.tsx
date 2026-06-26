"use client"

import { useRef, useState, useCallback } from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { BlockItem } from "./block-item"
import { ParagraphBlock } from "./paragraph-block"
import { HeadingBlock } from "./heading-block"
import { ImageBlock } from "./image-block"
import { VideoBlock } from "./video-block"
import { AddBlockMenu } from "./add-block-menu"
import { BlockToolbar } from "./block-toolbar"
import { type Block, type BlockType, createBlock } from "./types"
import { cn } from "@/lib/utils"

interface BlockEditorProps {
  blocks: Block[]
  onChange: (blocks: Block[]) => void
  onAddBlock: (type: BlockType, afterId?: string) => void
  onRemoveBlock: (id: string) => void
  onUpdateBlock: (id: string, updates: Partial<Block>) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  className?: string
}

export function BlockEditor({
  blocks,
  onChange,
  onAddBlock,
  onRemoveBlock,
  onUpdateBlock,
  onReorder,
  className,
}: BlockEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<Element | null>(null)
  const [pendingInsertAfter, setPendingInsertAfter] = useState<string | null>(null)
  const [slashTarget, setSlashTarget] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = blocks.findIndex((b) => b.id === active.id)
      const newIndex = blocks.findIndex((b) => b.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return
      onReorder(oldIndex, newIndex)
    },
    [blocks, onReorder]
  )

  const openAddMenu = useCallback((anchor: Element, afterId?: string) => {
    setMenuAnchor(anchor)
    setPendingInsertAfter(afterId || null)
    setMenuOpen(true)
  }, [])

  const handleMenuSelect = useCallback(
    (type: BlockType) => {
      if (slashTarget) {
        onAddBlock(type, slashTarget)
        onRemoveBlock(slashTarget)
        setSlashTarget(null)
      } else {
        onAddBlock(type, pendingInsertAfter || undefined)
      }
      setMenuOpen(false)
      setPendingInsertAfter(null)

      requestAnimationFrame(() => {
        const container = editorRef.current
        if (!container) return
        const editable = container.querySelectorAll<HTMLElement>('[contenteditable="true"]')
        const last = editable[editable.length - 1]
        if (last) {
          last.focus()
          const range = document.createRange()
          range.selectNodeContents(last)
          range.collapse(false)
          const sel = window.getSelection()
          if (sel) {
            sel.removeAllRanges()
            sel.addRange(range)
          }
        }
      })
    },
    [slashTarget, pendingInsertAfter, onAddBlock, onRemoveBlock]
  )

  const handleParagraphSlash = useCallback((id: string, el: Element) => {
    setSlashTarget(id)
    setMenuAnchor(el)
    setMenuOpen(true)
  }, [])

  function mergeWithPrevious(id: string) {
    const idx = blocks.findIndex((b) => b.id === id)
    if (idx <= 0) return
    onRemoveBlock(id)
  }

  function handlePasteBlocks(blockId: string, pasteBlocks: Array<{ type: BlockType | "list" | "code" | "quote" | "divider"; content?: string; level?: number; items?: string[]; language?: string; listType?: "bullet" | "ordered" }>) {
    const idx = blocks.findIndex((b) => b.id === blockId)
    if (idx === -1) return
    const newBlocks = pasteBlocks.map((pb, i) => {
      return createBlock(pb.type as BlockType, idx + i, {
        content: pb.content,
        level: pb.type === "heading" ? (pb.level as 1|2|3) || 2 : undefined,
        items: pb.type === "list" ? pb.items || [""] : undefined,
        language: pb.type === "code" ? pb.language || "plaintext" : undefined,
        listType: pb.type === "list" ? (pb.listType || "bullet") : undefined,
      })
    })
    const updated = [...blocks]
    updated.splice(idx, 1, ...newBlocks)
    onChange(updated)
    requestAnimationFrame(() => {
      const container = editorRef.current
      if (!container) return
      const editables = container.querySelectorAll<HTMLElement>('[contenteditable="true"]')
      const last = editables[editables.length - 1]
      if (last) {
        last.focus()
        const range = document.createRange()
        range.selectNodeContents(last)
        range.collapse(false)
        const sel = window.getSelection()
        if (sel) {
          sel.removeAllRanges()
          sel.addRange(range)
        }
      }
    })
  }

  return (
    <div ref={editorRef} className={cn("relative", className)}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext
          items={blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {blocks.map((block, i) => (
              <BlockItem
                key={block.id}
                id={block.id}
                onDelete={() => onRemoveBlock(block.id)}
              >
                {block.type === "paragraph" && (
                  <ParagraphBlock
                    content={block.content}
                    placeholder="Start writing..."
                    className="text-base leading-relaxed"
                    onChange={(content) => onUpdateBlock(block.id, { content })}
                    onEnter={() => onAddBlock("paragraph", block.id)}
                    onBackspaceEmpty={() => mergeWithPrevious(block.id)}
                    onSlash={() => handleParagraphSlash(block.id, editorRef.current!)}
                    onPaste={(pb) => handlePasteBlocks(block.id, pb)}
                    autoFocus={i === blocks.length - 1 && block.content === ""}
                  />
                )}
                {block.type === "heading" && (
                  <HeadingBlock
                    content={block.content}
                    level={block.level || 2}
                    onChange={(content) => onUpdateBlock(block.id, { content })}
                    onEnter={() => onAddBlock("paragraph", block.id)}
                    onBackspaceEmpty={() => mergeWithPrevious(block.id)}
                    onSlash={() => handleParagraphSlash(block.id, editorRef.current!)}
                    onPaste={(pb) => handlePasteBlocks(block.id, pb)}
                  />
                )}
                {block.type === "video" && (
                  <VideoBlock
                    url={block.url}
                    caption={block.caption}
                    onChange={(data) => onUpdateBlock(block.id, data)}
                    onDelete={() => onRemoveBlock(block.id)}
                  />
                )}
                {block.type === "image" && (
                  <ImageBlock
                    url={block.url}
                    alt={block.alt}
                    caption={block.caption}
                    onChange={(data) => onUpdateBlock(block.id, data)}
                    onDelete={() => onRemoveBlock(block.id)}
                  />
                )}
                {block.type === "quote" && (
                  <ParagraphBlock
                    content={block.content}
                    placeholder="Quote..."
                    className="border-l-2 border-primary/30 pl-4 italic text-muted-foreground text-base"
                    onChange={(content) => onUpdateBlock(block.id, { content })}
                    onEnter={() => onAddBlock("paragraph", block.id)}
                    onBackspaceEmpty={() => mergeWithPrevious(block.id)}
                    onSlash={() => {}}
                  />
                )}
                {block.type === "code" && (
                  <div className="relative">
                    <div className="absolute top-2 right-2 text-[10px] text-muted-foreground/30 font-mono pointer-events-none">
                      {block.language || "plaintext"}
                    </div>
                    <ParagraphBlock
                      content={block.content}
                      placeholder="Write code..."
                      className="font-mono text-sm bg-muted/30 rounded-lg p-4 border border-border/30 leading-relaxed"
                      onChange={(content) => onUpdateBlock(block.id, { content })}
                      onEnter={() => {}}
                      onBackspaceEmpty={() => mergeWithPrevious(block.id)}
                      onSlash={() => {}}
                    />
                  </div>
                )}
                {block.type === "divider" && (
                  <div className="py-1">
                    <hr className="border-t border-border/40" />
                  </div>
                )}
                {block.type === "list" && (
                  <div className="space-y-1">
                    {(block.items || [""]).map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-start gap-2">
                        <span className="mt-0 text-muted-foreground select-none shrink-0 text-sm">
                          {block.listType === "ordered" ? `${itemIdx + 1}.` : "•"}
                        </span>
                        <ParagraphBlock
                          content={item}
                          placeholder="List item..."
                          className="text-sm leading-relaxed flex-1"
                          onChange={(html) => {
                            const items = [...(block.items || [""])]
                            items[itemIdx] = html
                            onUpdateBlock(block.id, { items })
                          }}
                          onEnter={() => {
                            const items = [...(block.items || [""])]
                            if (item === items[items.length - 1] && item.trim() === "") {
                              onChange(
                                blocks.map((b) =>
                                  b.id === block.id
                                    ? { ...block, type: "paragraph" as const, content: "", items: undefined }
                                    : b
                                )
                              )
                              return
                            }
                            items.splice(itemIdx + 1, 0, "")
                            onUpdateBlock(block.id, { items })
                          }}
                          onBackspaceEmpty={() => {
                            if (itemIdx === 0 && (block.items || [""]).length <= 1) {
                              mergeWithPrevious(block.id)
                              return
                            }
                            if (itemIdx > 0) {
                              const items = [...(block.items || [""])]
                              items.splice(itemIdx, 1)
                              onUpdateBlock(block.id, { items })
                            }
                          }}
                          onSlash={() => {}}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </BlockItem>
            ))}
            {/* Add block after last block */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={(e) => openAddMenu(e.currentTarget)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
              >
                <span className="size-5 rounded-full border border-border/40 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                Add block
              </button>
            </div>
          </div>
        </SortableContext>
      </DndContext>

      <BlockToolbar editorRef={editorRef as React.RefObject<HTMLDivElement | null>} />

      {menuOpen && (
        <AddBlockMenu
          onSelect={handleMenuSelect}
          onClose={() => { setMenuOpen(false); setSlashTarget(null); setPendingInsertAfter(null) }}
          anchorEl={menuAnchor}
        />
      )}
    </div>
  )
}
