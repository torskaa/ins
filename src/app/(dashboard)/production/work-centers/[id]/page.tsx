"use client"

import { useState, useEffect, use } from "react"
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
import { Activity, Boxes, Building2, Calendar, Clock, Cog, DollarSign, Hash, Layers, MapPin, Package, Pencil, ShoppingCart, Trash2, XCircle } from "lucide-react"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { formatCurrency, formatNumber, formatDate, formatDateTime, cn } from "@/lib/utils"
import { toast } from "sonner"
import { SkeletonDetail } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { MoreMenu } from "@/components/ui/more-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"

type WorkCenter = {
  id: string
  code: string
  name: string
  description: string | null
  costPerHour: number
  capacity: number
  location: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
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

export default function WorkCenterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [wc, setWc] = useState<WorkCenter | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    fetch(`/api/work-centers/${id}`)
      .then(r => r.json())
      .then(json => { if (json?.success && json.data) { const d = json.data; setWc(d); setForm({ name: d.name, code: d.code, description: d.description || "", costPerHour: String(d.costPerHour), capacity: String(d.capacity), location: d.location || "", isActive: d.isActive ? "active" : "inactive" }) } else toast.error(json?.error || "Work center not found") })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <SkeletonDetail cards={3} hasChart={true} />

  if (!wc) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Work center not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The work center you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/production/work-centers")}>Back to Work Centers</Button>
      </div>
    )
  }

  async function handleSave() {
    try {
      const res = await fetch(`/api/work-centers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          costPerHour: parseFloat(form.costPerHour) || 0,
          capacity: parseInt(form.capacity) || 0,
          isActive: form.isActive === "active",
        }),
      })
      if (!res.ok) throw new Error("Failed")
      const updated = await res.json()
      setWc(updated)
      setShowEdit(false)
      toast.success("Work center updated")
    } catch {
      toast.error("Failed to update work center")
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/work-centers/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      toast.success("Work center deleted")
      router.push("/production/work-centers")
      router.refresh()
    } catch {
      toast.error("Failed to delete work center")
      setDeleting(false)
    }
  }

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button onClick={() => router.push("/production/work-centers")}>
                  <Cog className="size-4" />
                  Work Centers
                </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{wc.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-12 gap-4">
        {/* Page Header */}
        <div className="col-span-12 border border-border/60 rounded-lg bg-card p-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex gap-3 min-w-0 flex-1">
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{wc.name}</h1>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <SemanticBadge semantic={wc.isActive ? "active" : "inactive"} category="status" className="gap-1 text-[11px]"><BadgeDot />{wc.isActive ? "Active" : "Inactive"}</SemanticBadge>
                  <SemanticBadge semantic={wc.code} category="id" className="gap-1 font-mono text-[11px]"><Hash className="w-3 h-3" />{wc.code}</SemanticBadge>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <MoreMenu actions={[
                  { label: "Edit", icon: <Pencil className="w-4 h-4" />, onClick: () => setShowEdit(true) },
                  "separator",
                  { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDelete(true) },
                ]} />
              </div>
              {wc.updatedAt && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Updated {formatDate(new Date(wc.updatedAt))}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Left Column (8 cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          {/* Specifications */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Package className="w-4 h-4 text-primary" />
                Details
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Code" value={wc.code} mono />
                <FieldDisplay label="Cost per Hour" value={formatCurrency(wc.costPerHour)} mono />
                <FieldDisplay label="Capacity" value={`${formatNumber(wc.capacity)} units`} />
                <FieldDisplay label="Location" value={wc.location || "—"} />
              </div>
              {wc.description && (
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium mb-0.5">Description</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{wc.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Cost Overview */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <DollarSign className="w-4 h-4 text-primary" />
                Cost per Hour
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-semibold font-mono">{formatCurrency(wc.costPerHour)}</span>
                <span className="text-xs text-muted-foreground">/ hour</span>
              </div>
            </CardContent>
          </Card>

          {/* Capacity */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Boxes className="w-4 h-4 text-primary" />
                Capacity
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-semibold font-mono">{formatNumber(wc.capacity)}</span>
                <span className="text-xs text-muted-foreground">units</span>
              </div>
            </CardContent>
          </Card>

          {/* Organization */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="w-4 h-4 text-primary" />
                Organization
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5"><Activity className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Status</span><span className="text-sm font-medium ml-auto">{wc.isActive ? "Operational" : "Inactive"}</span></div>
                <div className="flex items-center gap-2.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Location</span><span className="text-sm font-medium ml-auto">{wc.location || "—"}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="flex-1">
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="w-4 h-4 text-primary" />
                Metadata
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Created" value={formatDate(new Date(wc.createdAt))} />
                <FieldDisplay label="Updated" value={wc.updatedAt ? formatDate(new Date(wc.updatedAt)) : "—"} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tab Module */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <Tabs defaultValue="orders">
          <TabsList className="w-full overflow-x-auto px-4">
            <TabsTrigger value="orders" className="gap-1.5"><ShoppingCart className="w-4 h-4" /> Production Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="p-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              Production Orders
            </div>
            <EmptyState
              icons={[<ShoppingCart key="po1" className="w-6 h-6" />, <Package key="po2" className="w-6 h-6" />]}
              title="No production orders"
              description="No production orders linked to this work center yet"
              actions={[{ label: "View All Orders", onClick: () => router.push(`/production/orders?workCenter=${wc.id}`) }]}
              size="sm"
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-2xl flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>Edit Work Center</DialogTitle>
            <DialogDescription>Update details for <span className="font-medium text-foreground">{wc?.name}</span></DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Package className="w-4 h-4 text-primary" />
                  Basic Information
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Name" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Code"><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></FieldGroup>
                </div>
                <FieldGroup label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Operations
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Cost per Hour"><Input type="number" step="0.01" value={form.costPerHour} onChange={(e) => setForm({ ...form, costPerHour: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Capacity"><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Location"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Floor, Building" /></FieldGroup>
                  <FieldGroup label="Status"><Select options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} value={form.isActive} onChange={(e: any) => setForm({ ...form, isActive: e.target.value })} /></FieldGroup>
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border/60">
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘↵</kbd></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Work Center</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{wc.name}</strong>? This action cannot be undone.</DialogDescription>
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
