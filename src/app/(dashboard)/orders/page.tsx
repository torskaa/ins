"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { SemanticBadge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, ClipboardList, Search, ShoppingCart } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useRouter, useSearchParams } from "next/navigation"
import { downloadCSV, downloadPDF } from "@/lib/export"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"

type Order = {
 id: string
 number: string
 type: string
 status: string
 total: number
 orderDate: string
 customer: { name: string } | null
 supplier: { name: string } | null
 items: any[]
}



const PROPERTY_OPTIONS = [
 { key: "items", label: "Items" },
 { key: "total", label: "Total" },
 { key: "status", label: "Status" },
 { key: "orderDate", label: "Date" },
]

const DEFAULT_PROPS = ["items", "total", "status", "orderDate"]
const PAGE_SIZE = 10

function OrdersContent() {
 const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
 const [search, setSearch] = useState("")
 const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [page, setPage] = useState(1)
  const router = useRouter()
 const searchParams = useSearchParams()
 const type = searchParams.get("type") || "sales"
 const handleNew = useCallback(() => router.push(`/orders/new?type=${type}`), [router, type])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch(`/api/orders?type=${type}`)
 .then((res) => res.json())
  .then((json) => { if (json?.success && Array.isArray(json.data)) setOrders(json.data); else if (!json?.success) throw new Error(json?.error || "Failed to load") })
  .catch((err) => { setError(err.message || "Failed to load data"); setLoading(false) })
  .finally(() => setLoading(false))
 }, [type])

  const filterColumns: FilterColumn[] = [
    { key: "status", label: "Status", getValue: (o: Order) => o.status },
    { key: "type", label: "Type", getValue: (o: Order) => o.type },
    { key: "customer", label: "Customer", getValue: (o: Order) => o.customer?.name || "" },
    { key: "supplier", label: "Supplier", getValue: (o: Order) => o.supplier?.name || "" },
  ]

  const filtered = orders.filter((o) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const col = filterColumns.find((c) => c.key === key)
      if (col && col.getValue(o) !== value) return false
    }
    if (!search) return true
    return [o.number, o.status, o.customer?.name, o.supplier?.name]
      .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const safePage = Math.min(page, Math.max(totalPages, 1))
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, filters])

  const allColumns = [
 {
 key: "number",
 label: "Order #",
  render: (o: Order) => <span className="font-mono text-xs font-medium">{o.number}</span>,
  },
  {
  key: "party",
  label: type === "sales" ? "Customer" : "Supplier",
  render: (o: Order) => <span className="font-medium">{type === "sales" ? o.customer?.name || "—" : o.supplier?.name || "—"}</span>,
  },
   {
   key: "items",
   label: "Items",
   render: (o: Order) => <span className="text-sm text-foreground">{o.items?.length || 0} items</span>,
   },
   {
   key: "total",
   label: "Total",
   className: "text-right",
   cellClassName: "text-right",
   render: (o: Order) => <span className="font-mono text-sm font-medium">{formatCurrency(o.total)}</span>,
   },
   {
   key: "status",
   label: "Status",
   render: (o: Order) => (
<SemanticBadge semantic={o.status} category="status" className="">
    {o.status}
    </SemanticBadge>
   ),
   },
   {
   key: "orderDate",
   label: "Date",
   render: (o: Order) => <span className="text-sm text-foreground">{formatDate(new Date(o.orderDate))}</span>,
   },
 ]

 const columns = allColumns.filter((c) => c.key === "number" || props.includes(c.key))

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-foreground mt-1">Manage sales and purchase orders</p>
        </div>
        <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>
          New Order <ShortcutBadge shortcut="⌘C" />
        </Button>
      </div>

      <div className="mb-6">
        <Tabs value={type} onValueChange={(v) => router.push(`/orders?type=${v}`)}>
          <TabsList>
            <TabsTrigger value="sales" className="gap-1.5">
              <ShoppingCart className="w-4 h-4" />
              Sales Orders
            </TabsTrigger>
            <TabsTrigger value="purchase">Purchase Orders</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 [&_.text-muted-foreground]:text-foreground">
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <>
              <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={orders} />
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
            { label: "Import", icon: ActionIcons.AddNew },
            "separator",
            { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Order #", "Type", "Customer", "Status", "Total", "Date"], orders.map(o => [o.number, o.type, o.customer?.name, o.status, o.total, o.orderDate]), "orders.csv") },
            { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Orders", []) },
            "separator",
            { label: "Refresh", icon: ActionIcons.Refresh },
          ]} />
        </div>
      </div>

      {error ? (
        <EmptyState
          variant="error"
          title="Failed to load data"
          description={error}
          actions={[{ label: "Try again", onClick: () => window.location.reload() }]}
        />
      ) : loading ? (
        <SkeletonTable rows={6} columns={columns.length} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icons={[<ShoppingCart className="w-5 h-5" />, <ClipboardList className="w-5 h-5" />, <Calendar className="w-5 h-5" />]}
          title={`No ${type} orders`}
          description={`Create your first ${type} order to get started.`}
          actions={[{ label: "New Order", onClick: () => router.push(`/orders/new?type=${type}`) }]}
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
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/orders/${item.id}`)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.cellClassName}>
                      {col.render ? col.render(item) : String((item as any)[col.key] ?? "")}
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
    </>
  )
}

export default function OrdersPage() {
 return (
 <div className="space-y-6 animate-fade-in">
 <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Loading...</div>}>
 <OrdersContent />
 </Suspense>
 </div>
 )
}
