"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

import { formatCurrency, formatDate, cn } from "@/lib/utils"
import {
 ArrowLeft,
 Download,
 Mail,
 Printer,
 MoreHorizontal,
 Banknote,
 DollarSign,
 AlertCircle,
 Clock,
 FileText,
 Package,
 Send,
 XCircle,
 CheckCircle2,
 Edit,
} from "lucide-react"
import { SkeletonDetail } from "@/components/ui/skeleton"

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled"

type Product = {
 name: string
 sku: string
}

type InvoiceItem = {
 id: string
 product: Product
 description: string
 quantity: number
 unitPrice: number
 total: number
}

type Customer = {
 id: string
 name: string
 email: string
 phone?: string
 address?: string
}

type Payment = {
 id: string
 date: string
 amount: number
 method: string
 reference: string
}

type OrderItem = {
 id: string
 product: Product
 quantity: number
 unitPrice: number
 total: number
}

type Order = {
 id: string
 number: string
 status: string
 items: OrderItem[]
}

type ActivityLog = {
 id: string
 action: string
 description: string
 user: string
 timestamp: string
}

type Invoice = {
 id: string
 number: string
 status: InvoiceStatus
 issueDate: string
 dueDate: string
 subtotal: number
 tax: number
 discount: number
 total: number
 paidAmount: number
 customer: Customer
 order?: Order
 items: InvoiceItem[]
 payments: Payment[]
 activities: ActivityLog[]
}

const statusConfig: Record<InvoiceStatus, { label: string; variant: "default" | "secondary" | "success" | "destructive" | "warning"; icon: typeof Clock }> = {
 draft: { label: "Draft", variant: "secondary", icon: Clock },
 sent: { label: "Sent", variant: "default", icon: Mail },
 paid: { label: "Paid", variant: "success", icon: DollarSign },
 overdue: { label: "Overdue", variant: "destructive", icon: AlertCircle },
 cancelled: { label: "Cancelled", variant: "warning", icon: FileText },
}

function daysOverdue(dueDate: string): number {
 const diff = Date.now() - new Date(dueDate).getTime()
 return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}




