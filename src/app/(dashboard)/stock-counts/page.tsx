"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Calculator, ClipboardList, Search, Warehouse } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { downloadCSV, downloadPDF } from "@/lib/export"
import { format } from "date-fns"

type StockCount = {
 id: string
 number: string
 status: string
 countDate: string
 totalItems: number
 matchedItems: number
 discrepancyItems: number
 warehouse: { id: string; name: string; location: string | null }
 _count: { items: number }
}

const statusColors: Record<string, string> = {
 draft: "bg-slate-100 text-slate-600",
 in_progress: "bg-blue-100 text-blue-700",
 completed: "bg-emerald-100 text-emerald-700",
 cancelled: "bg-red-100 text-red-700",
}

const PROPERTY_OPTIONS = [
 { key: "warehouse", label: "Warehouse" },
 { key: "countDate", label: "Count Date" },
 { key: "totalItems", label: "Items" },
 { key: "discrepancyItems", label: "Discrepancies" },
]

const DEFAULT_PROPS = ["warehouse", "countDate", "totalItems", "discrepancyItems"]

export default function StockCountsPage() {
 const [stockCounts, setStockCounts] = useState<StockCount[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("")
 const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const router = useRouter()
 const handleNew = useCallback(() => router.push("/stock-counts/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/stock-counts")
 .then(r => r.json())
 .then((data) => { if (Array.isArray(data)) setStockCounts(data) })
 .finally(() => setLoading(false))
 }, [])

  const filterColumns: FilterColumn[] = [
   { key: "status", label: "Status", getValue: (s: StockCount) => s.status },
   { key: "warehouse", label: "Warehouse", getValue: (s: StockCount) => s.warehouse.name },
  ]

  const filtered = stockCounts.filter((s) => {
   for (const [key, value] of Object.entries(filters)) {
    if (!value) continue
    const col = filterColumns.find((c) => c.key === key)
    if (col && col.getValue(s) !== value) return false
   }
   if (!search) return true
   return [s.number, s.status, s.warehouse.name].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  })

  const allColumns = [
 {
 key: "number",
 label: "Number",
 render: (s) => (
 <button onClick={() => router.push(`/stock-counts/${s.id}`)} className="font-medium text-left hover:text-primary transition-colors font-mono text-sm">
 {s.number}
 </button>
 ),
 },
 {
 key: "status",
 label: "Status",
 render: (s) => <Badge className={`${statusColors[s.status] || ""} border-0 font-medium`}>{s.status.replace(/_/g, " ")}</Badge>,
 },
 {
 key: "warehouse",
 label: "Warehouse",
 render: (s) => (
 <div className="text-sm">
 <span className="font-medium">{s.warehouse.name}</span>
 {s.warehouse.location && <span className="block text-xs text-muted-foreground">{s.warehouse.location}</span>}
 </div>
 ),
 },
 {
 key: "countDate",
 label: "Count Date",
 render: (s) => <span className="text-sm text-muted-foreground">{format(new Date(s.countDate), "dd/MM/yy")}</span>,
 },
 {
 key: "totalItems",
 label: "Items",
 cellClassName: "font-mono text-sm text-muted-foreground",
 render: (s) => <span>{s.totalItems}</span>,
 },
 {
 key: "discrepancyItems",
 label: "Discrepancies",
 render: (s) => (
 <span className={`font-mono text-sm ${s.discrepancyItems > 0 ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
 {s.discrepancyItems}
 </span>
 ),
 },
 ]

 const columns = allColumns.filter((c) => props.includes(c.key))

 return (
 <div className="space-y-6 animate-fade-in">
  <div className="flex items-center justify-between">
  <div>
  <h1 className="text-2xl font-semibold tracking-tight">Stock Counts</h1>
  <p className="text-sm text-muted-foreground mt-1">Inventory counting sessions and discrepancy reports</p>
  </div>
  <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>
   New Stock Count <ShortcutBadge shortcut="⌘C" />
  </Button>
  </div>
  <div className="flex items-center justify-between flex-wrap gap-3">
   <div className="flex items-center gap-3">
    {filtered.length > 0 && (
     <>
      <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={stockCounts} />
      <ViewToggle view={view} onChange={setView} />
      <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
     </>
    )}
   </div>
   <div className="flex items-center gap-3">
    {filtered.length > 0 && (
     <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input placeholder="Search stock counts..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
     </div>
    )}
    <MoreMenu actions={[
     { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Number", "Status", "Warehouse", "Count Date", "Items", "Matched", "Discrepancies"], stockCounts.map(s => [s.number, s.status, s.warehouse.name, s.countDate, s.totalItems, s.matchedItems, s.discrepancyItems]), "stock-counts.csv") },
     { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Stock Counts", []) },
    ]} />
   </div>
  </div>

   {loading ? (
    <SkeletonTable rows={6} columns={columns.length} />
   ) : filtered.length === 0 ? (
    <EmptyState
     icons={[<ClipboardList className="w-5 h-5" />, <Warehouse className="w-5 h-5" />, <Calculator className="w-5 h-5" />]}
     title="No stock counts yet"
     description="Start your first inventory count session."
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
       {filtered.map((s) => (
        <TableRow key={s.id}>
         {columns.map((col) => (
          <TableCell key={col.key} className={col.cellClassName}>
           {col.render ? col.render(s) : String((s as any)[col.key] ?? "")}
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
