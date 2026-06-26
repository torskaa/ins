"use client"

import { useState, useRef, useEffect } from "react"
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
  arrayMove,
} from "@dnd-kit/sortable"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { BlockWrapper } from "./block-wrapper"
import { TextBlock } from "./text-block"
import { ImageBlock } from "./image-block"
import { EmbedBlock } from "./embed-block"
import { ChecklistBlock } from "./checklist-block"
import { CoverImageBlock } from "./cover-image-block"
import { BlockMenu } from "./block-menu"
import { InlineToolbar } from "./inline-toolbar"
import {
  type Block,
  type BlockType,
  createBlock,
} from "./types"
import { cn } from "@/lib/utils"

interface BlockEditorProps {
  blocks: Block[]
  onChange: (blocks: Block[]) => void
  className?: string
}

export function BlockEditor({ blocks, onChange, className }: BlockEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [activeSlashBlock, setActiveSlashBlock] = useState<string | null>(null)
  const [insertMenuOpen, setInsertMenuOpen] = useState(false)
  const [insertTarget, setInsertTarget] = useState<{
    blockId: string
    position: "before" | "after"
    rect: DOMRect
  } | null>(null)
  const [focusIndex, setFocusIndex] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  // Listen for custom insert events from BlockWrapper
  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent).detail
      if (detail?.blockId !== undefined) {
        setInsertTarget({
          blockId: detail.blockId,
          position: detail.position || "before",
          rect: detail.rect,
        })
        setInsertMenuOpen(true)
      }
    }
    document.addEventListener("blockeditor:insert", handler)
    return () => document.removeEventListener("blockeditor:insert", handler)
  }, [])

  function updateBlock(id: string, updates: Partial<Block>) {
    onChange(
      blocks.map((b) => (b.id === id ? { ...b, ...updates } as Block : b)),
    )
  }

  function removeBlock(id: string) {
    if (blocks.length <= 1) {
      // Replace with empty paragraph instead of removing last block
      onChange([createBlock("paragraph")])
      return
    }
    const idx = blocks.findIndex((b) => b.id === id)
    const newBlocks = blocks.filter((b) => b.id !== id)
    onChange(newBlocks)
    // Focus the block at the same index (or previous)
    setFocusIndex(Math.min(idx, newBlocks.length - 1))
  }

  function insertBlock(id: string, type: BlockType, position: "before" | "after") {
    const idx = blocks.findIndex((b) => b.id === id)
    if (idx === -1) return
    const newBlock = createBlock(type)
    const insertIdx = position === "after" ? idx + 1 : idx
    const newBlocks = [...blocks]
    newBlocks.splice(insertIdx, 0, newBlock)
    onChange(newBlocks)
    setFocusIndex(insertIdx)
  }

  function mergeWithPrevious(id: string) {
    const idx = blocks.findIndex((b) => b.id === id)
    if (idx <= 0) return
    // Focus the previous block
    setFocusIndex(idx - 1)
    // Remove this block
    const newBlocks = blocks.filter((b) => b.id !== id)
    onChange(newBlocks)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = blocks.findIndex((b) => b.id === active.id)
    const newIndex = blocks.findIndex((b) => b.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onChange(arrayMove(blocks, oldIndex, newIndex))
  }

  function handleSlash(id: string) {
    setActiveSlashBlock(id)
    setInsertMenuOpen(false)
  }

  function handleSlashSelect(type: BlockType) {
    if (activeSlashBlock) {
      insertBlock(activeSlashBlock, type, "after")
      removeBlock(activeSlashBlock)
    }
    setActiveSlashBlock(null)
  }

  function handleBlockMenuSelect(type: BlockType) {
    if (insertTarget) {
      insertBlock(insertTarget.blockId, type, insertTarget.position)
    } else {
      // Fallback: append to end
      onChange([...blocks, createBlock(type)])
    }
    setInsertTarget(null)
  }

  return (
    <div
      ref={editorRef}
      className={cn("relative", className)}
      onClick={() => setInsertMenuOpen(false)}
    >
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
          <div className="space-y-0.5">
            {blocks.map((block, i) => (
              <BlockWrapper
                key={block.id}
                block={block}
                onDelete={() => removeBlock(block.id)}
                showInsertBefore={i === 0}
                onFocus={() => {
                  setFocusIndex(i)
                  setActiveSlashBlock(null)
                }}
                onBlur={() => {
                  setTimeout(() => {
                    if (focusIndex === i) setFocusIndex(null)
                  }, 200)
                }}
              >
                {block.type === "paragraph" && (
                  <TextBlock
                    content={block.content}
                    placeholder="Start writing..."
                    onChange={(html) => updateBlock(block.id, { content: html })}
                    onEnter={() => insertBlock(block.id, "paragraph", "after")}
                    onBackspaceEmpty={() => mergeWithPrevious(block.id)}
                    onSlash={() => handleSlash(block.id)}
                  />
                )}
                {block.type === "heading" && (
                  <TextBlock
                    content={block.content}
                    placeholder="Heading"
                    className={cn(
                      block.level === 1 && "text-3xl font-bold tracking-tight",
                      block.level === 2 && "text-2xl font-bold tracking-tight",
                      block.level === 3 && "text-xl font-semibold tracking-tight",
                    )}
                    onChange={(html) => updateBlock(block.id, { content: html })}
                    onEnter={() => insertBlock(block.id, "paragraph", "after")}
                    onBackspaceEmpty={() => mergeWithPrevious(block.id)}
                    onSlash={() => handleSlash(block.id)}
                  />
                )}
                {block.type === "quote" && (
                  <TextBlock
                    content={block.content}
                    placeholder="Quote..."
                    className="border-l-2 border-primary/30 pl-4 italic text-muted-foreground"
                    onChange={(html) => updateBlock(block.id, { content: html })}
                    onEnter={() => insertBlock(block.id, "paragraph", "after")}
                    onBackspaceEmpty={() => mergeWithPrevious(block.id)}
                  />
                )}
                {block.type === "code" && (
                  <div className="relative">
                    <div className="absolute top-2 right-2 text-[10px] text-muted-foreground/40 font-mono">
                      {block.language || "plaintext"}
                    </div>
                    <TextBlock
                      content={block.content}
                      placeholder="Write code..."
                      onChange={(html) => updateBlock(block.id, { content: html })}
                      onEnter={() => {
                        // Allow Enter in code blocks
                      }}
                      onBackspaceEmpty={() => mergeWithPrevious(block.id)}
                      className="font-mono text-sm bg-muted/30 rounded-lg p-4 border border-border/30 leading-relaxed [&_*]:font-mono"
                    />
                  </div>
                )}
                {block.type === "divider" && (
                  <div className="py-2">
                    <hr className="border-t border-border/40" />
                  </div>
                )}
                {block.type === "image" && (
                  <ImageBlock
                    url={block.url}
                    alt={block.alt}
                    caption={block.caption}
                    onChange={(data) => updateBlock(block.id, data)}
                    onDelete={() => removeBlock(block.id)}
                  />
                )}
                {(block.type === "list" || block.type === "bulletList") && (
                  <div className="space-y-1">
                    {block.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-start gap-2">
                        <span className="mt-0 text-muted-foreground select-none shrink-0">
                          {block.type === "list" ? `${itemIdx + 1}.` : "•"}
                        </span>
                        <TextBlock
                          content={item}
                          placeholder="List item..."
                          onChange={(html) => {
                            const items = [...block.items]
                            items[itemIdx] = html
                            updateBlock(block.id, { items })
                          }}
                          onEnter={() => {
                            const items = [...block.items]
                            if (item === items[items.length - 1] && item.trim() === "") {
                              // If last item is empty, exit list
                              onChange(blocks.map((b) => b.id === block.id ? createBlock("paragraph") : b))
                              return
                            }
                            items.splice(itemIdx + 1, 0, "")
                            updateBlock(block.id, { items })
                          }}
                          onBackspaceEmpty={() => {
                            if (itemIdx === 0 && block.items.length <= 1) {
                              mergeWithPrevious(block.id)
                              return
                            }
                            if (itemIdx > 0) {
                              const items = [...block.items]
                              items.splice(itemIdx, 1)
                              updateBlock(block.id, { items })
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
                {block.type === "embed" && (
                  <EmbedBlock
                    url={block.url}
                    caption={block.caption}
                    provider={block.provider}
                    onChange={(data) => updateBlock(block.id, data)}
                    onDelete={() => removeBlock(block.id)}
                  />
                )}
                {block.type === "checklist" && (
                  <ChecklistBlock
                    items={block.items}
                    onChange={(items) => updateBlock(block.id, { items })}
                  />
                )}
                {block.type === "cover_image" && (
                  <CoverImageBlock
                    url={block.url}
                    alt={block.alt}
                    onChange={(data) => updateBlock(block.id, data)}
                    onDelete={() => removeBlock(block.id)}
                  />
                )}
              </BlockWrapper>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Inline toolbar */}
      <InlineToolbar editorRef={editorRef as React.RefObject<HTMLDivElement | null>} />

      {/* Block menu (from slash command) */}
      {activeSlashBlock && (
        <BlockMenu
          key={`slash-${activeSlashBlock}`}
          open={!!activeSlashBlock}
          onSelect={handleSlashSelect}
          onClose={() => setActiveSlashBlock(null)}
        />
      )}

      {/* Block menu (from "+" button) */}
      {insertMenuOpen && insertTarget && (
        <BlockMenu
          key={`insert-${insertTarget.blockId}-${insertTarget.position}`}
          open={insertMenuOpen}
          anchorEl={document.elementFromPoint(insertTarget.rect.left, insertTarget.rect.bottom) as HTMLElement}
          onSelect={handleBlockMenuSelect}
          onClose={() => { setInsertMenuOpen(false); setInsertTarget(null) }}
        />
      )}
    </div>
  )
}
