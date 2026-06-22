"use client"

import { useState, useRef, useEffect } from "react"
import {
  ChevronDown,
  ChevronRight,
  Edit3,
  FolderIcon,
  FolderPlus,
  FolderUp,
  MessageSquareText,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { type ChatTreeNode, type ChatFolder, type ChatSession, isFolder } from "@/hooks/use-chat-sessions"

/* ─── Sidebar Section ─── */

function SidebarSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="mt-4 first:mt-0">
      <div className="flex items-center gap-1.5 px-2 py-1">
        <Icon className="size-3 text-muted-foreground" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  )
}

/* ─── Helpers ─── */

function groupByTime(sessions: ChatSession[]): { label: string; sessions: ChatSession[] }[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterday = today - 86_400_000
  const sevenDays = today - 7 * 86_400_000

  const groups: { label: string; sessions: ChatSession[] }[] = []
  const todaySessions = sessions.filter((s) => s.updatedAt >= today)
  const yesterdaySessions = sessions.filter((s) => s.updatedAt >= yesterday && s.updatedAt < today)
  const weekSessions = sessions.filter((s) => s.updatedAt >= sevenDays && s.updatedAt < yesterday)
  const olderSessions = sessions.filter((s) => s.updatedAt < sevenDays)

  const sorted = (arr: ChatSession[]) => arr.sort((a, b) => b.updatedAt - a.updatedAt)

  if (todaySessions.length) groups.push({ label: "Today", sessions: sorted(todaySessions) })
  if (yesterdaySessions.length) groups.push({ label: "Yesterday", sessions: sorted(yesterdaySessions) })
  if (weekSessions.length) groups.push({ label: "Last 7 days", sessions: sorted(weekSessions) })
  if (olderSessions.length) groups.push({ label: "Earlier", sessions: sorted(olderSessions) })

  return groups
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  if (sameYear) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function collectSessions(items: ChatTreeNode[]): ChatSession[] {
  const result: ChatSession[] = []
  for (const item of items) {
    if (isFolder(item)) {
      result.push(...collectSessions(item.items))
    } else {
      result.push(item)
    }
  }
  return result
}

function getAllFolders(items: ChatTreeNode[]): { id: string; name: string }[] {
  const result: { id: string; name: string }[] = []
  for (const item of items) {
    if (isFolder(item)) {
      result.push({ id: item.id, name: item.name })
      result.push(...getAllFolders(item.items))
    }
  }
  return result
}

interface ChatSidebarProps {
  tree: ChatTreeNode[]
  activeSessionId: string | null
  open: boolean
  onNewChat: () => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onRenameSession: (id: string, title: string) => void
  onMoveToFolder: (nodeId: string, folderId: string | null) => void
  onCreateFolder: (name: string, parentFolderId?: string) => void
  onDeleteFolder: (id: string) => void
  onRenameFolder: (id: string, name: string) => void
  onClose: () => void
}

export function ChatSidebar({
  tree,
  activeSessionId,
  open,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onMoveToFolder,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  onClose,
}: ChatSidebarProps) {
  const [search, setSearch] = useState("")
  const [folderInput, setFolderInput] = useState(false)
  const [folderName, setFolderName] = useState("")
  const folderInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (folderInput && folderInputRef.current) {
      folderInputRef.current.focus()
    }
  }, [folderInput])

  function handleCreateFolder() {
    if (folderName.trim()) {
      onCreateFolder(folderName.trim())
      setFolderName("")
      setFolderInput(false)
    }
  }

  const filterTree = (items: ChatTreeNode[], query: string): ChatTreeNode[] => {
    if (!query) return items
    return items.reduce<ChatTreeNode[]>((acc, item) => {
      if (isFolder(item)) {
        const filtered = filterTree(item.items, query)
        if (filtered.length > 0) {
          acc.push({ ...item, items: filtered })
        }
        return acc
      }
      if (item.title.toLowerCase().includes(query.toLowerCase())) {
        acc.push(item)
      }
      return acc
    }, [])
  }

  const filtered = search ? filterTree(tree, search) : tree
  const rootSessions = filtered.filter((item): item is ChatSession => !isFolder(item))
  const rootFolders = filtered.filter((item): item is ChatFolder => isFolder(item))
  const rootGroups = groupByTime(rootSessions)
  const allFolders = getAllFolders(tree)

  if (!open) return null

  return (
    <div className="w-[260px] shrink-0 border-r border-border/60 bg-card flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            History
          </span>
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </Button>
        </div>
        <Button
          variant="default"
          className="w-full h-8 gap-1.5 text-xs justify-start px-3"
          onClick={onNewChat}
        >
          <Plus className="size-3.5" />
          New chat
        </Button>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full h-7 rounded-md bg-background pl-7 pr-2 text-xs outline-none ring-1 ring-border/50 focus:ring-1 focus:ring-ring/50 transition-all placeholder:text-muted-foreground/60"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable area */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 scroll-smooth">
        {rootFolders.length > 0 && (
          <SidebarSection title="Folders" icon={FolderIcon}>
            {rootFolders.map((folder) => (
              <FolderNode
                key={folder.id}
                folder={folder}
                depth={0}
                allFolders={allFolders}
                activeSessionId={activeSessionId}
                onSelectSession={onSelectSession}
                onDeleteSession={onDeleteSession}
                onRenameSession={onRenameSession}
                onMoveToFolder={onMoveToFolder}
                onCreateFolder={onCreateFolder}
                onDeleteFolder={onDeleteFolder}
                onRenameFolder={onRenameFolder}
              />
            ))}
            <div className="px-2 pt-1">
              {folderInput ? (
                <div className="flex items-center gap-1 rounded-md ring-1 ring-border/50 px-2 py-1">
                  <FolderIcon className="size-3 text-muted-foreground shrink-0" />
                  <input
                    ref={folderInputRef}
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="Folder name"
                    className="flex-1 bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground/60"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateFolder()
                      if (e.key === "Escape") {
                        setFolderInput(false)
                        setFolderName("")
                      }
                    }}
                    onBlur={() => {
                      if (folderName.trim()) handleCreateFolder()
                      else {
                        setFolderInput(false)
                        setFolderName("")
                      }
                    }}
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  onClick={() => setFolderInput(true)}
                  className="flex items-center gap-1.5 w-full px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/10 transition-colors"
                >
                  <FolderPlus className="size-3" />
                  New folder
                </button>
              )}
            </div>
          </SidebarSection>
        )}

        {rootFolders.length === 0 && (
          <div className="px-2 pt-1">
            {folderInput ? (
              <div className="flex items-center gap-1 rounded-md ring-1 ring-border/50 px-2 py-1">
                <FolderIcon className="size-3 text-muted-foreground shrink-0" />
                <input
                  ref={folderInputRef}
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Folder name"
                  className="flex-1 bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground/60"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFolder()
                    if (e.key === "Escape") {
                      setFolderInput(false)
                      setFolderName("")
                    }
                  }}
                  onBlur={() => {
                    if (folderName.trim()) handleCreateFolder()
                    else {
                      setFolderInput(false)
                      setFolderName("")
                    }
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <button
                onClick={() => setFolderInput(true)}
                className="flex items-center gap-1.5 w-full px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/10 transition-colors"
              >
                <FolderPlus className="size-3" />
                New folder
              </button>
            )}
          </div>
        )}

        {rootGroups.length > 0 && (
          <SidebarSection title="Recent Chats" icon={MessageSquareText}>
            {rootGroups.map((group) => (
              <div key={group.label}>
                <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </div>
                {group.sessions.map((s) => (
                  <SessionItem
                    key={s.id}
                    session={s}
                    depth={0}
                    isActive={s.id === activeSessionId}
                    allFolders={allFolders}
                    onSelect={() => onSelectSession(s.id)}
                    onDelete={() => onDeleteSession(s.id)}
                    onRename={(title) => onRenameSession(s.id, title)}
                    onMoveToFolder={(folderId) => onMoveToFolder(s.id, folderId)}
                  />
                ))}
              </div>
            ))}
          </SidebarSection>
        )}

        {!search && rootSessions.length === 0 && rootFolders.length === 0 && (
          <div className="px-3 py-6 text-center">
            <p className="text-xs text-muted-foreground">No conversations yet</p>
          </div>
        )}

        {search && rootSessions.length === 0 && rootFolders.length === 0 && (
          <div className="px-3 py-6 text-center">
            <p className="text-xs text-muted-foreground">No results found</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Recursive Folder Node ─── */

interface FolderNodeProps {
  folder: ChatFolder
  depth: number
  allFolders: { id: string; name: string }[]
  activeSessionId: string | null
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onRenameSession: (id: string, title: string) => void
  onMoveToFolder: (nodeId: string, folderId: string | null) => void
  onCreateFolder: (name: string, parentFolderId?: string) => void
  onDeleteFolder: (id: string) => void
  onRenameFolder: (id: string, name: string) => void
}

function FolderNode({
  folder,
  depth,
  allFolders,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onMoveToFolder,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
}: FolderNodeProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(folder.name)
  const [showInput, setShowInput] = useState(false)
  const [newName, setNewName] = useState("")
  const editRef = useRef<HTMLInputElement>(null)
  const newInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus()
      editRef.current.select()
    }
  }, [editing])

  useEffect(() => {
    if (showInput && newInputRef.current) {
      newInputRef.current.focus()
    }
  }, [showInput])

  function saveEdit() {
    if (editValue.trim()) {
      onRenameFolder(folder.id, editValue.trim())
    }
    setEditing(false)
  }

  function handleCreateSubfolder() {
    if (newName.trim()) {
      onCreateFolder(newName.trim(), folder.id)
      setNewName("")
      setShowInput(false)
      setIsOpen(true)
    }
  }

  const items = folder.items
  const sessions = items.filter((item): item is ChatSession => !isFolder(item))
  const subfolders = items.filter((item): item is ChatFolder => isFolder(item))
  const groups = groupByTime(sessions)
  const total = collectSessions(items).length

  return (
    <div>
      {/* Folder header */}
      <div
        className="group flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted/10 cursor-pointer text-[11px]"
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="shrink-0 text-muted-foreground transition-transform duration-200"
        >
          {isOpen ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
        </button>
        <FolderIcon className="size-3.5 text-muted-foreground shrink-0" />
        {editing ? (
          <input
            ref={editRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit()
              if (e.key === "Escape") {
                setEditValue(folder.name)
                setEditing(false)
              }
            }}
            className="flex-1 bg-transparent outline-none text-foreground text-[11px]"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-muted-foreground truncate">
            {folder.name}
          </span>
        )}
        {!editing && (
          <>
            <span className="text-[10px] text-muted-foreground/50">{total}</span>
            <Button
              size="icon-xs"
              variant="ghost"
              className="opacity-0 group-hover:opacity-100 size-5 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation()
                setEditing(true)
                setEditValue(folder.name)
              }}
            >
              <Edit3 className="size-3" />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              className="opacity-0 group-hover:opacity-100 size-5 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteFolder(folder.id)
              }}
            >
              <Trash2 className="size-3" />
            </Button>
          </>
        )}
      </div>

      {/* Children */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "opacity-100" : "max-h-0 opacity-0",
        )}
      >
        {subfolders.map((sub) => (
          <FolderNode
            key={sub.id}
            folder={sub}
            depth={depth + 1}
            allFolders={allFolders}
            activeSessionId={activeSessionId}
            onSelectSession={onSelectSession}
            onDeleteSession={onDeleteSession}
            onRenameSession={onRenameSession}
            onMoveToFolder={onMoveToFolder}
            onCreateFolder={onCreateFolder}
            onDeleteFolder={onDeleteFolder}
            onRenameFolder={onRenameFolder}
          />
        ))}

        {groups.map((group) => (
          <div key={group.label} style={{ paddingLeft: (depth + 1) * 12 }}>
            <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {group.label}
            </div>
            {group.sessions.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                depth={depth + 1}
                isActive={s.id === activeSessionId}
                allFolders={allFolders}
                onSelect={() => onSelectSession(s.id)}
                onDelete={() => onDeleteSession(s.id)}
                onRename={(title) => onRenameSession(s.id, title)}
                onMoveToFolder={(folderId) => onMoveToFolder(s.id, folderId)}
              />
            ))}
          </div>
        ))}

        {showInput ? (
          <div
            className="flex items-center gap-1 rounded-md ring-1 ring-border/50 px-2 py-1 mx-2"
            style={{ marginLeft: 8 + (depth + 1) * 12 }}
          >
            <FolderIcon className="size-3 text-muted-foreground shrink-0" />
            <input
              ref={newInputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Subfolder name"
              className="flex-1 bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground/60"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateSubfolder()
                if (e.key === "Escape") {
                  setShowInput(false)
                  setNewName("")
                }
              }}
              onBlur={() => {
                if (newName.trim()) handleCreateSubfolder()
                else {
                  setShowInput(false)
                  setNewName("")
                }
              }}
              autoFocus
            />
          </div>
        ) : null}

        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowInput(true)
            setIsOpen(true)
          }}
          className="flex items-center gap-1.5 w-full px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/10 transition-colors"
          style={{ paddingLeft: 8 + (depth + 1) * 12 + 8 }}
        >
          <FolderPlus className="size-3" />
          New folder
        </button>
      </div>
    </div>
  )
}

