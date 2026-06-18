"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MapPin, Package, Search, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { downloadCSV, downloadPDF } from "@/lib/export"
import { format } from "date-fns"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"

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
 const [filters, setFilters] = useState<Record<string, string | null>>({})
 const router = useRouter()
 const handleNew = useCallback(() => router.push("/deliveries/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/deliveries")
 .then(r => r.json())
 .then((data) => { if (Array.isArray(data)) setDeliveries(data) })
 .finally(() => setLoading(false))
 }, [])

 const filterColumns: FilterColumn[] = [
   { key: "status", label: "Status", getValue: (d) => d.status },
   { key: "carrier", label: "Carrier", getValue: (d) => d.carrier || "" },
   { key: "distributor", label: "Distributor", getValue: (d) => d.distributor.name },
 ]

 const filtered = deliveries.filter((d) => {
   for (const [key, value] of Object.entries(filters)) {
     if (!value) continue
     const col = filterColumns.find((c) => c.key === key)
     if (col && col.getValue(d) !== value) return false
   }
   if (!search) return true
   return [d.number, d.status, d.distributor.name, d.carrier]
   .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
 })

 const allColumns = [
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
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold tracking-tight">Deliveries</h1>
 <p className="text-sm text-muted-foreground mt-1">Track and manage deliveries to distributors</p>
 </div>
 <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>New Delivery <ShortcutBadge shortcut="⌘C" />
 </Button>
 </div>

 <div className="flex items-center justify-between flex-wrap gap-3">
 <div className="flex items-center gap-3">
   {filtered.length > 0 && (
     <>
       <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={deliveries} />
       <ViewToggle view={view} onChange={setView} />
       <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
     </>
   )}
 </div>
 <div className="flex items-center gap-3">
   {filtered.length > 0 && (
     <div className="relative">
       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
       <Input placeholder="Search deliveries..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
     </div>
   )}
   <MoreMenu actions={[
     { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Number", "Status", "Distributor", "Carrier", "Est.Date", "Items", "Value"], filtered.map(d => [d.number, d.status, d.distributor.name, d.carrier || "", d.estimatedDate, d.totalItems, d.totalValue]), "deliveries.csv") },
     { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Deliveries", []) },
   ]} />
 </div>
 </div>

 {loading ? (
 <SkeletonTable rows={6} columns={columns.length} />
 ) : filtered.length === 0 ? (
 <EmptyState
 icons={[<Truck className="w-5 h-5" />, <Package className="w-5 h-5" />, <MapPin className="w-5 h-5" />]}
 title="No deliveries found"
 description="Create your first delivery."
 />
 ) : (
 <div data-slot="frame">
 <Table>
 <TableHeader>
 <TableRow>
 {columns.map((col) => (
 <TableHead key={col.key} className={col.className}>{col.label}</TableHead>
 ))}
 </TableRow>
 </TableHeader>
 <TableBody>
 {filtered.map((item) => (
 <TableRow key={item.id}>
 {columns.map((col) => (
 <TableCell key={col.key} className={col.cellClassName}>
 {col.render ? col.render(item) : String((item as any)[col.key] ?? "")}
 </TableCell>
 ))}
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 )}
 </div>
 )
}
