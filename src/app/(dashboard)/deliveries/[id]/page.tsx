"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Building2, Calendar, Edit, MapPin, MoreHorizontal, Package, Trash2, Truck, XCircle } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { SkeletonDetail } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

type TrackingEntry = {
 id: string
 status: string
 location: string | null
 note: string | null
 timestamp: string
}

type DeliveryItemType = {
 id: string
 quantity: number
 deliveredQty: number
 unitPrice: number
 total: number
 product: { id: string; name: string; sku: string; barcode: string | null }
}

type DeliveryDetail = {
 id: string
 number: string
 status: string
 trackingNumber: string | null
 carrier: string | null
 estimatedDate: string | null
 actualDate: string | null
 notes: string | null
 origin: string | null
 destination: string | null
 totalItems: number
 totalValue: number
 distributor: {
 id: string
 name: string
 phone: string | null
 territory: string | null
 }
 warehouse: { id: string; name: string; location: string | null } | null
 items: DeliveryItemType[]
 tracking: TrackingEntry[]
}

const statusColors: Record<string, string> = {
 draft: "bg-slate-100 text-slate-600",
 packing: "bg-amber-100 text-amber-700",
 shipped: "bg-blue-100 text-blue-700",
 in_transit: "bg-purple-100 text-purple-700",
 delivered: "bg-emerald-100 text-emerald-700",
 failed: "bg-red-100 text-red-700",
 cancelled: "bg-slate-100 text-slate-600"}

const statusFlow = ["draft", "packing", "shipped", "in_transit", "delivered"]

const nextStatus: Record<string, string> = {
 draft: "packing",
 packing: "shipped",
 shipped: "in_transit",
 in_transit: "delivered"}

