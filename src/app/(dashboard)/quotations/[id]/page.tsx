"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "sonner"
import { ArrowLeft, Package, ShoppingCart, Activity, Edit, Send, CheckCircle2, XCircle, Clock, RefreshCw, FileSignature, Loader2 } from "lucide-react"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import { SkeletonDetail } from "@/components/ui/skeleton"

const statusColors: Record<string, "default" | "secondary" | "success" | "destructive" | "warning" | "outline"> = {
 draft: "secondary",
 sent: "default",
 confirmed: "success",
 expired: "warning",
 cancelled: "destructive",
}

export default function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const [quotation, setQuotation] = useState<any>(null)
 const [loading, setLoading] = useState(true)
 const [actionLoading, setActionLoading] = useState("")
 const [tab, setTab] = useState("items")
 const router = useRouter()
 const [id, setId] = useState("")

 useEffect(() => { params.then(({ id }) => setId(id)) }, [params])

 function fetchQuotation() {
 if (!id) return
 setLoading(true)
 fetch(`/api/quotations/${id}`)
 .then(r => r.json())
 .then(setQuotation)
 .finally(() => setLoading(false))
 }

 useEffect(() => { fetchQuotation() }, [id])

 async function handleTransition(action: string) {
 setActionLoading(action)
 try {
 const res = await fetch(`/api/quotations/${id}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ status: action }),
 })
 if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
 toast.success(`Quotation ${action}`)
 fetchQuotation()
 } catch (err: any) { toast.error(err.message) }
 finally { setActionLoading("") }
 }

 async function handleConvert() {
 setActionLoading("convert")
 try {
 const res = await fetch(`/api/quotations/${id}/convert`, { method: "POST" })
 if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
 toast.success("Converted to order")
 fetchQuotation()
 } catch (err: any) { toast.error(err.message) }
 finally { setActionLoading("") }
 }

 if (loading) return <SkeletonDetail cards={4} hasChart={false} />

 if (!quotation) return <p>Quotation not found</p>

 const { status } = quotation
 const itemCount = quotation.items?.length || 0

 const itemsColumns: Column<any>[] = [
 { key: "product", label: "Product", render: (item) => <span className="font-medium">{item.product?.name || "Unknown"}</span> },
 { key: "sku", label: "SKU", render: (item) => <span className="font-mono text-xs text-muted-foreground">{item.product?.sku || "—"}</span> },
 { key: "quantity", label: "Qty", render: (item) => <span className="font-mono text-sm">{item.quantity}</span> },
 { key: "unitPrice", label: "Unit Price", render: (item) => <span className="font-mono text-sm">{formatCurrency(item.unitPrice)}</span> },
 { key: "total", label: "Total", render: (item) => <span className="font-mono text-sm font-medium">{formatCurrency(item.total)}</span> },
 ]

 const activityColumns: Column<any>[] = [
 { key: "createdAt", label: "Date", render: (item) => <span className="text-sm text-muted-foreground">{formatDateTime(new Date(item.createdAt))}</span> },
 { key: "action", label: "Action", render: (item) => <span className="text-sm capitalize">{item.action}</span> },
 { key: "description", label: "Description", render: (item) => <span className="text-sm text-muted-foreground">{item.description || "—"}</span> },
 ]

 return (
 <div className="animate-fade-in space-y-6">
 <div className="flex items-center justify-between mb-2">
 <button onClick={() => router.push("/quotations")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
 Back to Quotations
 </button>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 space-y-6">
 <Card>
 <CardHeader>
 <div className="flex items-start justify-between">
 <div className="space-y-1">
 <div className="flex items-center gap-3">
 <CardTitle className="text-xl">{quotation.number}</CardTitle>
 <Badge variant={statusColors[status] || "default"} className="capitalize">{status}</Badge>
 </div>
 <p className="text-sm text-muted-foreground">{quotation.customer?.name || "—"}</p>
 </div>
 <div className="flex items-center gap-2 flex-wrap">
 {["draft", "sent"].includes(status) && !quotation.order && (
 <Button size="sm" onClick={handleConvert} loading={actionLoading === "convert"} disabled={status === "draft"} title={status === "draft" ? "Send quotation first" : "Convert to order"} className="gap-1.5">
 Convert to Order
 </Button>
 )}
 {["draft"].includes(status) && (
 <Button variant="outline" size="sm" onClick={() => router.push(`/quotations/${id}/edit`)} className="gap-1.5">
 Edit
 </Button>
 )}
 </div>
 </div>
 <div className="flex items-center gap-2 mt-3 flex-wrap">
 {status === "draft" && (
 <Button size="sm" onClick={() => handleTransition("sent")} loading={actionLoading === "sent"} className="gap-1.5">
 Send
 </Button>
 )}
 {status === "sent" && (
 <>
 <Button variant="success" size="sm" onClick={() => handleTransition("confirmed")} loading={actionLoading === "confirmed"} className="gap-1.5">
 Confirm
 </Button>
 <Button variant="ghost" size="sm" onClick={() => handleTransition("expired")} loading={actionLoading === "expired"} className="gap-1.5 text-amber-600">
 Mark Expired
 </Button>
 </>
 )}
 {["draft", "sent", "confirmed"].includes(status) && (
 <Button variant="ghost" size="sm" onClick={() => handleTransition("cancelled")} loading={actionLoading === "cancelled"} className="gap-1.5 text-destructive">
 Cancel
 </Button>
 )}
 {status === "expired" && (
 <Button size="sm" onClick={() => handleTransition("sent")} loading={actionLoading === "sent"} className="gap-1.5">
 Renew
 </Button>
 )}
 </div>
 </CardHeader>
 </Card>

 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 <Card><CardContent className="p-4">
 <p className="text-xs text-muted-foreground mb-1">Total</p>
 <p className="text-xl font-semibold font-mono">{formatCurrency(quotation.total)}</p>
 {quotation.subtotal > 0 && (
 <p className="text-xs text-muted-foreground mt-1">
 Subtotal {formatCurrency(quotation.subtotal)}
 {quotation.discount > 0 && <> &middot; -{formatCurrency(quotation.discount)}</>}
 {quotation.tax > 0 && <> &middot; Tax {formatCurrency(quotation.tax)}</>}
 </p>
 )}
 </CardContent></Card>
 <Card><CardContent className="p-4">
 <p className="text-xs text-muted-foreground mb-1">Line Items</p>
 <p className="text-xl font-semibold font-mono">{itemCount}</p>
 </CardContent></Card>
 <Card><CardContent className="p-4">
 <p className="text-xs text-muted-foreground mb-1">Valid Until</p>
 <p className="text-xl font-semibold font-mono text-sm">{quotation.validUntil ? formatDate(new Date(quotation.validUntil)) : "—"}</p>
 </CardContent></Card>
 <Card><CardContent className="p-4">
 <p className="text-xs text-muted-foreground mb-1">Linked Order</p>
 {quotation.order ? (
 <div>
 <button onClick={() => router.push(`/orders/${quotation.order.id}`)} className="text-sm font-medium text-info hover:underline">{quotation.order.number}</button>
 <Badge variant={statusColors[quotation.order.status] || "default"} className="capitalize text-[10px] mt-0.5">{quotation.order.status}</Badge>
 </div>
 ) : <p className="text-sm font-mono text-muted-foreground">—</p>}
 </CardContent></Card>
 </div>
 </div>

 <div className="space-y-4">
 <Card>
 <CardHeader><CardTitle className="text-sm">Quotation Details</CardTitle></CardHeader>
 <CardContent className="space-y-3 text-sm">
 <div className="flex justify-between">
 <span className="text-muted-foreground">Customer</span>
 <span className="font-medium text-right">{quotation.customer?.name || "—"}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Valid Until</span>
 <span className="font-medium">{quotation.validUntil ? formatDate(new Date(quotation.validUntil)) : "—"}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Status</span>
 <Badge variant={statusColors[status] || "default"} className="capitalize">{status}</Badge>
 </div>
 </CardContent>
 </Card>
 {quotation.notes && (
 <Card>
 <CardHeader><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
 <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{quotation.notes}</p></CardContent>
 </Card>
 )}
 </div>
 </div>

 <Tabs value={tab} onValueChange={setTab}>
 <TabsList>
  <TabsTrigger value="items" className="gap-1.5">
   <Package className="w-4 h-4" />
   Items
  </TabsTrigger>
  <TabsTrigger value="order" className="gap-1.5">
   <ShoppingCart className="w-4 h-4" />
   Order
  </TabsTrigger>
 <TabsTrigger value="activity" className="gap-1.5"><Activity className="w-4 h-4" /> Activity</TabsTrigger>
 </TabsList>
 <TabsContent value="items">
 <DataTable columns={itemsColumns} data={quotation.items || []} searchable searchPlaceholder="Search items..." />
 </TabsContent>
 <TabsContent value="order">
 <Card>
 <CardHeader><CardTitle>Linked Order</CardTitle></CardHeader>
 <CardContent>
 {quotation.order ? (
 <div className="space-y-3">
 <div className="flex items-center gap-2">
 <span className="text-sm text-muted-foreground">Order:</span>
 <button onClick={() => router.push(`/orders/${quotation.order.id}`)} className="text-sm font-medium text-info hover:underline">{quotation.order.number}</button>
 <Badge variant={statusColors[quotation.order.status] || "default"} className="capitalize">{quotation.order.status}</Badge>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-sm text-muted-foreground">Total:</span>
 <span className="text-sm font-mono font-semibold">{formatCurrency(quotation.order.total)}</span>
 </div>
 </div>
 ) : (
 <p className="text-sm text-muted-foreground">This quotation has not been converted to an order yet.</p>
 )}
 </CardContent>
 </Card>
 </TabsContent>
 <TabsContent value="activity">
 <DataTable columns={activityColumns} data={quotation.activities || []} searchable searchPlaceholder="Search activity..." />
 </TabsContent>
 </Tabs>
 </div>
 )
}