function SummaryCard({ title, value, sub, icon: Icon, variant }: {
 title: string
 value: string
 sub?: string
 icon: React.ElementType
 variant?: "default" | "success" | "destructive"
}) {
 const colors = {
 default: "bg-primary/10 text-primary",
 success: "bg-success/15 text-success",
 destructive: "bg-destructive/15 text-destructive",
 }
 const iconColor = colors[variant || "default"]

 return (
 <Card className="flex-1">
 <CardContent className="p-5">
 <div className="flex items-start justify-between">
 <div className="space-y-1">
 <p className="text-xs text-muted-foreground">{title}</p>
 <p className="text-xl font-semibold tracking-tight">{value}</p>
 {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
 </div>
 <div className={cn("rounded-lg p-2.5", iconColor)}>
 <Icon className="w-4 h-4" />
 </div>
 </div>
 </CardContent>
 </Card>
 )
}

export default function InvoiceDetailPage() {
 const params = useParams()
 const router = useRouter()
 const [invoice, setInvoice] = useState<Invoice | null>(null)
 const [loading, setLoading] = useState(true)
 const [notFound, setNotFound] = useState(false)
 const [tab, setTab] = useState("items")
 const [transitioning, setTransitioning] = useState("")

 async function handleStatusAction(action: string) {
 setTransitioning(action)
 try {
 const body: any = { action }
 if (action === "paid") body.amount = invoice?.total
 const res = await fetch(`/api/invoices/${params.id}/status`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(body),
 })
 if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
 // Refresh invoice data
 const updated = await fetch(`/api/invoices/${params.id}`).then(r => r.json())
 if (updated && !updated.error) setInvoice(updated)
 } catch (err: any) { toast.error(err.message) }
 finally { setTransitioning("") }
 }

 useEffect(() => {
 fetch(`/api/invoices/${params.id}`)
 .then((r) => {
 if (r.status === 404) { setNotFound(true); return null }
 if (!r.ok) throw new Error("Failed to load")
 return r.json()
 })
 .then((data) => { if (data) setInvoice(data) })
 .catch(() => setNotFound(true))
 .finally(() => setLoading(false))
 }, [params.id])

 if (loading) return <SkeletonDetail cards={3} hasChart={true} />

 if (notFound || !invoice) {
 return (
 <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
 <h2 className="text-lg font-semibold">Invoice not found</h2>
 <p className="text-sm text-muted-foreground mt-1 mb-6">The invoice you are looking for does not exist.</p>
 <Button variant="secondary" onClick={() => router.push("/invoices")}>
 Back to Invoices
 </Button>
 </div>
 )
 }

 const { status } = invoice
 const StatusIcon = statusConfig[status].icon
 const overdue = status === "overdue" ? daysOverdue(invoice.dueDate) : 0
 const balanceDue = invoice.total - invoice.paidAmount

 const itemColumns: Column<InvoiceItem>[] = [
 { key: "product", label: "Product", render: (item) => (
 <div>
 <p className="font-medium text-sm">{item.product.name}</p>
 <p className="text-xs text-muted-foreground">{item.product.sku}</p>
 </div>
 )},
 { key: "description", label: "Description", render: (item) => <span className="text-sm text-muted-foreground">{item.description || "—"}</span> },
 { key: "quantity", label: "Qty", render: (item) => <span className="font-mono text-sm">{item.quantity}</span> },
 { key: "unitPrice", label: "Unit Price", render: (item) => <span className="font-mono text-sm">{formatCurrency(item.unitPrice)}</span> },
 { key: "total", label: "Total", render: (item) => <span className="font-mono text-sm font-medium">{formatCurrency(item.total)}</span> },
 ]

 const paymentColumns: Column<Payment>[] = [
 { key: "date", label: "Date", render: (item) => <span className="text-sm">{formatDate(new Date(item.date))}</span> },
 { key: "amount", label: "Amount", render: (item) => <span className="font-mono text-sm font-medium">{formatCurrency(item.amount)}</span> },
 { key: "method", label: "Method", render: (item) => <Badge variant="outline" className="capitalize">{item.method}</Badge> },
 { key: "reference", label: "Reference", render: (item) => <span className="font-mono text-xs text-muted-foreground">{item.reference || "—"}</span> },
 ]

 return (
 <div className="animate-fade-in space-y-6">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <Button variant="ghost" size="iconSm" onClick={() => router.push("/invoices")}>
 </Button>
 <div>
 <div className="flex items-center gap-3">
 <h1 className="text-lg font-semibold">{invoice.number}</h1>
 <Badge variant={statusConfig[status].variant} className="gap-1 capitalize">
 <StatusIcon className="w-3 h-3" />
 {statusConfig[status].label}
 {overdue > 0 && ` (${overdue}d)`}
 </Badge>
 </div>
 <p className="text-sm text-muted-foreground mt-0.5">
 {invoice.customer.name} &middot; Due {formatDate(new Date(invoice.dueDate))}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {["draft", "sent", "overdue"].includes(status) && (
 <Button variant="outline" size="sm" onClick={() => router.push(`/invoices/${invoice.id}/edit`)} className="gap-1.5">
 Edit
 </Button>
 )}
 {status === "draft" && (
 <Button size="sm" onClick={() => handleStatusAction("sent")} loading={transitioning === "sent"} className="gap-1.5">
 Send
 </Button>
 )}
 {(status === "sent" || status === "overdue") && (
 <Button variant="success" size="sm" onClick={() => handleStatusAction("paid")} loading={transitioning === "paid"} className="gap-1.5">
 Mark Paid
 </Button>
 )}
 {["draft", "sent", "overdue"].includes(status) && (
 <Button variant="ghost" size="sm" onClick={() => handleStatusAction("cancelled")} loading={transitioning === "cancelled"} className="gap-1.5 text-destructive">
 Cancel
 </Button>
 )}
 <Button variant="ghost" size="iconSm"></Button>
 </div>
 </div>

 <div className="flex gap-4">
 <SummaryCard title="Total" value={formatCurrency(invoice.total)} icon={DollarSign} />
 <SummaryCard
 title="Paid Amount"
 value={formatCurrency(invoice.paidAmount)}
 icon={Banknote}
 variant={invoice.paidAmount >= invoice.total ? "success" : "default"}
 />
 <SummaryCard
 title="Balance Due"
 value={formatCurrency(balanceDue)}
 icon={AlertCircle}
 variant={balanceDue > 0 ? "destructive" : "success"}
 sub={balanceDue > 0 && overdue > 0 ? `${overdue} day${overdue > 1 ? "s" : ""} overdue` : undefined}
 />
 </div>

 <Separator />

 <Tabs value={tab} onValueChange={setTab}>
 <TabsList>
 <TabsTrigger value="items">Items ({invoice.items.length})</TabsTrigger>
 <TabsTrigger value="payments">Payments ({invoice.payments.length})</TabsTrigger>
 {invoice.order && <TabsTrigger value="order">Order</TabsTrigger>}
 <TabsTrigger value="activity">Activity</TabsTrigger>
 </TabsList>

 <TabsContent value="items">
 <Card>
 <CardHeader className="pb-3">
 <CardTitle>Invoice Items</CardTitle>
 <CardDescription>Line items included in this invoice</CardDescription>
 </CardHeader>
 <CardContent className="p-0">
 <DataTable columns={itemColumns} data={invoice.items} noBorder />
 <div className="border-t border-border px-5 py-4 space-y-1.5">
 <div className="flex justify-between text-sm">
 <span className="text-muted-foreground">Subtotal</span>
 <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
 </div>
 {invoice.discount > 0 && (
 <div className="flex justify-between text-sm">
 <span className="text-muted-foreground">Discount</span>
 <span className="font-mono text-destructive">-{formatCurrency(invoice.discount)}</span>
 </div>
 )}
 <div className="flex justify-between text-sm">
 <span className="text-muted-foreground">Tax</span>
 <span className="font-mono">{formatCurrency(invoice.tax)}</span>
 </div>
 <Separator />
 <div className="flex justify-between text-sm font-semibold">
 <span>Total</span>
 <span className="font-mono">{formatCurrency(invoice.total)}</span>
 </div>
 </div>
 </CardContent>
 </Card>
 </TabsContent>

 <TabsContent value="payments">
 <Card>
 <CardHeader className="pb-3">
 <CardTitle>Payment History</CardTitle>
 <CardDescription>Recorded payments for this invoice</CardDescription>
 </CardHeader>
 <CardContent className="p-0">
 {invoice.payments.length > 0 ? (
 <DataTable columns={paymentColumns} data={invoice.payments} noBorder />
 ) : (
 <div className="flex flex-col items-center py-12 text-muted-foreground">
 <Banknote className="w-8 h-8 mb-3" />
 <p className="text-sm font-medium">No payments recorded</p>
 <p className="text-xs mt-1">Payments will appear here once recorded.</p>
 </div>
 )}
 </CardContent>
 </Card>
 </TabsContent>

 {invoice.order && (
 <TabsContent value="order">
 <Card>
 <CardHeader className="pb-3">
 <div className="flex items-center justify-between">
 <div>
 <CardTitle>Linked Order</CardTitle>
 <CardDescription>Order #{invoice.order.number}</CardDescription>
 </div>
 <Badge variant="outline" className="capitalize">{invoice.order.status}</Badge>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 <DataTable
 noBorder
 columns={[
 { key: "product", label: "Product", render: (item: any) => (
 <div>
 <p className="font-medium text-sm">{item.product.name}</p>
 <p className="text-xs text-muted-foreground">{item.product.sku}</p>
 </div>
 )},
 { key: "quantity", label: "Qty", render: (item: any) => <span className="font-mono text-sm">{item.quantity}</span> },
 { key: "unitPrice", label: "Unit Price", render: (item: any) => <span className="font-mono text-sm">{formatCurrency(item.unitPrice)}</span> },
 { key: "total", label: "Total", render: (item: any) => <span className="font-mono text-sm font-medium">{formatCurrency(item.total)}</span> },
 ]}
 data={invoice.order.items}
 />
 </CardContent>
 </Card>
 </TabsContent>
 )}

 <TabsContent value="activity">
 <Card>
 <CardHeader className="pb-3">
 <CardTitle>Activity Log</CardTitle>
 <CardDescription>Audit trail for this invoice</CardDescription>
 </CardHeader>
 <CardContent className="p-5">
 {invoice.activities.length > 0 ? (
 <div className="space-y-0">
 {invoice.activities.map((activity, i) => (
 <div key={activity.id} className="flex gap-4 pb-4 last:pb-0">
 <div className="flex flex-col items-center">
 <div className="w-2 h-2 rounded-full bg-border mt-2 ring-4 ring-background" />
 {i < invoice.activities.length - 1 && <div className="w-px flex-1 bg-border/50 mt-1" />}
 </div>
 <div className="flex-1 min-w-0 pt-1">
 <p className="text-sm font-medium">{activity.action}</p>
 <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
 <div className="flex items-center gap-2 mt-1">
 <span className="text-[11px] text-muted-foreground">{activity.user}</span>
 <span className="text-[11px] text-muted-foreground">&middot;</span>
 <span className="text-[11px] text-muted-foreground">{formatDate(new Date(activity.timestamp))}</span>
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="flex flex-col items-center py-12 text-muted-foreground">
 <p className="text-sm font-medium">No activity yet</p>
 <p className="text-xs mt-1">Changes to this invoice will appear here.</p>
 </div>
 )}
 </CardContent>
 </Card>
 </TabsContent>
 </Tabs>
 </div>
 )
}
