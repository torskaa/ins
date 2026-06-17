"use client"

import { createContext, useContext, useState, useId, type ReactNode } from "react"

interface TabsContext {
 value: string
 onValueChange: (v: string) => void
 baseId: string
}

const TabsCtx = createContext<TabsContext | null>(null)

export function Tabs({
 value,
 onValueChange,
 children,
 className = "",
}: {
 value: string
 onValueChange: (v: string) => void
 children: ReactNode
 className?: string
}) {
 const baseId = useId()
 return (
 <TabsCtx.Provider value={{ value, onValueChange, baseId }}>
 <div className={className}>{children}</div>
 </TabsCtx.Provider>
 )
}

export function TabsList({ children, className = "" }: { children: ReactNode; className?: string }) {
 return (
 <div
 role="tablist"
 className={`inline-flex items-center gap-0 border-b border-border/60 ${className}`}
 >
 {children}
 </div>
 )
}

export function TabsTrigger({ value, children, className = "" }: { value: string; children: ReactNode; className?: string }) {
 const ctx = useContext(TabsCtx)
 if (!ctx) return null
 const isActive = ctx.value === value
 const tabId = `${ctx.baseId}-tab-${value}`
 const panelId = `${ctx.baseId}-panel-${value}`
 return (
 <button
 role="tab"
 id={tabId}
 aria-selected={isActive}
 aria-controls={panelId}
 tabIndex={isActive ? 0 : -1}
 onClick={() => ctx.onValueChange(value)}
 onKeyDown={(e) => {
 const triggers = Array.from(
 (e.currentTarget.parentElement?.querySelectorAll('[role="tab"]') ?? [])
 )
 const idx = triggers.indexOf(e.currentTarget)
 if (e.key === "ArrowRight") {
 e.preventDefault()
 const next = triggers[(idx + 1) % triggers.length] as HTMLElement
 next?.focus()
 next?.click()
 } else if (e.key === "ArrowLeft") {
 e.preventDefault()
 const prev = triggers[(idx - 1 + triggers.length) % triggers.length] as HTMLElement
 prev?.focus()
 prev?.click()
 } else if (e.key === "Home") {
 e.preventDefault()
 const first = triggers[0] as HTMLElement
 first?.focus()
 first?.click()
 } else if (e.key === "End") {
 e.preventDefault()
 const last = triggers[triggers.length - 1] as HTMLElement
 last?.focus()
 last?.click()
 }
 }}
 className={`relative px-3 py-3 text-sm font-medium transition-all duration-150 ${
 isActive
 ? "text-foreground"
 : "text-muted-foreground hover:text-foreground"
 } ${className}`}
 >
 {children}
 {isActive && (
 <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-foreground rounded-full" />
 )}
 </button>
 )
}

export function TabsContent({ value, children, className = "" }: { value: string; children: ReactNode; className?: string }) {
 const ctx = useContext(TabsCtx)
 if (!ctx || ctx.value !== value) return null
 const panelId = `${ctx.baseId}-panel-${value}`
 const tabId = `${ctx.baseId}-tab-${value}`
 return (
 <div
 role="tabpanel"
 id={panelId}
 aria-labelledby={tabId}
 className={className}
 >
 {children}
 </div>
 )
}
