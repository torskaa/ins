"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, Search, Puzzle, FileText, Image, Table, Code, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActionItem {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  shortcut?: string
  submenu?: ActionItem[]
}

interface ActionCommandMenuProps {
  onAction?: (actionId: string) => void
  onInsertText?: (text: string) => void
}

const actionGroups: { label: string; items: ActionItem[] }[] = [
  {
    label: "File Uploads",
    items: [
      { id: "upload-image", icon: Image, label: "Upload Image", shortcut: "⌘I" },
      { id: "upload-document", icon: FileText, label: "Upload Document", shortcut: "⌘D" },
      { id: "upload-table", icon: Table, label: "Upload Spreadsheet", shortcut: "⌘⇧T" },
    ],
  },
  {
    label: "Content",
    items: [
      { id: "code", icon: Code, label: "Code Block", shortcut: "⌘K" },
      { id: "search", icon: Search, label: "Search Knowledge", shortcut: "⌘⇧F" },
      {
        id: "add-to-project", icon: Puzzle, label: "Add to Project", shortcut: "⌘P",
        submenu: [
          { id: "project-q2", icon: Puzzle, label: "Q2 Planning" },
          { id: "project-warehouse", icon: Puzzle, label: "Warehouse Audit" },
          { id: "project-migration", icon: Puzzle, label: "Migration" },
        ],
      },
    ],
  },
]

export function ActionCommandMenu({ onAction, onInsertText }: ActionCommandMenuProps) {
  const [open, setOpen] = useState(false)
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingUploadType, setPendingUploadType] = useState<string | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setSubmenuOpen(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleAction(item: ActionItem) {
    if (item.submenu) return

    if (item.id.startsWith("upload-")) {
      setPendingUploadType(item.id)
      fileInputRef.current?.click()
      setOpen(false)
      return
    }

    if (item.id === "code" && onInsertText) {
      onInsertText("```\n\n```")
    }

    if (item.id === "search" && onInsertText) {
      onInsertText("/search ")
    }

    onAction?.(item.id)
    setOpen(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files && files.length > 0) {
      onAction?.("upload:" + pendingUploadType)
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
    setPendingUploadType(null)
  }

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={
          pendingUploadType === "upload-image" ? "image/*" :
          pendingUploadType === "upload-table" ? ".csv,.xlsx,.xls" :
          ".pdf,.doc,.docx,.txt"
        }
        onChange={handleFileChange}
      />
      <button
        ref={buttonRef}
        onClick={() => { setOpen(!open); setSubmenuOpen(null) }}
        className="flex items-center justify-center size-8 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/20 transition-colors"
        aria-label="Action menu"
      >
        <Plus className="size-4" />
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-border/60 bg-popover ring-1 ring-foreground/5 overflow-hidden animate-scale-in origin-bottom-left"
        >
          {actionGroups.map((group, gi) => {
            const Icon = group.label === "File Uploads" ? Image : Code
            return (
              <div key={group.label}>
                {gi > 0 && <div className="mx-2 h-px bg-border/50" />}
                <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const ItemIcon = item.icon
                  const hasSubmenu = item.submenu && item.submenu.length > 0
                  const isSubmenuOpen = submenuOpen === item.id

                  return (
                    <div key={item.id} className="relative">
                      <button
                        onClick={() => {
                          if (hasSubmenu) {
                            setSubmenuOpen(isSubmenuOpen ? null : item.id)
                          } else {
                            handleAction(item)
                          }
                        }}
                        className={cn(
                          "flex items-center justify-between w-full px-3 py-2 text-sm transition-colors hover:bg-muted/20",
                          isSubmenuOpen && "bg-muted/10"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <ItemIcon className="size-4 text-muted-foreground" />
                          <span>{item.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {item.shortcut && (
                            <span className="text-[10px] text-muted-foreground/40 font-mono">{item.shortcut}</span>
                          )}
                          {hasSubmenu && <ChevronRight className="size-3.5 text-muted-foreground/60" />}
                        </div>
                      </button>

                      {hasSubmenu && isSubmenuOpen && (
                        <div className="ml-4 pl-3 border-l border-border/40 space-y-0.5 pb-1">
                          {item.submenu!.map((sub) => {
                            const SubIcon = sub.icon
                            return (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  onAction?.(sub.id)
                                  setOpen(false)
                                }}
                                className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded-md transition-colors"
                              >
                                <SubIcon className="size-3.5" />
                                {sub.label}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
