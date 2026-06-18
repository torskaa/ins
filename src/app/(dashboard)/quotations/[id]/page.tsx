"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { toast } from "sonner"
import { Activity, ArrowLeft, Calendar, DollarSign, Edit, FileText, MoreHorizontal, Package, ShoppingCart, Send, CheckCircle2, XCircle, Clock, RefreshCw, FileSignature, Loader2 } from "lucide-react"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import { SkeletonDetail } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

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
 const [searchItems, setSearchItems] = useState("")
 const [searchActivity, setSearchActivity] = useState("")

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

  const itemsColumns = [
 { key: "product", label: "Product", render: (item) => <span className="font-medium">{item.product?.name || "Unknown"}</span> },
 { key: "sku", label: "SKU", render: (item) => <span className="font-mono text-xs text-muted-foreground">{item.product?.sku || "—"}</span> },
 { key: "quantity", label: "Qty", render: (item) => <span className="font-mono text-sm">{item.quantity}</span> },
 { key: "unitPrice", label: "Unit Price", render: (item) => <span className="font-mono text-sm">{formatCurrency(item.unitPrice)}</span> },
 { key: "total", label: "Total", render: (item) => <span className="font-mono text-sm font-medium">{formatCurrency(item.total)}</span> },
 ]

  const activityColumns = [
 { key: "createdAt", label: "Date", render: (item) => <span className="text-sm text-muted-foreground">{formatDateTime(new Date(item.createdAt))}</span> },
 { key: "action", label: "Action", render: (item) => <span className="text-sm capitalize">{item.action}</span> },
 { key: "description", label: "Description", render: (item) => <span className="text-sm text-muted-foreground">{item.description || "—"}</span> },
 ]

 return (
 <div className="animate-fade-in space-y-6">
  <Breadcrumb className="mb-2">
  <BreadcrumbList>
  <BreadcrumbItem>
  <BreadcrumbLink asChild>
  <button onClick={() => router.push("/quotations")}>Quotations</button>
  </BreadcrumbLink>
  </BreadcrumbItem>
  <BreadcrumbSeparator />
  <BreadcrumbItem>
  <BreadcrumbPage>{quotation.number}</BreadcrumbPage>
  </BreadcrumbItem>
  </BreadcrumbList>
  </Breadcrumb>

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
  <DropdownMenu>
  <DropdownMenuTrigger asChild>
  <Button variant="ghost" size="sm" className="h-9 w-9 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
  {["draft"].includes(status) && (
   <DropdownMenuItem onClick={() => router.push(`/quotations/${id}/edit`)}><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
  )}
  </DropdownMenuContent>
  </DropdownMenu>
</div>
 </div>
<div className="flex items-center gap-2 mt-3 flex-wrap">
  {status === "draft" && (
  <Button size="sm" onClick={() => handleTransition("sent")} loading={actionLoading === "sent"} className="gap-1.5">
  Send
  </Button>
  )}
  {status === "sent" && (
  <Button variant="success" size="sm" onClick={() => handleTransition("confirmed")} loading={actionLoading === "confirmed"} className="gap-1.5">
  Confirm
  </Button>
  )}
  {status === "expired" && (
  <Button size="sm" onClick={() => handleTransition("sent")} loading={actionLoading === "sent"} className="gap-1.5">
  Renew
  </Button>
  )}
  <DropdownMenu>
  <DropdownMenuTrigger asChild>
  <Button variant="ghost" size="sm" className="h-9 w-9 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
  {status === "sent" && (
   <DropdownMenuItem onClick={() => handleTransition("expired")} className="text-amber-600"><Clock className="w-4 h-4 mr-2" /> Mark Expired</DropdownMenuItem>
  )}
  {["draft", "sent", "confirmed"].includes(status) && (
   <DropdownMenuItem onClick={() => handleTransition("cancelled")} className="text-destructive"><XCircle className="w-4 h-4 mr-2" /> Cancel</DropdownMenuItem>
  )}
  </DropdownMenuContent>
  </DropdownMenu>
</div>
 </CardHeader>
 </Card>

  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
  <DollarSign className="w-5 h-5 text-muted-foreground" />
  <p className="text-[11px] text-muted-foreground font-medium">Total</p>
  <p className="text-xl font-semibold font-mono">{formatCurrency(quotation.total)}</p>
  {quotation.subtotal > 0 && (
  <p className="text-xs text-muted-foreground">
  Subtotal {formatCurrency(quotation.subtotal)}
  {quotation.discount > 0 && <> &middot; -{formatCurrency(quotation.discount)}</>}
  {quotation.tax > 0 && <> &middot; Tax {formatCurrency(quotation.tax)}</>}
  </p>
  )}
  </div>
  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
  <FileText className="w-5 h-5 text-muted-foreground" />
  <p className="text-[11px] text-muted-foreground font-medium">Line Items</p>
  <p className="text-xl font-semibold font-mono">{itemCount}</p>
  </div>
  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
  <Calendar className="w-5 h-5 text-muted-foreground" />
  <p className="text-[11px] text-muted-foreground font-medium">Valid Until</p>
  <p className="text-xl font-semibold font-mono text-sm">{quotation.validUntil ? formatDate(new Date(quotation.validUntil)) : "—"}</p>
  </div>
  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
  <ShoppingCart className="w-5 h-5 text-muted-foreground" />
  <p className="text-[11px] text-muted-foreground font-medium">Linked Order</p>
  {quotation.order ? (
  <div className="text-center">
  <button onClick={() => router.push(`/orders/${quotation.order.id}`)} className="text-sm font-medium text-info hover:underline">{quotation.order.number}</button>
  <Badge variant={statusColors[quotation.order.status] || "default"} className="capitalize text-[10px] mt-0.5">{quotation.order.status}</Badge>
  </div>
  ) : <p className="text-sm font-mono text-muted-foreground">—</p>}
  </div>
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

  <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
  <Tabs value={tab} onValueChange={setTab}>
    <TabsList className="w-full overflow-x-auto px-4">
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
   <TabsContent value="items" className="p-3">
   <div className="flex items-center mb-3">
     <input
       className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
       placeholder="Search items..."
       value={searchItems}
       onChange={(e) => setSearchItems(e.target.value)}
     />
   </div>
   {(() => {
     const data = quotation.items || []
     const filtered = !searchItems ? data : data.filter((item: any) =>
       JSON.stringify(item).toLowerCase().includes(searchItems.toLowerCase())
     )
     return filtered.length === 0 ? (
       <div className="text-center text-sm text-muted-foreground py-6">No items</div>
     ) : (
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
     )
   })()}
  </TabsContent>
  <TabsContent value="order" className="p-3">
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
   <TabsContent value="activity" className="p-3">
   <div className="flex items-center mb-3">
     <input
       className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
       placeholder="Search activity..."
       value={searchActivity}
       onChange={(e) => setSearchActivity(e.target.value)}
     />
   </div>
   {(() => {
     const data = quotation.activities || []
     const filtered = !searchActivity ? data : data.filter((item: any) =>
       JSON.stringify(item).toLowerCase().includes(searchActivity.toLowerCase())
     )
     return filtered.length === 0 ? (
       <div className="text-center text-sm text-muted-foreground py-6">No activity</div>
     ) : (
       <Table>
         <TableHeader>
           <TableRow>
             {activityColumns.map((col: any) => (
               <TableHead key={col.key}>{col.label}</TableHead>
             ))}
           </TableRow>
         </TableHeader>
         <TableBody>
           {filtered.map((item: any) => (
             <TableRow key={item.id}>
               {activityColumns.map((col: any) => (
                 <TableCell key={col.key}>
                   {col.render ? col.render(item) : String(item[col.key] ?? "")}
                 </TableCell>
               ))}
             </TableRow>
           ))}
         </TableBody>
       </Table>
     )
   })()}
  </TabsContent>
  </Tabs>
  </div>
  </div>
  )
}
