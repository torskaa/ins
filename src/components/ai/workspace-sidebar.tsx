"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Plus,
  MessageSquareText,
  FolderKanban,
  Tags,
  BookOpen,
  Sparkles,
  History,
  Search,
  ChevronDown,
  ChevronRight,
  Bot,
  Sun,
  Moon,
  ChevronLeft,
  PanelLeftClose,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import WorkspaceSwitcher from "@/components/workspace/workspace-switcher"

const quickActions = [
  { icon: Sparkles, label: "New task", shortcut: "⌘N" },
  { icon: History, label: "Recent", shortcut: "⌘R" },
]

interface NavItem {
  label: string
  active?: boolean
}

const conversations: NavItem[] = [
  { label: "Inventory analysis", active: true },
  { label: "Order report Q2" },
  { label: "Stock reconciliation" },
  { label: "Supplier evaluation" },
]

const projects: NavItem[] = [
  { label: "Q2 Planning" },
  { label: "Warehouse audit" },
  { label: "Migration" },
]

const tags = [
  "inventory", "orders", "finance", "urgent", "draft",
]

interface WorkspaceSidebarProps {
  open: boolean
  collapsed?: boolean
  onCollapsedChange?: (v: boolean) => void
  onNewChat: () => void
  onClose: () => void
}

export function WorkspaceSidebar({ open, collapsed, onCollapsedChange, onNewChat, onClose }: WorkspaceSidebarProps) {
  const [projectsOpen, setProjectsOpen] = useState(true)
  const [tagsOpen, setTagsOpen] = useState(true)
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const isCollapsed = collapsed ?? false
  const toggleCollapsed = () => onCollapsedChange?.(!isCollapsed)

  if (!open) return null

  return (
    <aside
      className={cn(
        "h-full border-r border-border/50 bg-card transition-all duration-200 flex flex-col",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn("flex items-center h-14 border-b border-border/30 px-3", isCollapsed && "justify-center px-0")}>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-success/20 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-primary font-bold text-xs">I</span>
          </div>
          {!isCollapsed && <span className="font-semibold text-base tracking-tight">AI</span>}
        </Link>
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
              className="w-full h-9 rounded-lg gap-2 text-sm font-medium"
            >
              <Plus className="size-4" />
              New conversation
            </Button>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60 pointer-events-none" />
              <input
                placeholder="Search conversations..."
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-muted/20 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-border/60 transition-colors"
              />
            </div>
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
            {/* Quick Actions */}
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

            {/* Conversations */}
            <div>
              <div className="flex items-center gap-1.5 px-2.5 py-1">
                <MessageSquareText className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Conversations</span>
              </div>
              <div className="ml-2 pl-3 border-l border-border/40 space-y-0.5 mt-1">
                {conversations.map((item) => (
                  <button
                    key={item.label}
                    className={cn(
                      "flex items-center w-full p-2 rounded-lg text-sm transition-colors",
                      item.active
                        ? "bg-primary/8 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/20",
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div>
              <button
                onClick={() => setProjectsOpen(!projectsOpen)}
                className="flex items-center gap-1.5 w-full px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
              >
                {projectsOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                <FolderKanban className="size-3.5" />
                Projects
              </button>
              {projectsOpen && (
                <div className="ml-2 pl-3 border-l border-border/40 space-y-0.5 mt-1">
                  {projects.map((item) => (
                    <button
                      key={item.label}
                      className="flex items-center w-full p-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                    >
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <button
                onClick={() => setTagsOpen(!tagsOpen)}
                className="flex items-center gap-1.5 w-full px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
              >
                {tagsOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                <Tags className="size-3.5" />
                Tags
              </button>
              {tagsOpen && (
                <div className="flex flex-wrap gap-1.5 mt-1.5 px-2.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-muted/30 text-[11px] text-muted-foreground border border-border/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Knowledge */}
            <div>
              <div className="flex items-center gap-1.5 px-2.5 py-1">
                <BookOpen className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Knowledge</span>
              </div>
              <div className="ml-2 pl-3 border-l border-border/40 space-y-0.5 mt-1">
                {["Wiki", "Documents", "Training"].map((item) => (
                  <button
                    key={item}
                    className="flex items-center w-full p-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                  >
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </nav>

      <div className={cn("p-2 border-t border-border/30 space-y-1", isCollapsed && "flex flex-col items-center gap-1")}>
        {isCollapsed ? (
          <>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-center py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <button
              onClick={toggleCollapsed}
              className="w-full flex items-center justify-center py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
              title="Expand sidebar"
            >
              <ChevronLeft className="size-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              <span className="text-xs">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
            <button
              onClick={toggleCollapsed}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="size-4" />
              <span className="text-xs">Collapse</span>
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
