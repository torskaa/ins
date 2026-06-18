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
import { AlertTriangle, ArrowLeftRight, Building2, Clock, DollarSign, Hash, Layers, MapPin, Package, Pencil, Tags, Trash2, TrendingUp, Warehouse, XCircle } from "lucide-react"
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

function FieldDisplay({ label, value, mono, badge }: { label: string; value: string; mono?: boolean; badge?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground font-medium mb-0.5 truncate">{label}</p>
      {badge ? (
        <Badge variant={value === "active" ? "success" : "secondary"} className="capitalize">{value}</Badge>
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

export default function MaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [material, setMaterial] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showAdjust, setShowAdjust] = useState(false)
  const [adjustQty, setAdjustQty] = useState("0")
  const [adjustReason, setAdjustReason] = useState("")
  const [tab, setTab] = useState("movements")
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState<any>({})
  const router = useRouter()
  const [id, setId] = useState<string>("")

  useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  useEffect(() => {
    if (!id) return
    fetch(`/api/materials/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setMaterial(data)
        setForm({
          name: data.name,
          sku: data.sku,
          description: data.description || "",
          unitPrice: String(data.unitPrice),
          costPrice: String(data.costPrice),
          stock: String(data.stock),
          minStock: String(data.minStock),
          maxStock: String(data.maxStock || ""),
          location: data.location || "",
          categoryId: data.categoryId || "",
          supplierId: data.supplierId || "",
          warehouseId: data.warehouseId || "",
        })
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then(r => r.json()).catch(() => []),
      fetch("/api/suppliers").then(r => r.json()).catch(() => []),
      fetch("/api/warehouses").then(r => r.json()).catch(() => []),
    ]).then(([cats, sups, whs]) => {
      setCategories(Array.isArray(cats) ? cats : [])
      setSuppliers(Array.isArray(sups) ? sups : [])
      setWarehouses(Array.isArray(whs) ? whs : [])
    })
  }, [])

  if (loading) return <SkeletonDetail cards={3} hasChart={false} />

  if (!material) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Material not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The material you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/materials")}>Back to Materials</Button>
      </div>
    )
  }

  const isLowStock = material.stock <= material.minStock
  const profit = material.unitPrice - material.costPrice
  const profitMargin = material.unitPrice > 0 ? (profit / material.unitPrice) * 100 : 0

  async function handleSave() {
    try {
      const res = await fetch(`/api/materials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          unitPrice: parseFloat(form.unitPrice) || 0,
          costPrice: parseFloat(form.costPrice) || 0,
          stock: parseInt(form.stock) || 0,
          minStock: parseInt(form.minStock) || 0,
          maxStock: form.maxStock ? parseInt(form.maxStock) : null,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      const updated = await res.json()
      setMaterial(updated)
      setShowEdit(false)
      toast.success("Material updated")
    } catch {
      toast.error("Failed to update material")
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/materials/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      toast.success("Material deleted")
      router.push("/materials")
      router.refresh()
    } catch {
      toast.error("Failed to delete material")
      setDeleting(false)
    }
  }

  async function handleAdjust() {
    try {
      const res = await fetch(`/api/materials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: parseInt(adjustQty) }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Stock adjusted")
      setShowAdjust(false)
      setMaterial({ ...material, stock: parseInt(adjustQty) })
      setAdjustReason("")
    } catch {
      toast.error("Failed to adjust stock")
    }
  }

  const movementColumns = [
    { key: "type", label: "Type", render: (item: any) => <SemanticBadge semantic={item.type || ""} category="type" className="capitalize">{item.type}</SemanticBadge> },
    { key: "quantity", label: "Quantity", render: (item: any) => {
      const isPositive = ["received", "returned"].includes(item.type)
      return <span className={`font-mono font-medium ${isPositive ? "text-success" : "text-destructive"}`}>{isPositive ? "+" : "-"}{formatNumber(Math.abs(item.quantity))}</span>
    }},
    { key: "description", label: "Description", render: (item: any) => <span className="text-muted-foreground">{item.description || "—"}</span> },
    { key: "reference", label: "Reference", render: (item: any) => <span className="font-mono text-xs text-muted-foreground">{item.reference || "—"}</span> },
    { key: "createdAt", label: "Date", render: (item: any) => <span className="text-muted-foreground text-sm">{formatDateTime(new Date(item.createdAt))}</span> },
  ]

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button onClick={() => router.push("/materials")}>Materials</button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{material.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-12 gap-4">
        {/* Page Header — bento card */}
        <div className="col-span-12 border border-border/60 rounded-lg bg-card p-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex gap-3 min-w-0 flex-1">
              {material.image && (
                <img
                  src={material.image}
                  alt={material.name}
                  className="w-14 self-stretch rounded-lg object-cover border border-border/60 shrink-0"
                />
              )}
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{material.name}</h1>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <SemanticBadge semantic={material.status} category="status" appearance="outline" className="gap-1 capitalize text-[11px]"><BadgeDot />{material.status}</SemanticBadge>
                  <SemanticBadge semantic={material.sku} category="id" appearance="outline" className="gap-1 font-mono text-[11px]"><Hash className="w-3 h-3" />{material.sku}</SemanticBadge>
                  {isLowStock && (
                    <Badge variant="destructive" className="gap-1 text-[11px]"><AlertTriangle className="w-3 h-3" /> Low Stock</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setShowAdjust(true)} className="h-9 gap-1.5">Adjust Stock <ShortcutBadge shortcut="⌘C" /></Button>
                <MoreMenu actions={[
                  { label: "Edit", icon: <Pencil className="w-4 h-4" />, onClick: () => setShowEdit(true) },
                  "separator",
                  { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDelete(true) },
                ]} />
              </div>
              {material.updatedAt && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Updated {formatDate(new Date(material.updatedAt))}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Left Column (8 cols) — Primary Information */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          {/* Specifications */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Package className="w-4 h-4 text-primary" />
                Specifications
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Name" value={material.name} />
                <FieldDisplay label="SKU" value={material.sku} mono />
                {material.description && (
                  <div className="col-span-2">
                    <p className="text-[11px] text-muted-foreground font-medium mb-0.5">Description</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{material.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inventory & Stock Controls */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Layers className="w-4 h-4 text-primary" />
                Inventory & Stock Controls
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Current Stock" value={`${formatNumber(material.stock)} units`} mono />
                <FieldDisplay label="Min Stock Level" value={formatNumber(material.minStock)} mono />
                <FieldDisplay label="Max Stock Level" value={material.maxStock ? formatNumber(material.maxStock) : "Not set"} mono />
                <FieldDisplay label="Location" value={material.location || "—"} />
              </div>
              {isLowStock && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2 border border-destructive/10">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Stock is at or below minimum level
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing & Financials */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <DollarSign className="w-4 h-4 text-primary" />
                Pricing & Financials
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Unit Price" value={formatCurrency(material.unitPrice)} mono />
                <FieldDisplay label="Cost Price" value={formatCurrency(material.costPrice)} mono />
                <FieldDisplay label="Gross Margin" value={`${profitMargin >= 0 ? "+" : ""}${profitMargin.toFixed(1)}%`} mono />
                <FieldDisplay label="Profit per Unit" value={formatCurrency(profit)} mono />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols) — Contextual / Meta */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Quick Status */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Package className="w-4 h-4 text-primary" />
                Stock Overview
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className={`text-2xl font-semibold font-mono ${isLowStock ? "text-destructive" : ""}`}>{formatNumber(material.stock)}</span>
                <span className="text-xs text-muted-foreground">units in stock</span>
              </div>
              <Progress
                className="h-1.5 mb-2"
                indicatorClassName={isLowStock ? "bg-destructive" : "bg-success"}
                value={Math.min((material.stock / (material.maxStock || material.stock * 2)) * 100, 100)}
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Min: {formatNumber(material.minStock)}</span>
                <span>Max: {material.maxStock ? formatNumber(material.maxStock) : "∞"}</span>
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
                <div className="flex items-center gap-2.5"><Tags className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Category</span><span className="text-sm font-medium ml-auto">{material.category?.name || "—"}</span></div>
                <div className="flex items-center gap-2.5"><Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Supplier</span><span className="text-sm font-medium ml-auto">{material.supplier?.name || "—"}</span></div>
                <div className="flex items-center gap-2.5"><Warehouse className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Warehouse</span><span className="text-sm font-medium ml-auto">{material.warehouse?.name || "—"}</span></div>
                <div className="flex items-center gap-2.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Location</span><span className="text-sm font-medium ml-auto">{material.location || "—"}</span></div>
              </div>
            </CardContent>
          </Card>

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
                <FieldDisplay label="Created" value={formatDate(new Date(material.createdAt))} />
                <FieldDisplay label="Updated" value={material.updatedAt ? formatDate(new Date(material.updatedAt)) : "—"} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unified Tab Module */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full overflow-x-auto px-4">
            <TabsTrigger value="movements" className="gap-1.5"><ArrowLeftRight className="w-4 h-4" /> Movements</TabsTrigger>
          </TabsList>

          <TabsContent value="movements" className="p-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <ArrowLeftRight className="w-4 h-4 text-primary" />
              Stock Movements
            </div>
            {(material.movements || []).length === 0 ? (
              <EmptyState
                icons={[<ArrowLeftRight key="mm1" className="w-6 h-6" />, <Package key="mm2" className="w-6 h-6" />]}
                title="No movements"
                description="No stock movements recorded yet"
                size="sm"
              />
            ) : (
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {movementColumns.map((col) => (
                        <TableHead key={col.key}>{col.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {material.movements.map((item: any) => (
                      <TableRow key={item.id}>
                        {movementColumns.map((col) => (
                          <TableCell key={col.key}>
                            {col.render ? col.render(item) : String(item[col.key] ?? "")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-2xl flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>Edit Material</DialogTitle>
            <DialogDescription>Update details for <span className="font-medium text-foreground">{material?.name}</span></DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Basic Information */}
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
                  <FieldGroup label="SKU"><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></FieldGroup>
                </div>
                <FieldGroup label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></FieldGroup>
              </CardContent>
            </Card>

            {/* Pricing & Stock */}
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Pricing & Stock
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Unit Price"><Input type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Cost Price"><Input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /></FieldGroup>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <FieldGroup label="Current Stock"><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Min Stock Level"><Input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Max Stock Level"><Input type="number" value={form.maxStock} onChange={(e) => setForm({ ...form, maxStock: e.target.value })} /></FieldGroup>
                </div>
              </CardContent>
            </Card>

            {/* Classification */}
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Layers className="w-4 h-4 text-primary" />
                  Classification
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Category"><Select options={categories.map(c => ({ value: c.id, label: c.name }))} placeholder="Select category" value={form.categoryId} onChange={(e: any) => setForm({ ...form, categoryId: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Supplier"><Select options={suppliers.map(s => ({ value: s.id, label: s.name }))} placeholder="Select supplier" value={form.supplierId} onChange={(e: any) => setForm({ ...form, supplierId: e.target.value })} /></FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Warehouse"><Select options={warehouses.map(w => ({ value: w.id, label: w.name }))} placeholder="Select warehouse" value={form.warehouseId} onChange={(e: any) => setForm({ ...form, warehouseId: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Location"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Aisle-Bin" /></FieldGroup>
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border/60">
            <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes <ShortcutBadge shortcut="⌘↵" /></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={showAdjust} onOpenChange={setShowAdjust}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>Update the stock quantity for <span className="font-medium text-foreground">{material.name}</span></DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="adjustQty">New Stock Quantity</Label>
              <Input id="adjustQty" type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="adjustReason">Reason</Label>
              <Input id="adjustReason" placeholder="e.g. Inventory count adjustment" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowAdjust(false)}><XCircle className="w-4 h-4" /> Cancel</Button>
            <Button onClick={handleAdjust}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Material</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{material.name}</strong>? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowDelete(false)}><XCircle className="w-4 h-4" /> Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}><Trash2 className="w-4 h-4" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
