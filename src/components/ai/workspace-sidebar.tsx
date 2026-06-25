"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Plus,
  MessageSquareText,
  FolderKanban,
  Tags,
  Sparkles,
  History,
  ChevronDown,
  ChevronRight,
  Pencil,
  Sun,
  Moon,
  PanelLeft,
  MoreHorizontal,
  Share2,
  Pin,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchInput } from "@/components/ui/search-input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import WorkspaceSwitcher from "@/components/workspace/workspace-switcher"
import type { ChatSession } from "@/hooks/use-chat-sessions"

const quickActions = [
  { icon: Sparkles, label: "New task", shortcut: "⌘N" },
  { icon: History, label: "Recent", shortcut: "⌘R" },
]

const defaultConversations = [
  { label: "Inventory analysis", active: true },
  { label: "Order report Q2" },
  { label: "Stock reconciliation" },
  { label: "Supplier evaluation" },
]

const DEFAULT_TAGS = ["inventory", "orders", "finance", "urgent", "draft"]

interface Project {
  id: string
  name: string
  createdAt: number
}

function loadProjects(): Project[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem("ins:ai-projects")
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveProjects(projects: Project[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("ins:ai-projects", JSON.stringify(projects))
  }
}

function loadTags(): string[] {
  if (typeof window === "undefined") return DEFAULT_TAGS
  try {
    const raw = localStorage.getItem("ins:ai-tags")
    return raw ? JSON.parse(raw) : DEFAULT_TAGS
  } catch { return DEFAULT_TAGS }
}

function saveTags(tags: string[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("ins:ai-tags", JSON.stringify(tags))
  }
}

interface WorkspaceSidebarProps {
  open: boolean
  collapsed?: boolean
  onCollapsedChange?: (v: boolean) => void
  onNewChat: () => void
  onClose: () => void
  sessions?: ChatSession[]
  activeSessionId?: string | null
  onSelectSession?: (id: string) => void
  onDeleteSession?: (id: string) => void
  onRenameSession?: (id: string, title: string) => void
  activeTag?: string | null
  onSelectTag?: (tag: string | null) => void
  disabled?: boolean
}

export function WorkspaceSidebar({
  open,
  collapsed,
  onCollapsedChange,
  onNewChat,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  activeTag,
  onSelectTag,
  disabled,
}: WorkspaceSidebarProps) {
  const [projectsOpen, setProjectsOpen] = useState(true)
  const [tagsOpen, setTagsOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const [tagList, setTagList] = useState(loadTags)
  const [addingTag, setAddingTag] = useState(false)
  const [newTagValue, setNewTagValue] = useState("")
  const [projectList, setProjectList] = useState<Project[]>(loadProjects)
  const [addingProject, setAddingProject] = useState(false)
  const [newProjectValue, setNewProjectValue] = useState("")
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editingProjectValue, setEditingProjectValue] = useState("")
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  function handleAddProject() {
    const trimmed = newProjectValue.trim()
    if (!trimmed) return
    const project: Project = { id: crypto.randomUUID(), name: trimmed, createdAt: Date.now() }
    const updated = [...projectList, project]
    setProjectList(updated)
    saveProjects(updated)
    setNewProjectValue("")
    setAddingProject(false)
    setActiveProjectId(project.id)
  }

  function handleRenameProject(id: string, name: string) {
    const updated = projectList.map((p) => p.id === id ? { ...p, name } : p)
    setProjectList(updated)
    saveProjects(updated)
    setEditingProjectId(null)
  }

  function handleDeleteProject(id: string) {
    const updated = projectList.filter((p) => p.id !== id)
    setProjectList(updated)
    saveProjects(updated)
    if (activeProjectId === id) setActiveProjectId(null)
  }

  function handleAddTag() {
    const trimmed = newTagValue.trim().toLowerCase()
    if (!trimmed || tagList.includes(trimmed)) return
    const updated = [...tagList, trimmed]
    setTagList(updated)
    saveTags(updated)
    setNewTagValue("")
    setAddingTag(false)
  }

  function handleRemoveTag(tag: string) {
    const updated = tagList.filter((t) => t !== tag)
    setTagList(updated)
    saveTags(updated)
    if (activeTag === tag) onSelectTag?.(null)
  }
  const { theme, toggleTheme } = useTheme()
  const isCollapsed = collapsed ?? false
  const toggleCollapsed = () => onCollapsedChange?.(!isCollapsed)

  type ConvItem = { id: string; label: string; active: boolean }

  const conversationList = useMemo<ConvItem[]>(() => {
    const items: ConvItem[] = sessions && sessions.length > 0
      ? sessions.map((s) => ({ id: s.id, label: s.title, active: s.id === activeSessionId }))
      : defaultConversations.map((c) => ({ id: c.label, label: c.label, active: c.active ?? false }))

    if (!searchQuery.trim()) return items
    const q = searchQuery.toLowerCase()
    return items.filter((i) => i.label.toLowerCase().includes(q))
  }, [sessions, activeSessionId, searchQuery])

  if (!open) return null

  return (
    <aside
      className={cn(
        "h-full border-r border-border/10 bg-card transition-all duration-200 flex flex-col",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn("flex items-center h-14 border-b border-border/30 px-3", isCollapsed && "justify-center px-0")}>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-success/20 flex items-center justify-center shrink-0">
            <span className="text-primary font-bold text-xs">I</span>
          </div>
          {!isCollapsed && <span className="font-semibold text-base tracking-tight">Ins</span>}
        </Link>
        {!isCollapsed && (
          <button
            onClick={() => onClose()}
            className="ml-auto size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
          >
            <PanelLeft className="size-4" />
          </button>
        )}
      </div>

      <div className={cn("px-3 pt-3 pb-2 border-b border-border/30", isCollapsed && "px-2")}>
        {!isCollapsed ? <WorkspaceSwitcher /> : <WorkspaceSwitcher collapsed />}
      </div>

      <div className={cn("p-3", isCollapsed && "p-2")}>
        {isCollapsed ? (
          <Button
            onClick={onNewChat}
            className="w-full h-9 rounded-lg"
            size="icon"
          >
            <Plus className="size-4" />
          </Button>
        ) : (
          <div className="space-y-2">
            <Button
              onClick={onNewChat}
              disabled={disabled}
              className="w-full h-9 rounded-lg gap-2 text-xs font-medium"
            >
              <Plus className="size-4" />
              New conversation
            </Button>
            <SearchInput
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-4">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-1 pt-2">
            <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
          </div>
        ) : (
          <>
            <div className="space-y-0.5">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <action.icon className="size-4" />
                    {action.label}
                  </div>
                  <span className="text-[10px] text-muted-foreground/40 font-mono">{action.shortcut}</span>
                </button>
              ))}
            </div>

            <div>
              <div className="flex items-center gap-1.5 px-2.5 py-1">
                <MessageSquareText className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Conversations</span>
              </div>
              <div className="ml-2 pl-3 border-l border-border/40 space-y-0.5 mt-1">
                {conversationList.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50 px-2 py-2">No conversations found</p>
                ) : (
                  conversationList.map((item) => (
                    <div
                      key={item.id}
                      className="group relative flex items-center"
                    >
                      {editingId === item.id ? (
                        <div className="flex items-center gap-1 w-full">
                          <input
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                onRenameSession?.(item.id, editingValue)
                                setEditingId(null)
                              }
                              if (e.key === "Escape") {
                                setEditingId(null)
                              }
                            }}
                            onBlur={() => {
                              if (editingValue.trim()) {
                                onRenameSession?.(item.id, editingValue)
                              }
                              setEditingId(null)
                            }}
                            className="flex-1 px-2 py-1.5 rounded-md bg-muted/20 border border-border/50 text-sm outline-none focus:border-ring/50"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => !disabled && onSelectSession?.(item.id)}
                          className={cn(
                            "flex items-center w-full p-2 pr-8 rounded-lg text-sm transition-colors",
                            disabled && "opacity-50 pointer-events-none",
                            item.active
                              ? "bg-blue-50/80 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/20",
                          )}
                        >
                          <span className="truncate">{item.label}</span>
                        </button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={cn(
                              "absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity",
                              item.active ? "opacity-100" : ""
                            )}
                          >
                            <MoreHorizontal className="size-3.5 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-40 rounded-xl border-border/60">
                          <DropdownMenuItem className="gap-2 text-sm" onSelect={(e) => e.preventDefault()}>
                            <Share2 className="size-3.5" />
                            Share Conversation
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-sm" onSelect={(e) => e.preventDefault()}>
                            <Pin className="size-3.5" />
                            Pin
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-sm" onSelect={() => {
                            setEditingId(item.id)
                            setEditingValue(item.label)
                          }}>
                            <Pencil className="size-3.5" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-sm text-red-600 dark:text-red-400" onSelect={() => onDeleteSession?.(item.id)}>
                            <Trash2 className="size-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 w-full">
                <button
                  onClick={() => setProjectsOpen(!projectsOpen)}
                  className="flex items-center gap-1.5 flex-1 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  {projectsOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                  <FolderKanban className="size-3.5" />
                  Projects
                </button>
                <button
                  onClick={() => { if (!disabled) { setAddingProject(true); setProjectsOpen(true) } }}
                  className={cn("size-6 flex items-center justify-center rounded-md transition-colors", disabled ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-foreground hover:bg-muted/20")}
                  title="New project"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              {projectsOpen && (
                <div className="ml-2 pl-3 border-l border-border/40 space-y-0.5 mt-1">
                  {addingProject && (
                    <div className="mb-1">
                      <input
                        autoFocus
                        value={newProjectValue}
                        onChange={(e) => setNewProjectValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); handleAddProject() }
                          if (e.key === "Escape") { setAddingProject(false); setNewProjectValue("") }
                        }}
                        onBlur={() => { if (newProjectValue.trim()) handleAddProject(); else { setAddingProject(false); setNewProjectValue("") } }}
                        placeholder="Project name..."
                        className="w-full px-2 py-1 rounded-md bg-muted/20 border border-border/50 text-sm outline-none focus:border-ring/50"
                      />
                    </div>
                  )}
                  {projectList.length === 0 ? (
                    <p className="text-xs text-muted-foreground/50 px-2 py-2">No projects yet</p>
                  ) : (
                    projectList.map((project) => (
                      <div key={project.id} className="group relative flex items-center">
                        {editingProjectId === project.id ? (
                          <input
                            value={editingProjectValue}
                            onChange={(e) => setEditingProjectValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { e.preventDefault(); handleRenameProject(project.id, editingProjectValue) }
                              if (e.key === "Escape") { setEditingProjectId(null) }
                            }}
                            onBlur={() => { if (editingProjectValue.trim()) handleRenameProject(project.id, editingProjectValue); else setEditingProjectId(null) }}
                            className="flex-1 px-2 py-1 rounded-md bg-muted/20 border border-border/50 text-sm outline-none focus:border-ring/50"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => !disabled && setActiveProjectId(activeProjectId === project.id ? null : project.id)}
                            className={cn(
                              "flex items-center w-full p-2 pr-8 rounded-lg text-sm transition-colors",
                              disabled && "opacity-50 pointer-events-none",
                              activeProjectId === project.id
                                ? "bg-blue-50/80 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/20",
                            )}
                          >
                            <span className="truncate">{project.name}</span>
                          </button>
                        )}
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingProjectId(project.id); setEditingProjectValue(project.name) }}
                            className="size-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/20"
                          >
                            <span className="text-[10px]">✎</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="size-5 flex items-center justify-center rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          >
                            <span className="text-[10px]">✕</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1 w-full">
                <button
                  onClick={() => setTagsOpen(!tagsOpen)}
                  className="flex items-center gap-1.5 flex-1 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  {tagsOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                  <Tags className="size-3.5" />
                  Tags
                </button>
                <button
                  onClick={() => { if (!disabled) { setAddingTag(true); setTagsOpen(true) } }}
                  className={cn("size-6 flex items-center justify-center rounded-md transition-colors", disabled ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-foreground hover:bg-muted/20")}
                  title="New tag"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              {tagsOpen && (
                <div className="flex flex-wrap gap-1.5 mt-1.5 px-2.5">
                  {addingTag && (
                    <div className="w-full mb-1">
                      <input
                        autoFocus
                        value={newTagValue}
                        onChange={(e) => setNewTagValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); handleAddTag() }
                          if (e.key === "Escape") { setAddingTag(false); setNewTagValue("") }
                        }}
                        onBlur={() => { if (newTagValue.trim()) handleAddTag(); else { setAddingTag(false); setNewTagValue("") } }}
                        placeholder="Tag name..."
                        className="w-full px-2 py-1 rounded-md bg-muted/20 border border-border/50 text-xs outline-none focus:border-ring/50"
                      />
                    </div>
                  )}
                  {tagList.map((tag) => (
                    <div key={tag} className="group relative">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 cursor-pointer transition-colors",
                          activeTag === tag
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "text-muted-foreground/50 border-border/40 hover:text-foreground hover:border-border",
                        )}
                        onClick={() => !disabled && onSelectTag?.(activeTag === tag ? null : tag)}
                      >
                        {tag}
                      </Badge>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="absolute -top-1 -right-1 size-3.5 rounded-full bg-card border border-border/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                      >
                        <span className="text-[8px] leading-none text-muted-foreground">✕</span>
                      </button>
                    </div>
                  ))}
                  {!addingTag && tagList.length === 0 && (
                    <p className="text-xs text-muted-foreground/50 px-1 py-1">No tags yet</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </nav>

      <div className={cn("p-2 border-t border-border/30 space-y-1", isCollapsed && "flex flex-col items-center gap-1")}>
        {isCollapsed ? (
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        ) : (
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            <span className="text-xs">{theme === "dark" ? "Light Mode" : "Light Mode"}</span>
          </button>
        )}
      </div>
    </aside>
  )
}
