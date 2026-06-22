"use client"

import { useState, useCallback, useEffect } from "react"
import type { ChatMessage } from "@/hooks/use-ai-chat"

const STORAGE_KEY_TREE = "ins:chat-tree"
const STORAGE_KEY_ACTIVE = "ins:chat-active"
const STORAGE_KEY_SESSIONS_OLD = "ins:chat-sessions"
const STORAGE_KEY_FOLDERS_OLD = "ins:chat-folders"

function migrateFromLegacyFormat(): ChatTreeNode[] {
  if (typeof window === "undefined") return []
  const existing = localStorage.getItem(STORAGE_KEY_TREE)
  if (existing) return JSON.parse(existing)

  const oldSessionsRaw = localStorage.getItem(STORAGE_KEY_SESSIONS_OLD)
  const oldFoldersRaw = localStorage.getItem(STORAGE_KEY_FOLDERS_OLD)
  if (!oldSessionsRaw && !oldFoldersRaw) return []

  const oldSessions: (ChatSession & { folderId: string | null })[] = oldSessionsRaw ? JSON.parse(oldSessionsRaw) : []
  const oldFolders: { id: string; name: string; createdAt: number }[] = oldFoldersRaw ? JSON.parse(oldFoldersRaw) : []

  const folderMap = new Map<string, ChatTreeNode[]>()
  for (const f of oldFolders) {
    folderMap.set(f.id, [])
  }

  const rootSessions: ChatTreeNode[] = []
  for (const s of oldSessions) {
    const { folderId, ...session } = s
    const node = session as ChatSession
    if (folderId && folderMap.has(folderId)) {
      folderMap.get(folderId)!.push(node)
    } else {
      rootSessions.push(node)
    }
  }

  const tree: ChatTreeNode[] = []
  for (const f of oldFolders) {
    tree.push({ id: f.id, name: f.name, items: folderMap.get(f.id) ?? [], createdAt: f.createdAt })
  }
  tree.push(...rootSessions)

  return tree
}
export interface ChatFolder {
  id: string
  name: string
  items: ChatTreeNode[]
  createdAt: number
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

export type ChatTreeNode = ChatFolder | ChatSession

export function isFolder(node: ChatTreeNode): node is ChatFolder {
  return "items" in node
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage<T>(key: string, data: T) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {}
}

function getDefaultTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user")
  if (firstUser) {
    const text = firstUser.content
    return text.length > 50 ? text.slice(0, 50) + "..." : text
  }
  return "New chat"
}

function findNode(nodes: ChatTreeNode[], id: string): ChatTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (isFolder(node)) {
      const found = findNode(node.items, id)
      if (found) return found
    }
  }
  return null
}

function updateNode(
  nodes: ChatTreeNode[],
  id: string,
  updater: (node: ChatTreeNode) => ChatTreeNode | null,
): ChatTreeNode[] {
  return nodes.reduce<ChatTreeNode[]>((acc, node) => {
    if (node.id === id) {
      const updated = updater(node)
      if (updated) acc.push(updated)
      return acc
    }
    if (isFolder(node)) {
      acc.push({ ...node, items: updateNode(node.items, id, updater) })
    } else {
      acc.push(node)
    }
    return acc
  }, [])
}

function removeNode(nodes: ChatTreeNode[], id: string): ChatTreeNode[] {
  return nodes.reduce<ChatTreeNode[]>((acc, node) => {
    if (node.id === id) return acc
    if (isFolder(node)) {
      acc.push({ ...node, items: removeNode(node.items, id) })
    } else {
      acc.push(node)
    }
    return acc
  }, [])
}

function flattenSessions(nodes: ChatTreeNode[]): ChatSession[] {
  const result: ChatSession[] = []
  for (const node of nodes) {
    if (isFolder(node)) {
      result.push(...flattenSessions(node.items))
    } else {
      result.push(node)
    }
  }
  return result
}

