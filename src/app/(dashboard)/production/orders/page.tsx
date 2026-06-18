"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { Search, Calendar, ClipboardList, Package } from "lucide-react"
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
const [search, setSearch] = useState("")
const [filters, setFilters] = useState<Record<string, string | null>>({})
const router = useRouter()
 const handleNew = useCallback(() => router.push("/production/orders/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/production-orders")
 .then(r => r.json())
 .then((d) => { if (Array.isArray(d)) setData(d) })
 .finally(() => setLoading(false))
 }, [])

const filterColumns: FilterColumn[] = [
  { key: "status", label: "Status", getValue: (p: ProdOrder) => p.status },
  { key: "product", label: "Product", getValue: (p: ProdOrder) => p.product.name },
]

const filtered = data.filter((d) => {
  if (statusFilter !== "all" && d.status !== statusFilter) return false
  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue
    const col = filterColumns.find((c) => c.key === key)
    if (col && col.getValue(d) !== value) return false
  }
  if (!search) return true
  return [d.number, d.status, d.product.name, d.product.sku, d.warehouse?.name]
    .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
})

const columns = [
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Production Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Plan and track manufacturing orders</p>
        </div>
        <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>New Order <ShortcutBadge shortcut="⌘C" />
        </Button>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={data} />
          )}
        </div>
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search orders..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {statusFilters.map((s) => (
        <button key={s} onClick={() => setStatusFilter(s)}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${statusFilter === s ? "bg-primary text-white" : "bg-surface text-muted-foreground hover:text-foreground"}`}
        >{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</button>
        ))}
      </div>

      {loading ? (
        <SkeletonTable rows={6} columns={columns.length} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icons={[<ClipboardList className="w-5 h-5" />, <Package className="w-5 h-5" />, <Calendar className="w-5 h-5" />]}
          title="No production orders"
          description="Create your first manufacturing order."
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
