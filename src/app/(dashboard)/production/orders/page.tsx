"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { Search, Calendar, ClipboardList, Package } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { downloadCSV, downloadPDF } from "@/lib/export"
import { formatDate } from "@/lib/utils"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"

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

const PROPERTY_OPTIONS = [
  { key: "number", label: "Order" },
  { key: "status", label: "Status" },
  { key: "quantity", label: "Qty" },
  { key: "producedQty", label: "Produced" },
  { key: "dueDate", label: "Due Date" },
  { key: "warehouse", label: "Warehouse" },
]

const DEFAULT_PROPS = ["number", "status", "quantity", "producedQty", "dueDate", "warehouse"]
const PAGE_SIZE = 10

export default function ProductionOrdersPage() {
  const [data, setData] = useState<ProdOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [page, setPage] = useState(1)
  const router = useRouter()
  const handleNew = useCallback(() => router.push("/production/orders/new"), [router])
  useHotkey("c", handleNew)

  useEffect(() => {
    fetch("/api/production-orders")
      .then((r) => r.json())
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

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const safePage = Math.min(page, Math.max(totalPages, 1))
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, filters, statusFilter])

  const allColumns = [
    {
      key: "number",
      label: "Order",
      render: (o: ProdOrder) => <span className="font-mono text-xs font-medium">{o.number}</span>,
    },
    {
      key: "product",
      label: "Product",
      render: (o: ProdOrder) => (
        <div>
          <p className="font-medium">{o.product.name}</p>
          <p className="text-xs text-foreground">{o.product.sku}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      className: "w-[120px]",
      render: (o: ProdOrder) => (
        <Badge className={`${statusColors[o.status] || ""} border-0 font-medium`}>
          {o.status.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      key: "quantity",
      label: "Qty",
      className: "text-right",
      cellClassName: "text-right",
      render: (o: ProdOrder) => <span className="font-mono text-sm">{o.quantity}</span>,
    },
    {
      key: "producedQty",
      label: "Produced",
      className: "text-right",
      cellClassName: "text-right",
      render: (o: ProdOrder) => (
        <span className={"font-mono text-sm" + (o.producedQty > 0 ? " text-emerald-600" : " text-foreground")}>
          {o.producedQty || "—"}
        </span>
      ),
    },
    {
      key: "dueDate",
      label: "Due Date",
      render: (o: ProdOrder) => (
        <span className="text-sm text-foreground">{o.dueDate ? formatDate(new Date(o.dueDate)) : "—"}</span>
      ),
    },
    {
      key: "warehouse",
      label: "Warehouse",
      render: (o: ProdOrder) => <span className="text-sm text-foreground">{o.warehouse?.name || "—"}</span>,
    },
  ]

  const columns = allColumns.filter((c) => c.key === "product" || props.includes(c.key))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Production Orders</h1>
          <p className="text-sm text-foreground mt-1">Plan and track manufacturing orders</p>
        </div>
        <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>
          New Order <ShortcutBadge shortcut="⌘C" />
        </Button>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 [&_.text-muted-foreground]:text-foreground">
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={data} />
          )}
          {filtered.length > 0 && (
            <>
              <ViewToggle view={view} onChange={setView} />
              <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground" />
              <Input placeholder="Search orders..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
          <MoreMenu actions={[
            { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Order", "Status", "Product", "Quantity", "Produced", "Due Date", "Warehouse"], data.map(o => [o.number, o.status, o.product.name, o.quantity, o.producedQty, o.dueDate || "", o.warehouse?.name || ""]), "production-orders.csv") },
            { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Production Orders", []) },
          ]} />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${statusFilter === s ? "bg-primary text-white" : "bg-surface text-muted-foreground hover:text-foreground"}`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonTable rows={6} columns={columns.length} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icons={[<ClipboardList className="w-5 h-5" />, <Package className="w-5 h-5" />, <Calendar className="w-5 h-5" />]}
          title="No production orders"
          description="Create your first manufacturing order."
          actions={[{ label: "New Order", onClick: () => router.push("/production/orders/new") }]}
        />
      ) : (
        <div data-slot="frame">
          <Table className="[&_th]:px-4 [&_td]:px-4 [&_th]:py-3 [&_td]:py-3">
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.className}>{col.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((item) => (
                <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/production/orders/${item.id}`)}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.cellClassName}>
                      {col.render(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={(e) => { e.preventDefault(); setPage(safePage - 1) }}
                    className={safePage <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === safePage}
                      onClick={(e) => { e.preventDefault(); setPage(p) }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={(e) => { e.preventDefault(); setPage(safePage + 1) }}
                    className={safePage >= totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  )
}
