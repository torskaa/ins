"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Package, Truck, Clock, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { downloadCSV, downloadPDF } from "@/lib/export"
import { format } from "date-fns"

type Delivery = {
 id: string
 number: string
 status: string
 carrier: string | null
 estimatedDate: string | null
 totalItems: number
 totalValue: number
 distributor: { id: string; name: string; territory: string | null }
 _count: { items: number; tracking: number }
}

const statusColors: Record<string, string> = {
 draft: "bg-slate-100 text-slate-600",
 packing: "bg-amber-100 text-amber-700",
 shipped: "bg-blue-100 text-blue-700",
 in_transit: "bg-purple-100 text-purple-700",
 delivered: "bg-emerald-100 text-emerald-700",
 failed: "bg-red-100 text-red-700",
 cancelled: "bg-slate-100 text-slate-600",
}

const statusFilters = ["all", "draft", "packing", "shipped", "in_transit", "delivered", "failed", "cancelled"]

const PROPERTY_OPTIONS = [
 { key: "distributor", label: "Distributor" },
 { key: "carrier", label: "Carrier" },
 { key: "estimatedDate", label: "Est. Date" },
 { key: "totalItems", label: "Items" },
]

const DEFAULT_PROPS = ["distributor", "carrier", "estimatedDate", "totalItems"]

export default function DeliveriesPage() {
 const [deliveries, setDeliveries] = useState<Delivery[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("")
 const [view, setView] = useState<"cards" | "rows">("rows")
 const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
 const [statusFilter, setStatusFilter] = useState("all")
 const router = useRouter()
 const handleNew = useCallback(() => router.push("/deliveries/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/deliveries")
 .then(r => r.json())
 .then((data) => { if (Array.isArray(data)) setDeliveries(data) })
 .finally(() => setLoading(false))
 }, [])

 const statusFiltered = statusFilter === "all" ? deliveries : deliveries.filter(d => d.status === statusFilter)
 const filtered = statusFiltered.filter((d) =>
 !search || [d.number, d.status, d.distributor.name, d.carrier]
 .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
 )

 const allColumns: Column<Delivery>[] = [
 {
 key: "number",
 label: "Number",
 render: (d) => (
 <button onClick={() => router.push(`/deliveries/${d.id}`)} className="font-medium text-left hover:text-primary transition-colors font-mono text-sm">
 {d.number}
 </button>
 ),
 },
 {
 key: "status",
 label: "Status",
 render: (d) => <Badge className={`${statusColors[d.status] || ""} border-0 font-medium`}>{d.status}</Badge>,
 },
 {
 key: "distributor",
 label: "Distributor",
 render: (d) => (
 <div className="text-sm">
 <span className="font-medium">{d.distributor.name}</span>
 {d.distributor.territory && <span className="block text-xs text-muted-foreground">{d.distributor.territory}</span>}
 </div>
 ),
 },
 {
 key: "carrier",
 label: "Carrier",
 render: (d) => <span className="text-sm text-muted-foreground">{d.carrier || "—"}</span>,
 },
 {
 key: "estimatedDate",
 label: "Est. Date",
 render: (d) => (
 <span className="text-sm text-muted-foreground">
 {d.estimatedDate ? format(new Date(d.estimatedDate), "dd/MM/yy") : "—"}
 </span>
 ),
 },
 {
 key: "totalItems",
 label: "Items",
 cellClassName: "font-mono text-sm text-muted-foreground",
 render: (d) => <span>{d.totalItems}</span>,
 },
 ]

 const columns = allColumns.filter((c) => props.includes(c.key))

 return (
 <div className="space-y-6 animate-fade-in">
 <div className="flex items-center justify-between flex-wrap gap-4">
 <div>
 <h1 className="text-2xl font-semibold tracking-tight">Deliveries</h1>
 <p className="text-sm text-muted-foreground mt-1">Track and manage deliveries to distributors</p>
 </div>
 <div className="flex items-center gap-3">
 {filtered.length > 0 && (
 <>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
<Input placeholder="Search deliveries..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
 </div>
 <ViewToggle view={view} onChange={setView} />
 <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
 </>
 )}
 <MoreMenu actions={[
 { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Number", "Status", "Distributor", "Carrier", "Est.Date", "Items", "Value"], filtered.map(d => [d.number, d.status, d.distributor.name, d.carrier || "", d.estimatedDate, d.totalItems, d.totalValue]), "deliveries.csv") },
 { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Deliveries", []) },
 ]} />
 <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>
 <Plus className="w-4 h-4" /> New Delivery <ShortcutBadge shortcut="⌘C" />
 </Button>
 </div>
 </div>

 <div className="flex items-center gap-2 flex-wrap">
 {statusFilters.map((s) => (
 <button
 key={s}
 onClick={() => setStatusFilter(s)}
 className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
 statusFilter === s
 ? "bg-primary text-white"
 : "bg-surface text-muted-foreground hover:text-foreground"
 }`}
 >
 {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
 </button>
 ))}
 </div>

 <DataTable
 columns={columns}
 data={filtered}
 loading={loading}
 empty={{
 icons: [, , ],
 title: "No deliveries found",
 description: statusFilter !== "all" ? "No deliveries with this status." : "Create your first delivery.",
 }}
 />
 </div>
 )
}
