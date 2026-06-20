"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge, BadgeDot, SemanticBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { Progress } from "@/components/ui/progress"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { Activity, Banknote, Clock, DollarSign, FileText, Hash, HouseIcon, MoreHorizontal, Package, Pencil, Receipt, ShoppingCart, Tags, Trash2, XCircle } from "lucide-react"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Frame, FramePanel } from "@/components/reui/frame"
import { formatCurrency, formatNumber, formatDate, formatDateTime, cn } from "@/lib/utils"
import { toast } from "sonner"
import { SkeletonDetail } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { MoreMenu } from "@/components/ui/more-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

const transitions: Record<string, { status: string; label: string; variant: "primary" | "secondary" | "success" | "destructive" | "outline" }[]> = {
  draft: [{ status: "confirmed", label: "Confirm Order", variant: "primary" }],
  confirmed: [
    { status: "processing", label: "Start Processing", variant: "secondary" },
    { status: "draft", label: "Revert to Draft", variant: "secondary" },
  ],
  processing: [
    { status: "shipped", label: "Mark Shipped", variant: "primary" },
    { status: "confirmed", label: "Revert to Confirmed", variant: "secondary" },
  ],
  shipped: [
    { status: "delivered", label: "Mark Delivered", variant: "success" },
  ],
  delivered: [],
  cancelled: [],
}

function FieldDisplay({ label, value, mono, badge }: { label: string; value: string; mono?: boolean; badge?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground font-medium mb-0.5 truncate">{label}</p>
      {badge ? (
        <SemanticBadge semantic={value} category="status">{value}</SemanticBadge>
      ) : (
        <p className={cn("text-sm truncate", mono ? "font-mono" : "font-medium")}>{value || "—"}</p>
      )}
    </div>
  )
}

