"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { statusBadge } from "@/components/ui/data-table"
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

const statusColors: Record<string, "default" | "secondary" | "success" | "destructive" | "warning" | "outline"> = {
 draft: "secondary",
 confirmed: "default",
 processing: "warning",
 shipped: "default",
 delivered: "success",
 cancelled: "destructive",
}

const PROPERTY_OPTIONS = [
 { key: "items", label: "Items" },
 { key: "total", label: "Total" },
 { key: "status", label: "Status" },
 { key: "orderDate", label: "Date" },
]

const DEFAULT_PROPS = ["items", "total", "status", "orderDate"]

function OrdersContent() {
 const [orders, setOrders] = useState<Order[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("")
 const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const router = useRouter()
 const searchParams = useSearchParams()
 const type = searchParams.get("type") || "sales"
 const handleNew = useCallback(() => router.push(`/orders/new?type=${type}`), [router, type])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch(`/api/orders?type=${type}`)
 .then((res) => res.json())
 .then((data) => { if (Array.isArray(data)) setOrders(data) })
 .finally(() => setLoading(false))
 }, [type])

  const filterColumns: FilterColumn[] = [
    { key: "status", label: "Status", getValue: (o) => o.status },
    { key: "type", label: "Type", getValue: (o) => o.type },
    { key: "customer", label: "Customer", getValue: (o) => o.customer?.name || "" },
    { key: "supplier", label: "Supplier", getValue: (o) => o.supplier?.name || "" },
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

  const allColumns = [
 {
 key: "number",
 label: "Order #",
 render: (o) => <span className="font-mono text-xs font-medium">{o.number}</span>,
 },
 {
 key: "party",
 label: type === "sales" ? "Customer" : "Supplier",
 render: (o) => <span className="font-medium">{type === "sales" ? o.customer?.name || "—" : o.supplier?.name || "—"}</span>,
 },
 {
 key: "items",
 label: "Items",
 render: (o) => <span className="text-sm text-muted-foreground">{o.items?.length || 0} items</span>,
 },
 {
 key: "total",
 label: "Total",
 render: (o) => <span className="font-mono text-sm font-medium">{formatCurrency(o.total)}</span>,
 },
 {
 key: "status",
 label: "Status",
 render: (o) => (
 <span className={statusBadge({ variant: statusColors[o.status] || "default" })}>
 {o.status}
 </span>
 ),
 },
 {
 key: "orderDate",
 label: "Date",
 render: (o) => <span className="text-sm text-muted-foreground">{formatDate(new Date(o.orderDate))}</span>,
 },
 ]

 const columns = allColumns.filter((c) => props.includes(c.key))

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

      <div className="flex items-center justify-between flex-wrap gap-3">
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

      {loading ? (
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
