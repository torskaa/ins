"use client"

import { useState } from "react"
import {
 Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet"
import { WIDGET_REGISTRY, type WidgetConfig } from "./widget-registry"
import { useWidgetStore } from "./widget-store"
import { Plus, X, LayoutDashboard, Search } from "lucide-react"

interface WidgetSidebarProps {
 open: boolean
 onOpenChange: (open: boolean) => void
}

const CATEGORIES = [
 { key: "financial", label: "Financial", icon: "💰" },
 { key: "inventory", label: "Inventory", icon: "📦" },
 { key: "sales", label: "Sales", icon: "🛒" },
 { key: "crm", label: "CRM", icon: "🤝" },
 { key: "system", label: "System & Health", icon: "⚙️" },
] as const

export function WidgetSidebar({ open, onOpenChange }: WidgetSidebarProps) {
 const [searchQuery, setSearchQuery] = useState("")
 const { activeWidgets, useWidget, removeWidget } = useWidgetStore()

 const isActive = (id: string) => activeWidgets.includes(id)

 const handleToggle = (w: WidgetConfig) => {
 if (isActive(w.id)) {
 removeWidget(w.id)
 } else {
 useWidget(w.id) // eslint-disable-line react-hooks/rules-of-hooks
 }
 }

 const filtered = WIDGET_REGISTRY.filter((w) =>
 !searchQuery || w.title.toLowerCase().includes(searchQuery.toLowerCase())
 )

 const grouped = CATEGORIES.map((cat) => ({
 ...cat,
 items: filtered.filter((w) => w.category === cat.key),
 })).filter((g) => g.items.length > 0)

 return (
 <Sheet open={open} onOpenChange={onOpenChange}>
 <SheetContent side="right" className="p-0 w-[380px] sm:w-[420px]">
 <SheetHeader className="border-b border-slate-100 px-5 py-4">
 <SheetTitle className="text-sm">Widget Library</SheetTitle>
 <SheetDescription className="text-xs">
 {activeWidgets.length} of {WIDGET_REGISTRY.length} widgets active
 </SheetDescription>
 </SheetHeader>

 <div className="px-4 pt-3 pb-2">
 <div className="relative">
 <input
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search widgets..."
 className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:bg-white placeholder:text-slate-400 transition-all"
 />
 </div>
 </div>

 <div className="overflow-y-auto h-[calc(100%-8rem)] pb-6">
 {grouped.length === 0 ? (
 <div className="flex flex-col items-center py-12 px-5 text-center">
 <LayoutDashboard className="w-8 h-8 text-slate-200 mb-2" />
 <p className="text-sm text-slate-500">No widgets found</p>
 <p className="text-xs text-slate-400 mt-0.5">Try a different search term</p>
 </div>
 ) : (
 grouped.map((group) => (
 <div key={group.key} className="px-4 pt-4 first:pt-2">
 <div className="flex items-center gap-2 mb-2">
 <span className="text-xs">{group.icon}</span>
 <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
 {group.label}
 </span>
 <span className="text-[10px] text-slate-300 ml-auto">{group.items.length}</span>
 </div>

 <div className="space-y-0.5">
 {group.items.map((w) => {
 const active = isActive(w.id)
 return (
 <div
 key={w.id}
 className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group/item"
 >
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <p className="text-xs font-medium text-slate-700 truncate">{w.title}</p>
 {active && (
 <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-emerald-50 text-emerald-600 shrink-0">
 Added
 </span>
 )}
 </div>
 <p className="text-[10px] text-slate-400 truncate mt-0.5">{w.description}</p>
 </div>

 <div className="flex items-center gap-1.5 shrink-0">
 {active ? (
 <button
 onClick={() => handleToggle(w)}
 className="h-7 px-2.5 rounded-lg text-[10px] font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all flex items-center gap-1"
 >
 Remove
 </button>
 ) : (
 <button
 onClick={() => handleToggle(w)}
 className="h-7 px-2.5 rounded-lg text-[10px] font-medium bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center gap-1"
 >
 Use
 </button>
 )}
 </div>
 </div>
 )
 })}
 </div>
 </div>
 ))
 )}
 </div>
 </SheetContent>
 </Sheet>
 )
}
