"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { Calendar, ClipboardList, Package } from "lucide-react"
import { format } from "date-fns"

type ProdOrder = {
 id: string
 number: string
 status: string
 quantity: number
 producedQty: number
 startDate: string | null
 dueDate: string | null
 product: { id: string; name: string; sku: string }
 warehouse: { id: string; name: string } | null
 _count: { materials: number; operations: number }
}

const statusColors: Record<string, string> = {
 draft: "bg-slate-100 text-slate-600",
 confirmed: "bg-blue-100 text-blue-700",
 in_progress: "bg-amber-100 text-amber-700",
 completed: "bg-emerald-100 text-emerald-700",
 cancelled: "bg-red-100 text-red-700",
}

const statusFilters = ["all", "draft", "confirmed", "in_progress", "completed", "cancelled"]

export default function ProductionOrdersPage() {
 const [data, setData] = useState<ProdOrder[]>([])
 const [loading, setLoading] = useState(true)
 const [statusFilter, setStatusFilter] = useState("all")
 const router = useRouter()
 const handleNew = useCallback(() => router.push("/production/orders/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/production-orders")
 .then(r => r.json())
 .then((d) => { if (Array.isArray(d)) setData(d) })
 .finally(() => setLoading(false))
 }, [])

 const filtered = statusFilter === "all" ? data : data.filter(d => d.status === statusFilter)

 const columns: Column<ProdOrder>[] = [
 { key: "number", label: "Order", render: (o) => (
 <button onClick={() => router.push(`/production/orders/${o.id}`)} className="font-medium text-left hover:text-primary font-mono text-sm">{o.number}</button>
 )},
 { key: "status", label: "Status", render: (o) => (
 <Badge className={`${statusColors[o.status] || ""} border-0 font-medium`}>{o.status.replace(/_/g, " ")}</Badge>
 )},
 { key: "product", label: "Product", render: (o) => (
 <div className="text-sm"><span className="font-medium">{o.product.name}</span><span className="block text-xs text-muted-foreground">{o.product.sku}</span></div>
 )},
 { key: "quantity", label: "Qty", cellClassName: "font-mono text-sm", render: (o) => <span>{o.quantity}</span> },
 { key: "producedQty", label: "Produced", cellClassName: "font-mono text-sm", render: (o) => <span className={o.producedQty > 0 ? "text-emerald-600" : "text-muted-foreground"}>{o.producedQty || "—"}</span> },
 { key: "dueDate", label: "Due Date", render: (o) => <span className="text-sm text-muted-foreground">{o.dueDate ? format(new Date(o.dueDate), "dd/MM/yy") : "—"}</span> },
 { key: "warehouse", label: "Warehouse", render: (o) => <span className="text-sm text-muted-foreground">{o.warehouse?.name || "—"}</span> },
 ]

 return (
 <div className="animate-fade-in">
 <div className="page-header flex items-center justify-between">
 <div><h1>Production Orders</h1><p>Plan and track manufacturing orders</p></div>
 <Button onClick={handleNew} className="gap-1.5">New Order <ShortcutBadge shortcut="⌘C" />
 </Button>
 </div>
 <div className="flex items-center gap-2 mb-4 flex-wrap">
 {statusFilters.map((s) => (
 <button key={s} onClick={() => setStatusFilter(s)}
 className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${statusFilter === s ? "bg-primary text-white" : "bg-surface text-muted-foreground hover:text-foreground"}`}
 >{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</button>
 ))}
 </div>
 <DataTable columns={columns} data={filtered} searchable searchPlaceholder="Search orders..." loading={loading}
 empty={{ icons: [<ClipboardList className="w-5 h-5" />, <Package className="w-5 h-5" />, <Calendar className="w-5 h-5" />],
 title: "No production orders", description: "Create your first manufacturing order." }}
 />
 </div>
 )
}