/* ─── Session Item ─── */

interface SessionItemProps {
  session: ChatSession
  depth: number
  isActive: boolean
  allFolders: { id: string; name: string }[]
  onSelect: () => void
  onDelete: () => void
  onRename: (title: string) => void
  onMoveToFolder: (folderId: string | null) => void
}

function SessionItem({
  session,
  depth,
  isActive,
  allFolders,
  onSelect,
  onDelete,
  onRename,
  onMoveToFolder,
}: SessionItemProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(session.title)
  const editRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus()
      editRef.current.select()
    }
  }, [editing])

  function saveEdit() {
    if (editValue.trim()) {
      onRename(editValue.trim())
    }
    setEditing(false)
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors",
        isActive
          ? "bg-accent/50 text-foreground"
          : "text-muted-foreground hover:bg-accent/30 hover:text-foreground",
      )}
      style={{ paddingLeft: 8 + depth * 12 + 16 }}
      onClick={onSelect}
    >
      <MessageSquareText className="size-3.5 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={editRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit()
              if (e.key === "Escape") {
                setEditValue(session.title)
                setEditing(false)
              }
            }}
            className="w-full bg-transparent outline-none text-foreground text-xs"
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="truncate flex-1">{session.title}</span>
            <span className="text-[10px] text-muted-foreground/50 shrink-0">
              {formatTime(session.updatedAt)}
            </span>
          </div>
        )}
      </div>
      {!editing && (
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon-xs"
                variant="ghost"
                className="size-5 text-muted-foreground/60 hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <FolderUp className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
              {allFolders.map((f) => (
                <DropdownMenuItem
                  key={f.id}
                  className="text-xs gap-2"
                  onClick={() => onMoveToFolder(f.id)}
                >
                  <FolderIcon className="size-3 text-muted-foreground" />
                  {f.name}
                </DropdownMenuItem>
              ))}
              {allFolders.length === 0 && (
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  No folders
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="icon-xs"
            variant="ghost"
            className="size-5 text-muted-foreground/60 hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation()
              setEditing(true)
              setEditValue(session.title)
            }}
          >
            <Edit3 className="size-3" />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            className="size-5 text-muted-foreground/60 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      )}
    </div>
  )
}
