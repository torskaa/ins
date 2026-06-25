"use client"

import { useState, useRef, useEffect } from "react"
import { Package, ShoppingCart, BarChart3, Users, Globe, ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const contexts = [
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "finance", label: "Finance", icon: BarChart3 },
  { id: "crm", label: "CRM", icon: Users },
]

interface CopilotContextBarProps {
  activeContext: string | null
  onSelectContext: (context: string | null) => void
}

export function CopilotContextBar({ activeContext, onSelectContext }: CopilotContextBarProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const active = contexts.find((c) => c.id === activeContext)
  const Icon = active?.icon

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function select(value: string | null) {
    onSelectContext(value)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground bg-transparent rounded-full hover:bg-muted/20 hover:text-foreground transition-colors duration-150"
      >
        {activeContext && Icon ? (
          <>
            <Icon className="size-3.5" />
            <span className="truncate">{active.label}</span>
          </>
        ) : (
          <>
            <Globe className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">All contexts</span>
          </>
        )}
        <ChevronDown className="size-3 text-muted-foreground/60 ml-auto" />
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-border/60 bg-popover ring-1 ring-foreground/5 overflow-hidden animate-scale-in origin-bottom-left"
        >
          <div className="py-1">
            <button
              onClick={() => select(null)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 text-sm text-left transition-colors hover:bg-muted/20",
                !activeContext && "bg-muted/10"
              )}
            >
              <div className="flex items-center justify-center size-8 rounded-lg bg-muted/20 shrink-0">
                <Globe className={cn("size-4", !activeContext ? "text-foreground" : "text-muted-foreground")} />
              </div>
              <div className="flex-1">
                <span className={cn("text-sm font-medium", !activeContext && "text-foreground")}>All contexts</span>
              </div>
              {!activeContext && <Check className="size-4 text-foreground shrink-0" />}
            </button>

            <div className="mx-3 h-px bg-border/50 my-1" />

            {contexts.map((ctx) => {
              const CtxIcon = ctx.icon
              const isActive = ctx.id === activeContext
              return (
                <button
                  key={ctx.id}
                  onClick={() => select(ctx.id)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 text-sm text-left transition-colors hover:bg-muted/20",
                    isActive && "bg-muted/10"
                  )}
                >
                  <div className="flex items-center justify-center size-8 rounded-lg bg-muted/20 shrink-0">
                    <CtxIcon className={cn("size-4", isActive ? "text-foreground" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1">
                    <span className={cn("text-sm font-medium", isActive && "text-foreground")}>{ctx.label}</span>
                  </div>
                  {isActive && <Check className="size-4 text-foreground shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