export default function DeliveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = use(params)
 const router = useRouter()
 const [delivery, setDelivery] = useState<DeliveryDetail | null>(null)
 const [loading, setLoading] = useState(true)
 const [deleteOpen, setDeleteOpen] = useState(false)
 const [deleting, setDeleting] = useState(false)
 const [updating, setUpdating] = useState(false)

 useEffect(() => {
 if (!id) return
 fetch(`/api/deliveries/${id}`)
 .then(r => r.json())
 .then(setDelivery)
 .finally(() => setLoading(false))
 }, [id])

 async function handleAdvanceStatus() {
 if (!delivery) return
 const next = nextStatus[delivery.status]
 if (!next) return
 setUpdating(true)
 try {
 const res = await fetch(`/api/deliveries/${id}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 status: next,
 actualDate: next === "delivered" ? new Date().toISOString() : undefined})})
 if (!res.ok) throw new Error()
 const updated = await res.json()
 setDelivery(prev => prev ? { ...prev, ...updated } : prev)
 toast.success(`Status advanced to ${next}`)
 } catch {
 toast.error("Failed to update status")
 } finally {
 setUpdating(false)
 }
 }

 async function handleCancel() {
 setUpdating(true)
 try {
 const res = await fetch(`/api/deliveries/${id}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ status: "cancelled" })})
 if (!res.ok) throw new Error()
 const updated = await res.json()
 setDelivery(prev => prev ? { ...prev, ...updated } : prev)
 toast.success("Delivery cancelled")
 } catch {
 toast.error("Failed to cancel delivery")
 } finally {
 setUpdating(false)
 }
 }

 async function handleDelete() {
 setDeleting(true)
 try {
 const res = await fetch(`/api/deliveries/${id}`, { method: "DELETE" })
 if (!res.ok) throw new Error()
 toast.success("Delivery deleted")
 router.push("/deliveries")
 } catch {
 toast.error("Failed to delete delivery")
 setDeleting(false)
 }
 }

 if (loading) return <SkeletonDetail cards={4} hasChart={true} />

 if (!delivery) return <p>Delivery not found</p>

 const canAdvance = !!nextStatus[delivery.status]
 const canCancel = delivery.status !== "cancelled" && delivery.status !== "delivered" && delivery.status !== "failed"

 const summaryCards = [
 { label: "Status", value: delivery.status, color: "text-blue-600 bg-blue-100" },
 { label: "Items", value: delivery.totalItems, color: "text-amber-600 bg-amber-100" },
 { label: "Total Value", value: `฿${delivery.totalValue.toLocaleString()}`, color: "text-emerald-600 bg-emerald-100" },
 { label: "Tracking", value: delivery.trackingNumber || "—", color: "text-violet-600 bg-violet-100" },
 ]

 const itemColumns: Column<DeliveryItemType>[] = [
 { key: "product", label: "Product", render: (i) => <span className="font-medium">{i.product.name}</span> },
 { key: "sku", label: "SKU", render: (i) => <span className="font-mono text-xs text-muted-foreground">{i.product.sku}</span> },
 { key: "barcode", label: "Barcode", render: (i) => <span className="font-mono text-xs text-muted-foreground">{i.product.barcode || "—"}</span> },
 { key: "quantity", label: "Qty", cellClassName: "font-mono text-sm", render: (i) => <span>{i.quantity}</span> },
 { key: "deliveredQty", label: "Delivered", cellClassName: "font-mono text-sm text-muted-foreground", render: (i) => <span>{i.deliveredQty}</span> },
 { key: "unitPrice", label: "Unit Price", render: (i) => <span className="font-mono text-sm">฿{i.unitPrice.toLocaleString()}</span> },
 { key: "total", label: "Total", render: (i) => <span className="font-mono text-sm font-medium">฿{i.total.toLocaleString()}</span> },
 ]

 return (
 <div className="animate-fade-in space-y-6">
  <Breadcrumb className="mb-4">
  <BreadcrumbList>
  <BreadcrumbItem>
  <BreadcrumbLink asChild>
  <button onClick={() => router.push("/deliveries")}>Deliveries</button>
  </BreadcrumbLink>
  </BreadcrumbItem>
  <BreadcrumbSeparator />
  <BreadcrumbItem>
  <BreadcrumbPage>{delivery.number}</BreadcrumbPage>
  </BreadcrumbItem>
  </BreadcrumbList>
  </Breadcrumb>

  <div className="flex items-start justify-between">
  <div className="flex items-start gap-4">
  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
  </div>
  <div>
  <div className="flex items-center gap-3 mb-1">
  <h1 className="text-2xl font-semibold font-mono">{delivery.number}</h1>
 <Badge className={`${statusColors[delivery.status] || ""} border-0 font-medium`}>
 {delivery.status}
 </Badge>
 </div>
 <p className="text-sm text-muted-foreground">
 {delivery.distributor.name}
 {delivery.distributor.territory && ` · ${delivery.distributor.territory}`}
 </p>
 </div>
 </div>
<div className="flex items-center gap-2">
  {canAdvance && (
  <Button size="sm" onClick={handleAdvanceStatus} disabled={updating} className="gap-1.5">
  Advance to {nextStatus[delivery.status]}
  </Button>
  )}
  <DropdownMenu>
  <DropdownMenuTrigger asChild>
  <Button variant="ghost" size="sm" className="h-9 w-9 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
   <DropdownMenuItem onClick={() => router.push(`/deliveries/${delivery.id}/edit`)}><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
  {canCancel && <DropdownMenuSeparator />}
  {canCancel && (
  <DropdownMenuItem onClick={handleCancel}><XCircle className="w-4 h-4 mr-2" /> Cancel</DropdownMenuItem>
  )}
  <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
  </DropdownMenuContent>
  </DropdownMenu>
</div>
 </div>

 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {summaryCards.map((card) => (
 <Card key={card.label} className="border-border/50">
 <CardContent className="p-4">
 <div className="flex items-center gap-3">
 <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
 {card.label === "Status" && null}
 {card.label === "Items" && null}
 {card.label === "Total Value" && null}
 {card.label === "Tracking" && null}
 </div>
 <div className="min-w-0">
 <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">
 {card.label}
 </p>
 <p className="text-sm font-semibold font-mono mt-0.5 truncate">{card.value}</p>
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <Card className="lg:col-span-2">
 <CardHeader>
 <CardTitle className="text-base flex items-center gap-2">
 Items
 </CardTitle>
 </CardHeader>
 <CardContent className="p-0">
 <DataTable
 columns={itemColumns}
 data={delivery.items}
 loading={false}
 noBorder
 />
 </CardContent>
 </Card>

 <Card>
 <CardHeader>
 <CardTitle className="text-base flex items-center gap-2">
 Tracking Timeline
 </CardTitle>
 </CardHeader>
 <CardContent>
 {delivery.tracking.length > 0 ? (
 <div className="space-y-0">
 {delivery.tracking.map((entry, idx) => (
 <div key={entry.id} className="flex gap-3 pb-4 relative">
 {idx < delivery.tracking.length - 1 && (
 <div className="absolute left-[11px] top-5 bottom-0 w-px bg-border" />
 )}
 <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
 entry.status === "delivered" ? "bg-emerald-100" :
 entry.status === "failed" || entry.status === "cancelled" ? "bg-red-100" :
 "bg-blue-100"
 }`}>
 <div className={`w-2 h-2 rounded-full ${
 entry.status === "delivered" ? "bg-emerald-600" :
 entry.status === "failed" || entry.status === "cancelled" ? "bg-red-600" :
 "bg-blue-600"
 }`} />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between">
 <p className="text-sm font-medium capitalize">{entry.status.replace(/_/g, " ")}</p>
 <span className="text-[11px] text-muted-foreground">
 {format(new Date(entry.timestamp), "dd/MM HH:mm")}
 </span>
 </div>
 {entry.location && <p className="text-xs text-muted-foreground">{entry.location}</p>}
 {entry.note && <p className="text-xs text-muted-foreground mt-0.5">{entry.note}</p>}
 </div>
 </div>
 ))}
 </div>
 ) : (
  <EmptyState
  icons={[<Truck key="t1" className="w-6 h-6" />, <MapPin key="t2" className="w-6 h-6" />, <Calendar key="t3" className="w-6 h-6" />]}
  title="No tracking entries"
  description="Tracking updates for this delivery will appear here"
  size="sm"
  />
 )}
 </CardContent>
 </Card>
 </div>

 <Card>
 <CardContent className="p-5">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-4">
 <div>
 <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Building2 className="w-3 h-3" /> Distributor</p>
 <p className="text-sm font-medium">{delivery.distributor.name}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">Origin</p>
 <p className="text-sm">{delivery.origin || "—"}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">Destination</p>
 <p className="text-sm">{delivery.destination || "—"}</p>
 </div>
 </div>
 <div className="space-y-4">
 <div>
 <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">Carrier</p>
 <p className="text-sm font-medium">{delivery.carrier || "—"}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Estimated Date</p>
 <p className="text-sm">{delivery.estimatedDate ? format(new Date(delivery.estimatedDate), "dd/MM/yyyy") : "—"}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Actual Date</p>
 <p className="text-sm">{delivery.actualDate ? format(new Date(delivery.actualDate), "dd/MM/yyyy") : "—"}</p>
 </div>
 {delivery.warehouse && (
 <div>
 <p className="text-xs text-muted-foreground mb-1">Warehouse</p>
 <p className="text-sm font-medium">{delivery.warehouse.name} ({delivery.warehouse.location || "—"})</p>
 </div>
 )}
 {delivery.notes && (
 <div>
 <p className="text-xs text-muted-foreground mb-1">Notes</p>
 <p className="text-sm">{delivery.notes}</p>
 </div>
 )}
 </div>
 </div>
 </CardContent>
 </Card>

 <ConfirmDialog
 open={deleteOpen}
 onOpenChange={setDeleteOpen}
 title="Delete Delivery"
 description={`Are you sure you want to delete delivery "${delivery.number}"? This action cannot be undone.`}
 onConfirm={handleDelete}
 loading={deleting}
 />
 </div>
 )
}
