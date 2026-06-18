"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Activity, Package, Warehouse, Search } from "lucide-react"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { formatDate, formatCurrency } from "@/lib/utils"

type Movement = { id: string; type: string; quantity: number; reference: string; createdAt: string; product: { id: string; name: string; sku: string }; warehouse: { id: string; name: string } }

const TYPE_COLORS: Record<string, string> = {
 received: "bg-emerald-100 text-emerald-700", sold: "bg-red-100 text-red-700",
 adjusted: "bg-orange-100 text-orange-700", transferred: "bg-blue-100 text-blue-700",
 returned: "bg-purple-100 text-purple-700", damaged: "bg-red-100 text-red-700",
 issued: "bg-yellow-100 text-yellow-700", produced: "bg-green-100 text-green-700",
}

const PROPERTY_OPTIONS = [
 { key: "product", label: "Product" },
 { key: "quantity", label: "Qty" },
 { key: "warehouse", label: "Warehouse" },
 { key: "reference", label: "Reference" },
]

const DEFAULT_PROPS = ["product", "quantity", "warehouse", "reference"]

export default function StockMovementsPage() {
 const router = useRouter()
 const [movements, setMovements] = useState<Movement[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("")
 const [view, setView] = useState<"cards" | "rows">("rows")
 const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})

  useEffect(() => {
  setLoading(true)
  fetch("/api/stock-movements?limit=200")
  .then(r => r.json()).then(d => { if (d.movements) setMovements(d.movements) }).finally(() => setLoading(false))
  }, [])

  const filterColumns: FilterColumn[] = [
   { key: "type", label: "Type", getValue: (m: Movement) => m.type },
  ]

  const filtered = movements.filter((m) => {
   for (const [key, value] of Object.entries(filters)) {
    if (!value) continue
    const col = filterColumns.find((c) => c.key === key)
    if (col && col.getValue(m) !== value) return false
   }
   if (!search) return true
   return [m.type, m.product?.name, m.product?.sku, m.warehouse?.name, m.reference].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  })

  const allColumns = [
 { key: "createdAt", label: "Date", render: (m) => <span className="text-sm">{formatDate(new Date(m.createdAt))}</span> },
 { key: "type", label: "Type", render: (m) => <Badge className={TYPE_COLORS[m.type] || ""}>{m.type}</Badge> },
 { key: "product", label: "Product", render: (m) => <span className="font-medium">{m.product?.name || "—"} <span className="text-xs text-muted-foreground font-mono">{m.product?.sku}</span></span> },
 { key: "quantity", label: "Qty", render: (m) => <span className={`font-mono ${m.quantity > 0 ? "text-emerald-600" : "text-red-600"}`}>{m.quantity > 0 ? "+" : ""}{m.quantity}</span> },
 { key: "warehouse", label: "Warehouse", render: (m) => <span className="text-sm text-muted-foreground">{m.warehouse?.name || "—"}</span> },
 { key: "reference", label: "Reference", render: (m) => <span className="text-xs font-mono text-muted-foreground">{m.reference || "—"}</span> },
 ]

 const columns = allColumns.filter((c) => props.includes(c.key))

 return (
 <div className="space-y-6 animate-fade-in">
 <div className="flex items-center justify-between flex-wrap gap-4">
 <div>
 <h1 className="text-2xl font-semibold tracking-tight">Stock Movements</h1>
 <p className="text-sm text-muted-foreground mt-1">Track all inventory changes across the system</p>
 </div>
  <div className="flex items-center gap-3">
   <div className="flex items-center gap-3">
    {filtered.length > 0 && (
     <>
      <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={movements} />
      <ViewToggle view={view} onChange={setView} />
      <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
     </>
    )}
   </div>
   <div className="flex items-center gap-3">
    {filtered.length > 0 && (
     <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input placeholder="Search movements..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
     </div>
    )}
   </div>
  </div>
 </div>
   {loading ? (
    <SkeletonTable rows={6} columns={columns.length} />
   ) : filtered.length === 0 ? (
    <EmptyState
     icons={[<Activity className="w-5 h-5" />, <Package className="w-5 h-5" />, <Warehouse className="w-5 h-5" />]}
     title="No movements yet"
     description="Stock movements are recorded automatically."
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
       {filtered.map((m) => (
        <TableRow key={m.id}>
         {columns.map((col) => (
          <TableCell key={col.key} className={col.cellClassName}>
           {col.render ? col.render(m) : String((m as any)[col.key] ?? "")}
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
