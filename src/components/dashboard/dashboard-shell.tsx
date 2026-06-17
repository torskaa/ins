"use client"

import { useState, useCallback, useEffect } from "react"
import { useDashboardStore } from "./dashboard-store"
import { WIDGET_REGISTRY } from "./widget-registry"
import { Button } from "@/components/ui/button"
import { MetricCardsRow } from "./widget/metric-cards-row"
import { RevenueChart } from "./widget/revenue-chart"
import { LowStockWidget } from "./widget/low-stock"
import { RecentOrdersWidget } from "./widget/recent-orders"
import { TopProductsWidget } from "./widget/top-products"
import { SalesCategoryWidget } from "./widget/sales-category"
import { PaymentStatusWidget } from "./widget/payment-status"
import { CustomerAcquisitionWidget } from "./widget/customer-acquisition"
import { RichMenu } from "./rich-menu"
import { WidgetSidebar } from "./widget-sidebar"
import { LayoutDashboard } from "lucide-react"

type WidgetComponent = React.FC<{ compact?: boolean }>

const WIDGET_MAP: Record<string, WidgetComponent> = {
 metrics: MetricCardsRow,
 "revenue-chart": RevenueChart,
 "low-stock": LowStockWidget,
 "recent-orders": RecentOrdersWidget,
 "top-products": TopProductsWidget,
 "sales-category": SalesCategoryWidget,
 "payment-status": PaymentStatusWidget,
 "customer-acquisition": CustomerAcquisitionWidget,
}

const ROW_HEIGHT = 100
const COMPACT_ROW_HEIGHT = 80

function colSpan(w: number): string {
 if (w >= 12) return "col-span-12"
 if (w >= 10) return "col-span-10"
 if (w >= 8) return "col-span-8"
 if (w >= 6) return "col-span-6"
 if (w >= 4) return "col-span-4"
 if (w >= 3) return "col-span-3"
 if (w >= 2) return "col-span-2"
 return "col-span-1"
}

export function DashboardShell() {
 const { layouts, visibleWidgets, addWidget, removeWidget, resetLayout } = useDashboardStore()
 const [sidebarOpen, setSidebarOpen] = useState(false)
 const compact = true

 useEffect(() => {
 function handleKeyDown(e: KeyboardEvent) {
 if ((e.metaKey || e.ctrlKey) && e.key === "j") {
 e.preventDefault()
 setSidebarOpen((prev) => !prev)
 }
 }
 window.addEventListener("keydown", handleKeyDown)
 return () => window.removeEventListener("keydown", handleKeyDown)
 }, [])

 const visibleLayouts = layouts.filter((l) => visibleWidgets.includes(l.i))
 const hiddenWidgets = WIDGET_REGISTRY.filter((w) => !visibleWidgets.includes(w.id))
 const rh = compact ? COMPACT_ROW_HEIGHT : ROW_HEIGHT

 const renderWidget = useCallback((widgetId: string) => {
 const Component = WIDGET_MAP[widgetId]
 if (!Component) return null
 return <Component compact={compact} />
 }, [compact])

 return (
 <div className="max-w-7xl mx-auto w-full overflow-x-hidden animate-fade-in pb-16">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h1 className="text-xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
 <p className="text-sm text-slate-500 mt-0.5">Bento grid layout · add/remove widgets from the library</p>
 </div>
 <div className="flex items-center gap-3">
 <Button size="sm" variant="ghost" onClick={resetLayout} className="h-8 text-xs gap-1.5 text-slate-400">
 Reset
 </Button>
 <RichMenu />
 <Button size="sm" onClick={() => setSidebarOpen(true)} className="h-8 gap-1.5 text-xs shadow-sm">
 Widgets
 <kbd className="text-[9px] px-1 py-0.5 rounded bg-white/20 text-white/70 font-mono ml-0.5">⌘J</kbd>
 </Button>
 </div>
 </div>

 {visibleLayouts.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-24 text-center">
 <LayoutDashboard className="w-10 h-10 text-slate-200 mb-3" />
 <p className="text-sm font-medium text-slate-500">No widgets yet</p>
 <p className="text-xs text-slate-400 mt-1 mb-4">Add widgets to start building your dashboard</p>
 <Button size="sm" onClick={() => { hiddenWidgets.forEach((w) => addWidget(w.id)); resetLayout() }}>
 Restore Defaults
 </Button>
 </div>
 ) : (
 <div className="grid grid-cols-12 gap-6 auto-rows-auto w-full">
 {visibleLayouts.map((item) => (
 <div
 key={item.i}
 className={`relative bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 overflow-hidden group ${colSpan(item.w)}`}
 style={{ minHeight: rh * item.h }}
 >
 <div className="absolute top-0 right-0 z-10 flex items-center gap-1 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button
 onClick={() => removeWidget(item.i)}
 className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
 title="Remove widget"
 >
 </button>
 </div>
 <div className="h-full overflow-y-auto scroll-smooth">
 {renderWidget(item.i)}
 </div>
 </div>
 ))}
 </div>
 )}

 <WidgetSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
 </div>
 )
}