function FieldGroup({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="min-w-0 space-y-1">
      <Label className="text-[11px] text-muted-foreground font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transitioning, setTransitioning] = useState<string | null>(null)
  const [tab, setTab] = useState("items")
  const router = useRouter()
  const [id, setId] = useState("")
  const [searchItems, setSearchItems] = useState("")
  const [searchPayments, setSearchPayments] = useState("")
  const [searchInvoices, setSearchInvoices] = useState("")
  const [searchStock, setSearchStock] = useState("")
  const [searchAudit, setSearchAudit] = useState("")
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => { params.then(({ id }) => setId(id)) }, [params])

  function fetchOrder() {
    if (!id) return
    setLoading(true)
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then(r => { if (r?.success) setOrder(r.data); else setError(r?.error || "Failed to load") })
      .catch((err) => { setError(err.message || "Failed to load data") })
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

  async function handleSave() {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: form.notes,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Order updated")
      setShowEdit(false)
      fetchOrder()
    } catch {
      toast.error("Failed to update order")
    }
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Failed to load data"
        description={error}
        actions={[{ label: "Try again", onClick: () => window.location.reload() }]}
      />
    )
  }

  if (loading) return <SkeletonDetail cards={4} hasChart={false} />

  if (!order) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Order not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The order you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/orders")}>Back to Orders</Button>
      </div>
    )
  }

  const partyName = order.type === "sales" ? order.customer?.name : order.supplier?.name
  const allowedTransitions = transitions[order.status] || []
  const isCancellable = order.status !== "cancelled" && order.status !== "delivered"

  const itemsColumns = [
    { key: "product", label: "Product", render: (item: any) => <span className="font-medium">{item.product?.name || "Unknown"}</span> },
    { key: "sku", label: "SKU", render: (item: any) => <span className="font-mono text-xs text-muted-foreground">{item.product?.sku || "—"}</span> },
    { key: "quantity", label: "Qty", render: (item: any) => <span className="font-mono text-sm">{item.quantity}</span> },
    { key: "unitPrice", label: "Unit Price", render: (item: any) => <span className="font-mono text-sm">{formatCurrency(item.unitPrice)}</span> },
    { key: "total", label: "Total", render: (item: any) => <span className="font-mono text-sm font-medium">{formatCurrency(item.total)}</span> },
    { key: "receivedQty", label: "Received", render: (item: any) => <span className="font-mono text-sm">{item.receivedQty ?? "—"}</span> },
    { key: "invoicedQty", label: "Invoiced", render: (item: any) => <span className="font-mono text-sm">{item.invoicedQty ?? "—"}</span> },
  ]

  const paymentsColumns = [
    { key: "date", label: "Date", render: (item: any) => <span className="text-sm">{formatDateTime(new Date(item.date))}</span> },
    { key: "amount", label: "Amount", render: (item: any) => <span className="font-mono text-sm font-medium">{formatCurrency(item.amount)}</span> },
    { key: "method", label: "Method", render: (item: any) => <span className="text-sm capitalize">{item.method || "—"}</span> },
    { key: "reference", label: "Reference", render: (item: any) => <span className="font-mono text-xs text-muted-foreground">{item.reference || "—"}</span> },
  ]

  const invoicesColumns = [
    { key: "number", label: "Invoice #", render: (item: any) => <span className="font-mono text-xs font-medium">{item.number}</span> },
    { key: "status", label: "Status", render: (item: any) => (
      <SemanticBadge semantic={item.status} category="status" className="">{item.status}</SemanticBadge>
    )},
    { key: "total", label: "Total", render: (item: any) => <span className="font-mono text-sm font-medium">{formatCurrency(item.total)}</span> },
    { key: "paidAmount", label: "Paid", render: (item: any) => <span className="font-mono text-sm">{formatCurrency(item.paidAmount ?? 0)}</span> },
  ]

  const stockColumns = [
    { key: "type", label: "Type", render: (item: any) => (
      <SemanticBadge semantic={item.type} category="type" className="">{item.type}</SemanticBadge>
    )},
    { key: "quantity", label: "Qty", render: (item: any) => (
      <span className={`font-mono text-sm font-medium ${item.quantity > 0 ? "text-success" : "text-destructive"}`}>
        {item.quantity > 0 ? "+" : ""}{item.quantity}
      </span>
    )},
    { key: "product", label: "Product", render: (item: any) => <span className="text-sm">{item.product?.name || "—"}</span> },
    { key: "createdAt", label: "Date", render: (item: any) => <span className="text-sm text-muted-foreground">{formatDateTime(new Date(item.createdAt))}</span> },
  ]

  const auditColumns = [
    { key: "createdAt", label: "Date", render: (item: any) => <span className="text-sm text-muted-foreground">{formatDateTime(new Date(item.createdAt))}</span> },
    { key: "action", label: "Action", render: (item: any) => <span className="text-sm capitalize">{item.action}</span> },
    { key: "user", label: "User", render: (item: any) => <span className="text-sm">{item.user?.name || "—"}</span> },
    { key: "description", label: "Description", render: (item: any) => <span className="text-sm text-muted-foreground">{item.description || "—"}</span> },
  ]

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      <Frame variant="ghost" className="w-fit">
        <FramePanel className="gap-2 px-3! py-2! border-0!">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/orders" className="flex items-center gap-1.5">
                  <HouseIcon className="size-4" aria-hidden="true" />
                  Orders
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">{order.number}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </FramePanel>
      </Frame>
      <div className="grid grid-cols-12 gap-4">
        {/* Page Header — bento card */}
        <div className="col-span-12 border border-border/60 rounded-lg bg-card p-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{order.number}</h1>
                <SemanticBadge semantic={order.type} category="type" className="gap-1 uppercase text-[10px] tracking-wider"><Tags className="w-3 h-3" />{order.type === "sales" ? "Sales" : "Purchase"}</SemanticBadge>
                <SemanticBadge semantic={order.status} category="status" className="gap-1 text-[11px]"><BadgeDot />{order.status}</SemanticBadge>
                <SemanticBadge semantic={order.number} category="id" className="gap-1 font-mono text-[11px]"><Hash className="w-3 h-3" />{order.number}</SemanticBadge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{partyName || "—"}</span>
                <span className="text-muted-foreground/30">·</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Ordered {formatDateTime(new Date(order.orderDate))}</span>
              </div>
              {order.updatedAt && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Updated {formatDate(new Date(order.updatedAt))}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <MoreMenu actions={[
                  { label: "Edit", icon: <Pencil className="w-4 h-4" />, onClick: () => { setForm({ notes: order.notes || "" }); setShowEdit(true) } },
                  "separator",
                  { label: "Cancel Order", icon: <XCircle className="w-4 h-4" />, onClick: () => handleTransition("cancelled") },
                ]} />
              </div>
            </div>
          </div>
          {/* Status action buttons */}
          <div className="flex items-center gap-2 mt-3">
            {allowedTransitions.length > 0 && (
              <Button
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
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
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
        </div>

        {/* Metric cards */}
        <div className="col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex flex-col items-center gap-2">
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
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex flex-col items-center gap-2">
                <Package className="w-5 h-5 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground font-medium">Items</p>
                <p className="text-xl font-semibold font-mono">{order.items?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex flex-col items-center gap-2">
                <Banknote className="w-5 h-5 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground font-medium">Payments</p>
                <p className="text-xl font-semibold font-mono">
                  {formatCurrency(order.payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground font-medium">Invoices</p>
                <p className="text-xl font-semibold font-mono">{order.invoices?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Left Column (8 cols) — Primary Information */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          {/* Order Details */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="w-4 h-4 text-primary" />
                Order Details
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Order Date" value={formatDateTime(new Date(order.orderDate))} />
                <FieldDisplay label="Expected Date" value={order.expectedDate ? formatDateTime(new Date(order.expectedDate)) : "—"} />
                <FieldDisplay label={order.type === "sales" ? "Customer" : "Supplier"} value={partyName || "—"} />
                <FieldDisplay label="Subtotal" value={formatCurrency(order.subtotal || 0)} mono />
                {order.discount > 0 && <FieldDisplay label="Discount" value={`-${formatCurrency(order.discount)}`} mono />}
                {order.tax > 0 && <FieldDisplay label="Tax" value={formatCurrency(order.tax)} mono />}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols) — Contextual / Meta */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Metadata */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="w-4 h-4 text-primary" />
                Metadata
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Created" value={order.createdAt ? formatDateTime(new Date(order.createdAt)) : "—"} />
                <FieldDisplay label="Updated" value={order.updatedAt ? formatDateTime(new Date(order.updatedAt)) : "—"} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unified Tab Module */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden pt-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full overflow-x-auto px-4">
            <TabsTrigger value="items" className="gap-1.5"><ShoppingCart className="w-4 h-4" /> Items</TabsTrigger>
            <TabsTrigger value="payments" className="gap-1.5"><Banknote className="w-4 h-4" /> Payments</TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1.5"><FileText className="w-4 h-4" /> Invoices</TabsTrigger>
            <TabsTrigger value="stock" className="gap-1.5"><Package className="w-4 h-4" /> Stock Movements</TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5"><Activity className="w-4 h-4" /> Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              Items ({order.items?.length || 0})
            </div>
            <div className="flex items-center mb-3">
              <input
                className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Search items..."
                value={searchItems}
                onChange={(e) => setSearchItems(e.target.value)}
              />
            </div>
            {(() => {
              const filtered = (order.items || []).filter((item: any) =>
                !searchItems || JSON.stringify(item).toLowerCase().includes(searchItems.toLowerCase())
              )
              return filtered.length === 0 ? (
                <EmptyState
                  icons={[<ShoppingCart key="oi1" className="w-6 h-6" />, <Package key="oi2" className="w-6 h-6" />]}
                  title="No items"
                  description="This order has no items"
                  size="sm"
                />
              ) : (
                <div data-slot="frame">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {itemsColumns.map((col: any) => (
                          <TableHead key={col.key}>{col.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((item: any) => (
                        <TableRow key={item.id}>
                          {itemsColumns.map((col: any) => (
                            <TableCell key={col.key}>
                              {col.render ? col.render(item) : String(item[col.key] ?? "")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            })()}
          </TabsContent>

          <TabsContent value="payments" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Banknote className="w-4 h-4 text-primary" />
              Payments
            </div>
            <div className="flex items-center mb-3">
              <input
                className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Search payments..."
                value={searchPayments}
                onChange={(e) => setSearchPayments(e.target.value)}
              />
            </div>
            {(() => {
              const filtered = (order.payments || []).filter((item: any) =>
                !searchPayments || JSON.stringify(item).toLowerCase().includes(searchPayments.toLowerCase())
              )
              return filtered.length === 0 ? (
                <EmptyState
                  icons={[<Banknote key="op1" className="w-6 h-6" />, <DollarSign key="op2" className="w-6 h-6" />]}
                  title="No payments"
                  description="No payments recorded for this order"
                  size="sm"
                />
              ) : (
                <div data-slot="frame">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {paymentsColumns.map((col: any) => (
                          <TableHead key={col.key}>{col.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((item: any) => (
                        <TableRow key={item.id}>
                          {paymentsColumns.map((col: any) => (
                            <TableCell key={col.key}>
                              {col.render ? col.render(item) : String(item[col.key] ?? "")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            })()}
          </TabsContent>

          <TabsContent value="invoices" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <FileText className="w-4 h-4 text-primary" />
              Invoices
            </div>
            <div className="flex items-center mb-3">
              <input
                className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Search invoices..."
                value={searchInvoices}
                onChange={(e) => setSearchInvoices(e.target.value)}
              />
            </div>
            {(() => {
              const filtered = (order.invoices || []).filter((item: any) =>
                !searchInvoices || JSON.stringify(item).toLowerCase().includes(searchInvoices.toLowerCase())
              )
              return filtered.length === 0 ? (
                <EmptyState
                  icons={[<FileText key="oi1" className="w-6 h-6" />, <Receipt key="oi2" className="w-6 h-6" />]}
                  title="No invoices"
                  description="No invoices have been created for this order"
                  size="sm"
                />
              ) : (
                <div data-slot="frame">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {invoicesColumns.map((col: any) => (
                          <TableHead key={col.key}>{col.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((item: any) => (
                        <TableRow key={item.id}>
                          {invoicesColumns.map((col: any) => (
                            <TableCell key={col.key}>
                              {col.render ? col.render(item) : String(item[col.key] ?? "")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            })()}
          </TabsContent>

          <TabsContent value="stock" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Package className="w-4 h-4 text-primary" />
              Stock Movements
            </div>
            <div className="flex items-center mb-3">
              <input
                className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Search movements..."
                value={searchStock}
                onChange={(e) => setSearchStock(e.target.value)}
              />
            </div>
            {(() => {
              const filtered = (order.stockMovements || []).filter((item: any) =>
                !searchStock || JSON.stringify(item).toLowerCase().includes(searchStock.toLowerCase())
              )
              return filtered.length === 0 ? (
                <EmptyState
                  icons={[<Package key="os1" className="w-6 h-6" />, <ShoppingCart key="os2" className="w-6 h-6" />]}
                  title="No movements"
                  description="No stock movements recorded for this order"
                  size="sm"
                />
              ) : (
                <div data-slot="frame">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {stockColumns.map((col: any) => (
                          <TableHead key={col.key}>{col.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((item: any) => (
                        <TableRow key={item.id}>
                          {stockColumns.map((col: any) => (
                            <TableCell key={col.key}>
                              {col.render ? col.render(item) : String(item[col.key] ?? "")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            })()}
          </TabsContent>

          <TabsContent value="audit" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Activity className="w-4 h-4 text-primary" />
              Audit Log
            </div>
            <div className="flex items-center mb-3">
              <input
                className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Search logs..."
                value={searchAudit}
                onChange={(e) => setSearchAudit(e.target.value)}
              />
            </div>
            {(() => {
              const filtered = (order.auditLogs || []).filter((item: any) =>
                !searchAudit || JSON.stringify(item).toLowerCase().includes(searchAudit.toLowerCase())
              )
              return filtered.length === 0 ? (
                <EmptyState
                  icons={[<Activity key="oa1" className="w-6 h-6" />, <FileText key="oa2" className="w-6 h-6" />]}
                  title="No logs"
                  description="No audit logs recorded for this order"
                  size="sm"
                />
              ) : (
                <div data-slot="frame">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {auditColumns.map((col: any) => (
                          <TableHead key={col.key}>{col.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((item: any) => (
                        <TableRow key={item.id}>
                          {auditColumns.map((col: any) => (
                            <TableCell key={col.key}>
                              {col.render ? col.render(item) : String(item[col.key] ?? "")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            })()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-lg flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>Update details for <span className="font-medium text-foreground">{order?.number}</span></DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <FileText className="w-4 h-4 text-primary" />
                  Order Information
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <FieldGroup label="Notes">
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} placeholder="Internal notes..." />
                </FieldGroup>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border/60">
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes <ShortcutBadge shortcut="⌘↵" /></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