export function useChatSessions() {
  const [tree, setTree] = useState<ChatTreeNode[]>(() =>
    migrateFromLegacyFormat(),
  )
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() =>
    loadFromStorage<string | null>(STORAGE_KEY_ACTIVE, null),
  )

  useEffect(() => {
    saveToStorage(STORAGE_KEY_TREE, tree)
  }, [tree])
  useEffect(() => {
    saveToStorage(STORAGE_KEY_ACTIVE, activeSessionId)
  }, [activeSessionId])

  const createSession = useCallback((messages?: ChatMessage[], folderId?: string) => {
    const session: ChatSession = {
      id: crypto.randomUUID(),
      title: messages ? getDefaultTitle(messages) : "New chat",
      messages: messages ?? [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setTree((prev) => {
      if (folderId) {
        return updateNode(prev, folderId, (node) => {
          if (isFolder(node)) {
            return { ...node, items: [session, ...node.items] }
          }
          return node
        })
      }
      return [session, ...prev]
    })
    setActiveSessionId(session.id)
    return session
  }, [])

  const deleteSession = useCallback((id: string) => {
    setTree((prev) => {
      const removed = removeNode(prev, id)
      if (activeSessionId === id) {
        const all = flattenSessions(removed)
        const next = all[0] ?? null
        setActiveSessionId(next?.id ?? null)
      }
      return removed
    })
  }, [activeSessionId])

  const renameSession = useCallback((id: string, title: string) => {
    setTree((prev) =>
      updateNode(prev, id, (node) => {
        if (!isFolder(node)) {
          return { ...node, title, updatedAt: Date.now() }
        }
        return node
      }),
    )
  }, [])

  const updateSessionMessages = useCallback(
    (id: string, messages: ChatMessage[]) => {
      setTree((prev) =>
        updateNode(prev, id, (node) => {
          if (!isFolder(node)) {
            const title =
              node.title === "New chat" ? getDefaultTitle(messages) : node.title
            return { ...node, messages, title, updatedAt: Date.now() }
          }
          return node
        }),
      )
    },
    [],
  )

  const moveToFolder = useCallback(
    (nodeId: string, targetFolderId: string | null) => {
      setTree((prev) => {
        const node = findNode(prev, nodeId)
        if (!node) return prev

        let result = removeNode(prev, nodeId)

        if (targetFolderId) {
          result = updateNode(result, targetFolderId, (n) => {
            if (isFolder(n)) {
              return { ...n, items: [node, ...n.items] }
            }
            return n
          })
        } else {
          result = [node, ...result]
        }

        return result
      })
    },
    [],
  )

  const createFolder = useCallback((name: string) => {
    const folder: ChatFolder = {
      id: crypto.randomUUID(),
      name,
      items: [],
      createdAt: Date.now(),
    }
    setTree((prev) => [folder, ...prev])
    return folder
  }, [])

  const deleteFolder = useCallback((id: string) => {
    setTree((prev) => {
      const folder = findNode(prev, id)
      if (!folder || !isFolder(folder)) return prev

      const sessions = flattenSessions([folder])
      let result = removeNode(prev, id)
      result = [...sessions, ...result]

      return result
    })
  }, [])

  const renameFolder = useCallback((id: string, name: string) => {
    setTree((prev) =>
      updateNode(prev, id, (node) => {
        if (isFolder(node)) {
          return { ...node, name }
        }
        return node
      }),
    )
  }, [])

  const activeSession = findNode(tree, activeSessionId ?? "") as ChatSession | null

  const sessions = flattenSessions(tree)

  const createFolderIn = useCallback((name: string, parentFolderId?: string) => {
    const folder: ChatFolder = {
      id: crypto.randomUUID(),
      name,
      items: [],
      createdAt: Date.now(),
    }
    setTree((prev) => {
      if (parentFolderId) {
        return updateNode(prev, parentFolderId, (node) => {
          if (isFolder(node)) {
            return { ...node, items: [folder, ...node.items] }
          }
          return node
        })
      }
      return [folder, ...prev]
    })
    return folder
  }, [])

  return {
    tree,
    sessions,
    activeSessionId,
    activeSession,
    setActiveSessionId,
    createSession,
    deleteSession,
    renameSession,
    updateSessionMessages,
    moveToFolder,
    createFolder,
    createFolderIn,
    deleteFolder,
    renameFolder,
  }
}
