"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { DataTable, statusBadge, type Column } from "@/components/ui/data-table"
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

 const filtered = orders.filter((o) =>
 !search || [o.number, o.status, o.customer?.name, o.supplier?.name]
 .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
 )

 const allColumns: Column<Order>[] = [
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
 <div className="flex items-center justify-between flex-wrap gap-4">
 <div>
 <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
 <p className="text-sm text-muted-foreground mt-1">Manage sales and purchase orders</p>
 </div>
 <div className="flex items-center gap-3">
 {filtered.length > 0 && (
 <>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
<Input placeholder="Search orders..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
 </div>
 <ViewToggle view={view} onChange={setView} />
 <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
 </>
 )}
 <MoreMenu actions={[
 { label: "Import", icon: ActionIcons.AddNew },
 "separator",
 { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Order #", "Type", "Customer", "Status", "Total", "Date"], orders.map(o => [o.number, o.type, o.customer?.name, o.status, o.total, o.orderDate]), "orders.csv") },
 { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Orders", []) },
 "separator",
 { label: "Refresh", icon: ActionIcons.Refresh },
 ]} />
 <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>New Order <ShortcutBadge shortcut="⌘C" />
 </Button>
 </div>
 </div>

 <div className="mb-6">
 <Tabs value={type} onValueChange={(v) => router.push(`/orders?type=${v}`)}>
 <TabsList>
 <TabsTrigger value="sales">Sales Orders</TabsTrigger>
 <TabsTrigger value="purchase">Purchase Orders</TabsTrigger>
 </TabsList>
 </Tabs>
 </div>

 <DataTable
 columns={columns}
 data={filtered}
 onRowClick={(item) => router.push(`/orders/${item.id}`)}
 loading={loading}
 empty={{
 icons: [<ShoppingCart className="w-5 h-5" />, <ClipboardList className="w-5 h-5" />, <Calendar className="w-5 h-5" />],
 title: `No ${type} orders`,
 description: `Create your first ${type} order to get started.`,
 action: { label: "New Order", onClick: () => router.push(`/orders/new?type=${type}`) },
 }}
 />
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
