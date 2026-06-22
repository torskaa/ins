"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge, BadgeDot, SemanticBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Building2, Calendar, Clock, HouseIcon, MapPin, Package, Pencil, Trash2, Truck, XCircle } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"

function FieldDisplay({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground font-medium mb-0.5 truncate">{label}</p>
      <p className={cn("text-sm truncate", mono ? "font-mono" : "font-medium")}>{value || "—"}</p>
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

const statusFlow = ["draft", "packing", "shipped", "in_transit", "delivered"]

const nextStatus: Record<string, string> = {
  draft: "packing",
  packing: "shipped",
  shipped: "in_transit",
  in_transit: "delivered",
}

export default function DeliveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("")
  const router = useRouter()
  const [delivery, setDelivery] = useState<DeliveryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  useEffect(() => {
    if (!id) return
    fetch(`/api/deliveries/${id}`)
      .then(r => r.json())
      .then((json) => { if (json?.success) setDelivery(json.data); else throw new Error(json?.error || "Failed to load") })
      .catch((err) => { setError(err.message) })
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/deliveries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber: form.trackingNumber,
          carrier: form.carrier,
          estimatedDate: form.estimatedDate || null,
          origin: form.origin,
          destination: form.destination,
          notes: form.notes,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      const updated = await res.json()
      setDelivery((prev: any) => prev ? { ...prev, ...updated } : prev)
      setShowEdit(false)
      toast.success("Delivery updated")
    } catch {
      toast.error("Failed to update delivery")
    } finally {
      setSaving(false)
    }
  }

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
          actualDate: next === "delivered" ? new Date().toISOString() : undefined,
        }),
      })
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
        body: JSON.stringify({ status: "cancelled" }),
      })
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

  if (loading) return <SkeletonDetail cards={4} hasChart={true} />

  if (!delivery) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Delivery not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The delivery you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/deliveries")}>Back to Deliveries</Button>
      </div>
    )
  }

  const canAdvance = !!nextStatus[delivery.status]
  const canCancel = delivery.status !== "cancelled" && delivery.status !== "delivered" && delivery.status !== "failed"

  const itemColumns = [
    { key: "product", label: "Product", render: (i: DeliveryItemType) => <span className="font-medium">{i.product.name}</span> },
    { key: "sku", label: "SKU", render: (i: DeliveryItemType) => <span className="font-mono text-xs text-muted-foreground">{i.product.sku}</span> },
    { key: "barcode", label: "Barcode", render: (i: DeliveryItemType) => <span className="font-mono text-xs text-muted-foreground">{i.product.barcode || "—"}</span> },
    { key: "quantity", label: "Qty", render: (i: DeliveryItemType) => <span className="font-mono text-sm">{i.quantity}</span> },
    { key: "deliveredQty", label: "Delivered", render: (i: DeliveryItemType) => <span className="font-mono text-sm text-muted-foreground">{i.deliveredQty}</span> },
    { key: "unitPrice", label: "Unit Price", render: (i: DeliveryItemType) => <span className="font-mono text-sm">{formatCurrency(i.unitPrice)}</span> },
    { key: "total", label: "Total", render: (i: DeliveryItemType) => <span className="font-mono text-sm font-medium">{formatCurrency(i.total)}</span> },
  ]

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      {/* Breadcrumb */}
      <Frame variant="ghost" className="w-fit">
        <FramePanel className="gap-2 px-3! py-2! border-0!">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/deliveries" className="flex items-center gap-1.5">
                  <HouseIcon className="size-4" aria-hidden="true" />
                  Deliveries
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">{delivery.number}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </FramePanel>
      </Frame>

      <div className="grid grid-cols-12 gap-4">
        {/* Page Header */}
        <div className="col-span-12 border border-border/60 rounded-lg bg-card p-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex gap-3 min-w-0 flex-1">
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold font-mono">{delivery.number}</h1>
                  {delivery.distributor && (
                    <SemanticBadge semantic={delivery.distributor.name} category="category" className="gap-1 text-[11px]"><Building2 className="w-3 h-3" />{delivery.distributor.name}</SemanticBadge>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <SemanticBadge semantic={delivery.status} category="status" className="gap-1 text-[11px]"><BadgeDot />{delivery.status.replace(/_/g, " ")}</SemanticBadge>
                  <SemanticBadge semantic={delivery.trackingNumber || delivery.number} category="id" className="gap-1 font-mono text-[11px]"><Package className="w-3 h-3" />{delivery.trackingNumber || "—"}</SemanticBadge>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {canAdvance && (
                  <Button size="sm" onClick={handleAdvanceStatus} disabled={updating} className="gap-1.5 h-9">
                    Advance to {nextStatus[delivery.status]}
                  </Button>
                )}
                <MoreMenu actions={[
                  { label: "Edit", icon: <Pencil className="w-4 h-4" />, onClick: () => { setForm({ trackingNumber: delivery.trackingNumber || "", carrier: delivery.carrier || "", estimatedDate: delivery.estimatedDate ? delivery.estimatedDate.split("T")[0] : "", origin: delivery.origin || "", destination: delivery.destination || "", notes: delivery.notes || "" }); setShowEdit(true) } },
                  ...(canCancel ? [{ label: "Cancel", icon: <XCircle className="w-4 h-4" />, onClick: handleCancel }] : []),
                  "separator",
                  { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDelete(true) },
                ]} />
              </div>
              {delivery.estimatedDate && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Est. {formatDate(new Date(delivery.estimatedDate))}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Left Column (8 cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          {/* Items */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Package className="w-4 h-4 text-primary" />
                Items ({delivery.items?.length || 0})
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!delivery.items || delivery.items.length === 0 ? (
                <EmptyState
                  icons={[<Package key="di1" className="w-6 h-6" />, <Truck key="di2" className="w-6 h-6" />]}
                  title="No items"
                  description="This delivery has no items"
                  size="sm"
                />
              ) : (
                <div data-slot="frame">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {itemColumns.map((col) => (
                          <TableHead key={col.key as string}>{col.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {delivery.items.map((item) => (
                        <TableRow key={item.id}>
                          {itemColumns.map((col) => (
                            <TableCell key={col.key as string}>
                              {col.render ? col.render(item) : String((item as any)[col.key] ?? "")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Details */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Truck className="w-4 h-4 text-primary" />
                Delivery Details
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FieldDisplay label="Distributor" value={delivery.distributor.name} />
                  <FieldDisplay label="Origin" value={delivery.origin || "—"} />
                  <FieldDisplay label="Destination" value={delivery.destination || "—"} />
                </div>
                <div className="space-y-4">
                  <FieldDisplay label="Carrier" value={delivery.carrier || "—"} />
                  <FieldDisplay label="Estimated Date" value={delivery.estimatedDate ? formatDate(new Date(delivery.estimatedDate)) : "—"} />
                  <FieldDisplay label="Actual Date" value={delivery.actualDate ? formatDate(new Date(delivery.actualDate)) : "—"} />
                  {delivery.warehouse && (
                    <FieldDisplay label="Warehouse" value={`${delivery.warehouse.name} (${delivery.warehouse.location || "—"})`} />
                  )}
                </div>
              </div>
              {delivery.notes && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-[11px] text-muted-foreground font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{delivery.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Summary */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Package className="w-4 h-4 text-primary" />
                Summary
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <FieldDisplay label="Status" value={delivery.status.replace(/_/g, " ")} />
              <FieldDisplay label="Tracking Number" value={delivery.trackingNumber || "—"} mono />
              <FieldDisplay label="Total Items" value={String(delivery.totalItems)} />
              <FieldDisplay label="Total Value" value={formatCurrency(delivery.totalValue)} mono />
            </CardContent>
          </Card>

          {/* Tracking Timeline */}
          <Card className="flex-1">
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Truck className="w-4 h-4 text-primary" />
                Tracking Timeline
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {delivery.tracking.length > 0 ? (
                <div className="space-y-0">
                  {delivery.tracking.map((entry, idx) => (
                    <div key={entry.id} className="flex gap-3 pb-4 relative">
                      {idx < delivery.tracking.length - 1 && (
                        <div className="absolute left-[11px] top-5 bottom-0 w-px bg-border" />
                      )}
                      <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        entry.status === "delivered" ? "bg-success/15" :
                        entry.status === "failed" || entry.status === "cancelled" ? "bg-destructive/15" :
                        "bg-info/15"
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          entry.status === "delivered" ? "bg-success" :
                          entry.status === "failed" || entry.status === "cancelled" ? "bg-destructive" :
                          "bg-info"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium capitalize">{entry.status.replace(/_/g, " ")}</p>
                          <span className="text-[11px] text-muted-foreground">
                            {formatDateTime(new Date(entry.timestamp))}
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

          {/* Metadata */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="w-4 h-4 text-primary" />
                Dates
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Estimated" value={delivery.estimatedDate ? formatDate(new Date(delivery.estimatedDate)) : "—"} />
                <FieldDisplay label="Actual" value={delivery.actualDate ? formatDate(new Date(delivery.actualDate)) : "—"} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-lg flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>Edit Delivery</DialogTitle>
            <DialogDescription>Update details for <span className="font-medium text-foreground">{delivery?.number}</span></DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Truck className="w-4 h-4 text-primary" />
                  Delivery Information
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Tracking Number"><Input value={form.trackingNumber} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Carrier"><Input value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} placeholder="e.g. FedEx, UPS" /></FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Origin"><Input value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="City, State" /></FieldGroup>
                  <FieldGroup label="Destination"><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="City, State" /></FieldGroup>
                </div>
                <FieldGroup label="Estimated Date"><Input type="date" value={form.estimatedDate} onChange={(e) => setForm({ ...form, estimatedDate: e.target.value })} /></FieldGroup>
                <FieldGroup label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Internal notes..." /></FieldGroup>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border/60">
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save Changes <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘↵</kbd></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Delivery</DialogTitle>
            <DialogDescription>Are you sure you want to delete delivery <strong>{delivery.number}</strong>? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}><XCircle className="w-4 h-4" /> Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}><Trash2 className="w-4 h-4" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
