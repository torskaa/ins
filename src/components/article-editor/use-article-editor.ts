"use client"

import { useState, useCallback } from "react"
import { type Block, type BlockType, createBlock } from "./types"

interface ArticleEditorState {
  title: string
  coverImage: string | null
  blocks: Block[]
}

interface ArticleEditorActions {
  addBlock: (type: BlockType, afterId?: string) => void
  removeBlock: (id: string) => void
  updateBlock: (id: string, updates: Partial<Block>) => void
  reorderBlocks: (fromIndex: number, toIndex: number) => void
  setTitle: (title: string) => void
  setCoverImage: (url: string | null) => void
  setBlocks: (blocks: Block[]) => void
}

export function useArticleEditor(initialBlocks?: Block[]): ArticleEditorState & ArticleEditorActions {
  const [title, setTitle] = useState("")
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<Block[]>(
    initialBlocks && initialBlocks.length > 0
      ? initialBlocks
      : [createBlock("paragraph", 0)]
  )

  const addBlock = useCallback((type: BlockType, afterId?: string) => {
    setBlocks((prev) => {
      if (afterId) {
        const idx = prev.findIndex((b) => b.id === afterId)
        if (idx !== -1) {
          const newBlock = createBlock(type, idx + 1)
          const next = [...prev]
          next.splice(idx + 1, 0, newBlock)
          return next.map((b, i) => ({ ...b, order: i }))
        }
      }
      const newBlock = createBlock(type, prev.length)
      return [...prev, newBlock].map((b, i) => ({ ...b, order: i }))
    })
  }, [])

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => {
      if (prev.length <= 1) {
        return [createBlock("paragraph", 0)]
      }
      return prev.filter((b) => b.id !== id).map((b, i) => ({ ...b, order: i }))
    })
  }, [])

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    )
  }, [])

  const reorderBlocks = useCallback((fromIndex: number, toIndex: number) => {
    setBlocks((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next.map((b, i) => ({ ...b, order: i }))
    })
  }, [])

  return {
    title,
    coverImage,
    blocks,
    addBlock,
    removeBlock,
    updateBlock,
    reorderBlocks,
    setTitle,
    setCoverImage,
    setBlocks,
  }
}
