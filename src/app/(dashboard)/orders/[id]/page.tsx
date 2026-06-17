"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

import { Banknote, Activity, DollarSign, FileText, MoreHorizontal, Package, ShoppingCart, XCircle } from "lucide-react"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { toast } from "sonner"
import { SkeletonDetail } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

const statusColors: Record<string, "default" | "secondary" | "success" | "destructive" | "warning" | "outline"> = {
 draft: "secondary",
 confirmed: "default",
 processing: "warning",
 shipped: "default",
 delivered: "success",
 cancelled: "destructive",
}

const transitions: Record<string, { status: string; label: string; variant: "default" | "secondary" | "success" | "destructive" | "outline" }[]> = {
 draft: [{ status: "confirmed", label: "Confirm Order", variant: "default" }],
 confirmed: [
 { status: "processing", label: "Start Processing", variant: "secondary" },
 { status: "draft", label: "Revert to Draft", variant: "secondary" },
 ],
 processing: [
 { status: "shipped", label: "Mark Shipped", variant: "default" },
 { status: "confirmed", label: "Revert to Confirmed", variant: "secondary" },
 ],
 shipped: [
 { status: "delivered", label: "Mark Delivered", variant: "success" },
 ],
 delivered: [],
 cancelled: [],
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const [order, setOrder] = useState<any>(null)
 const [loading, setLoading] = useState(true)
 const [transitioning, setTransitioning] = useState<string | null>(null)
 const [tab, setTab] = useState("items")
 const router = useRouter()
 const [id, setId] = useState("")

 useEffect(() => { params.then(({ id }) => setId(id)) }, [params])

 function fetchOrder() {
 if (!id) return
 setLoading(true)
 fetch(`/api/orders/${id}`)
 .then(r => r.json())
 .then(setOrder)
 .finally(() => setLoading(false))
 }

 useEffect(() => { fetchOrder() }, [id])

 async function handleTransition(status: string) {
 setTransitioning(status)
 try {
 const res = await fetch(`/api/orders/${id}/approve`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ status }),
 })
 if (!res.ok) throw new Error("Failed")
 toast.success(`Order moved to ${status}`)
 fetchOrder()
 } catch {
 toast.error("Failed to update status")
 } finally {
 setTransitioning(null)
 }
 }

 if (loading) return <SkeletonDetail cards={4} hasChart={false} />

 if (!order) return <p>Order not found</p>

 const partyName = order.type === "sales" ? order.customer?.name : order.supplier?.name
 const allowedTransitions = transitions[order.status] || []
 const isCancellable = order.status !== "cancelled" && order.status !== "delivered"

 const itemsColumns: Column<any>[] = [
 { key: "product", label: "Product", render: (item) => <span className="font-medium">{item.product?.name || "Unknown"}</span> },
 { key: "sku", label: "SKU", render: (item) => <span className="font-mono text-xs text-muted-foreground">{item.product?.sku || "—"}</span> },
 { key: "quantity", label: "Qty", render: (item) => <span className="font-mono text-sm">{item.quantity}</span> },
 { key: "unitPrice", label: "Unit Price", render: (item) => <span className="font-mono text-sm">{formatCurrency(item.unitPrice)}</span> },
 { key: "total", label: "Total", render: (item) => <span className="font-mono text-sm font-medium">{formatCurrency(item.total)}</span> },
 { key: "receivedQty", label: "Received", render: (item) => <span className="font-mono text-sm">{item.receivedQty ?? "—"}</span> },
 { key: "invoicedQty", label: "Invoiced", render: (item) => <span className="font-mono text-sm">{item.invoicedQty ?? "—"}</span> },
 ]

 const paymentsColumns: Column<any>[] = [
 { key: "date", label: "Date", render: (item) => <span className="text-sm">{formatDateTime(new Date(item.date))}</span> },
 { key: "amount", label: "Amount", render: (item) => <span className="font-mono text-sm font-medium">{formatCurrency(item.amount)}</span> },
 { key: "method", label: "Method", render: (item) => <span className="text-sm capitalize">{item.method || "—"}</span> },
 { key: "reference", label: "Reference", render: (item) => <span className="font-mono text-xs text-muted-foreground">{item.reference || "—"}</span> },
 ]

 const invoicesColumns: Column<any>[] = [
 { key: "number", label: "Invoice #", render: (item) => <span className="font-mono text-xs font-medium">{item.number}</span> },
 { key: "status", label: "Status", render: (item) => (
 <Badge variant={statusColors[item.status] || "default"} className="capitalize">
 {item.status}
 </Badge>
 )},
 { key: "total", label: "Total", render: (item) => <span className="font-mono text-sm font-medium">{formatCurrency(item.total)}</span> },
 { key: "paidAmount", label: "Paid", render: (item) => <span className="font-mono text-sm">{formatCurrency(item.paidAmount ?? 0)}</span> },
 ]

 const stockColumns: Column<any>[] = [
 { key: "type", label: "Type", render: (item) => (
 <Badge variant={
 item.type === "received" ? "success" :
 item.type === "sold" ? "default" :
 item.type === "adjusted" ? "warning" : "secondary"
 } className="capitalize">
 {item.type}
 </Badge>
 )},
 { key: "quantity", label: "Qty", render: (item) => (
 <span className={`font-mono text-sm font-medium ${item.quantity > 0 ? "text-success" : "text-destructive"}`}>
 {item.quantity > 0 ? "+" : ""}{item.quantity}
 </span>
 )},
 { key: "product", label: "Product", render: (item) => <span className="text-sm">{item.product?.name || "—"}</span> },
 { key: "createdAt", label: "Date", render: (item) => <span className="text-sm text-muted-foreground">{formatDateTime(new Date(item.createdAt))}</span> },
 ]

 const auditColumns: Column<any>[] = [
 { key: "createdAt", label: "Date", render: (item) => <span className="text-sm text-muted-foreground">{formatDateTime(new Date(item.createdAt))}</span> },
 { key: "action", label: "Action", render: (item) => <span className="text-sm capitalize">{item.action}</span> },
 { key: "user", label: "User", render: (item) => <span className="text-sm">{item.user?.name || "—"}</span> },
 { key: "description", label: "Description", render: (item) => <span className="text-sm text-muted-foreground">{item.description || "—"}</span> },
 ]

 return (
 <div className="animate-fade-in space-y-6">
 <Breadcrumb className="mb-4">
  <BreadcrumbList>
  <BreadcrumbItem>
  <BreadcrumbLink asChild>
  <button onClick={() => router.push("/orders")}>Orders</button>
  </BreadcrumbLink>
  </BreadcrumbItem>
  <BreadcrumbSeparator />
  <BreadcrumbItem>
  <BreadcrumbPage>{order.number}</BreadcrumbPage>
  </BreadcrumbItem>
  </BreadcrumbList>
  </Breadcrumb>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2 space-y-6">
  <Card>
  <CardHeader>
  <div className="flex items-start justify-between">
  <div className="space-y-1">
  <div className="flex items-center gap-2">
  <CardTitle className="text-xl">{order.number}</CardTitle>
 <Badge variant={order.type === "sales" ? "default" : "warning"} className="uppercase text-[10px] tracking-wider">
 {order.type === "sales" ? "Sales" : "Purchase"}
 </Badge>
 <Badge variant={statusColors[order.status] || "default"} className="capitalize">
 {order.status}
 </Badge>
 </div>
 <p className="text-sm text-muted-foreground">{partyName || "—"}</p>
 </div>
 </div>
 </CardHeader>
 <CardContent>
<div className="flex items-center gap-2 flex-wrap">
  {allowedTransitions.length > 0 && (
  <Button
  key={allowedTransitions[0].status}
  size="sm"
  variant="default"
  loading={transitioning === allowedTransitions[0].status}
  onClick={() => handleTransition(allowedTransitions[0].status)}
  >
  {allowedTransitions[0].label}
  </Button>
  )}
  {(allowedTransitions.length > 1 || isCancellable) && (
  <DropdownMenu>
  <DropdownMenuTrigger asChild>
  <Button variant="ghost" size="sm" className="h-9 w-9 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
  {allowedTransitions.slice(1).map((t) => (
  <DropdownMenuItem key={t.status} onClick={() => handleTransition(t.status)}>{t.label}</DropdownMenuItem>
  ))}
  {isCancellable && allowedTransitions.length > 1 && <DropdownMenuSeparator />}
  {isCancellable && (
  <DropdownMenuItem onClick={() => handleTransition("cancelled")} className="text-destructive"><XCircle className="w-4 h-4 mr-2" /> Cancel Order</DropdownMenuItem>
  )}
  </DropdownMenuContent>
  </DropdownMenu>
  )}
</div>
 </CardContent>
 </Card>

  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
  <DollarSign className="w-5 h-5 text-muted-foreground" />
  <p className="text-[11px] text-muted-foreground font-medium">Order Total</p>
  <p className="text-xl font-semibold font-mono">{formatCurrency(order.total)}</p>
  {order.subtotal > 0 && (
  <p className="text-xs text-muted-foreground">
  Subtotal {formatCurrency(order.subtotal)}
  {order.discount > 0 && <> &middot; -{formatCurrency(order.discount)}</>}
  {order.tax > 0 && <> &middot; Tax {formatCurrency(order.tax)}</>}
  </p>
  )}
  </div>
  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
  <Package className="w-5 h-5 text-muted-foreground" />
  <p className="text-[11px] text-muted-foreground font-medium">Items</p>
  <p className="text-xl font-semibold font-mono">{order.items?.length || 0}</p>
  </div>
  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
  <Banknote className="w-5 h-5 text-muted-foreground" />
  <p className="text-[11px] text-muted-foreground font-medium">Payments</p>
  <p className="text-xl font-semibold font-mono">
  {formatCurrency(order.payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0)}
  </p>
  </div>
  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
  <FileText className="w-5 h-5 text-muted-foreground" />
  <p className="text-[11px] text-muted-foreground font-medium">Invoices</p>
  <p className="text-xl font-semibold font-mono">{order.invoices?.length || 0}</p>
  </div>
  </div>
 </div>

 <div className="space-y-4">
 <Card>
 <CardHeader>
 <CardTitle className="text-sm">Order Details</CardTitle>
 </CardHeader>
 <CardContent className="space-y-3 text-sm">
 <div className="flex justify-between">
 <span className="text-muted-foreground">Order Date</span>
 <span className="font-medium">{formatDateTime(new Date(order.orderDate))}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Expected Date</span>
 <span className="font-medium">{order.expectedDate ? formatDateTime(new Date(order.expectedDate)) : "—"}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">{order.type === "sales" ? "Customer" : "Supplier"}</span>
 <span className="font-medium text-right">{partyName || "—"}</span>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>

  <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
  <Tabs value={tab} onValueChange={setTab}>
    <TabsList className="w-full overflow-x-auto px-4">
      <TabsTrigger value="items" className="gap-1.5">
        <ShoppingCart className="w-4 h-4" />
        Items
      </TabsTrigger>
      <TabsTrigger value="payments" className="gap-1.5">
        <Banknote className="w-4 h-4" />
        Payments
      </TabsTrigger>
      <TabsTrigger value="invoices" className="gap-1.5">
        <FileText className="w-4 h-4" />
        Invoices
      </TabsTrigger>
      <TabsTrigger value="stock" className="gap-1.5">
        <Package className="w-4 h-4" />
        Stock Movements
      </TabsTrigger>
      <TabsTrigger value="audit" className="gap-1.5">
        <Activity className="w-4 h-4" />
        Audit Log
      </TabsTrigger>
    </TabsList>

  <TabsContent value="items" className="p-3">
  <DataTable
  columns={itemsColumns}
  data={order.items || []}
  searchable
  searchPlaceholder="Search items..."
  noBorder
  compact
  />
  </TabsContent>

  <TabsContent value="payments" className="p-3">
  <DataTable
  columns={paymentsColumns}
  data={order.payments || []}
  searchable
  searchPlaceholder="Search payments..."
  noBorder
  compact
  />
  </TabsContent>

  <TabsContent value="invoices" className="p-3">
  <DataTable
  columns={invoicesColumns}
  data={order.invoices || []}
  searchable
  searchPlaceholder="Search invoices..."
  noBorder
  compact
  />
  </TabsContent>

  <TabsContent value="stock" className="p-3">
  <DataTable
  columns={stockColumns}
  data={order.stockMovements || []}
  searchable
  searchPlaceholder="Search movements..."
  noBorder
  compact
  />
  </TabsContent>

  <TabsContent value="audit" className="p-3">
  <DataTable
  columns={auditColumns}
  data={order.auditLogs || []}
  searchable
  searchPlaceholder="Search logs..."
  noBorder
  compact
  />
  </TabsContent>
  </Tabs>
  </div>
 </div>
 )
}
