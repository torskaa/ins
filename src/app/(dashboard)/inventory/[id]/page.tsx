"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { AlertTriangle, ArrowLeft, Barcode, Boxes, Building2, Clock, DollarSign, FileText, Hash, Layers, MapPin, Package, Pencil, Ruler, ShoppingCart, Tags, Trash2, Warehouse, Weight, XCircle } from "lucide-react"
import { formatCurrency, formatNumber, formatDate, formatDateTime, cn } from "@/lib/utils"
import { toast } from "sonner"
import { SkeletonDetail } from "@/components/ui/skeleton"
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

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showAdjust, setShowAdjust] = useState(false)
  const [adjustQty, setAdjustQty] = useState("0")
  const [adjustReason, setAdjustReason] = useState("")
  const [tab, setTab] = useState("bom")
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
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data)
        setForm({
          name: data.name,
          sku: data.sku,
          description: data.description || "",
          type: data.type || "",
          barcode: data.barcode || "",
          unitPrice: String(data.unitPrice),
          costPrice: String(data.costPrice),
          stock: String(data.stock),
          minStock: String(data.minStock),
          maxStock: String(data.maxStock || ""),
          location: data.location || "",
          length: data.length != null ? String(data.length) : "",
          width: data.width != null ? String(data.width) : "",
          height: data.height != null ? String(data.height) : "",
          weight: data.weight != null ? String(data.weight) : "",
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

  if (loading) return <SkeletonDetail cards={3} hasChart={true} />

  if (!product) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Product not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The product you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/inventory")}>Back to Inventory</Button>
      </div>
    )
  }

  const isLowStock = product.stock <= product.minStock
  const profit = product.unitPrice - product.costPrice
  const profitMargin = product.unitPrice > 0 ? (profit / product.unitPrice) * 100 : 0

  async function handleSave() {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          unitPrice: parseFloat(form.unitPrice) || 0,
          costPrice: parseFloat(form.costPrice) || 0,
          stock: parseInt(form.stock) || 0,
          minStock: parseInt(form.minStock) || 0,
          maxStock: form.maxStock ? parseInt(form.maxStock) : null,
          length: form.length ? parseFloat(form.length) : null,
          width: form.width ? parseFloat(form.width) : null,
          height: form.height ? parseFloat(form.height) : null,
          weight: form.weight ? parseFloat(form.weight) : null,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      const updated = await res.json()
      setProduct(updated)
      setEditing(false)
      toast.success("Product updated")
    } catch {
      toast.error("Failed to update product")
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      toast.success("Product deleted")
      router.push("/inventory")
      router.refresh()
    } catch {
      toast.error("Failed to delete product")
      setDeleting(false)
    }
  }

  async function handleAdjust() {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: parseInt(adjustQty), adjustReason }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Stock adjusted")
      setShowAdjust(false)
      setProduct({ ...product, stock: parseInt(adjustQty) })
      setAdjustReason("")
    } catch {
      toast.error("Failed to adjust stock")
    }
  }

  const statusVariant: Record<string, "success" | "secondary" | "warning" | "destructive" | "default"> = {
    active: "success",
    inactive: "secondary",
    draft: "warning",
    discontinued: "destructive",
  }

  const cancelEdit = () => {
    setEditing(false)
    setForm({
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      type: product.type || "",
      barcode: product.barcode || "",
      unitPrice: String(product.unitPrice),
      costPrice: String(product.costPrice),
      stock: String(product.stock),
      minStock: String(product.minStock),
      maxStock: String(product.maxStock || ""),
      location: product.location || "",
      length: product.length != null ? String(product.length) : "",
      width: product.width != null ? String(product.width) : "",
      height: product.height != null ? String(product.height) : "",
      weight: product.weight != null ? String(product.weight) : "",
      categoryId: product.categoryId || "",
      supplierId: product.supplierId || "",
      warehouseId: product.warehouseId || "",
    })
  }

  const bomColumns: Column<any>[] = [
    { key: "name", label: "Name", render: (item) => <span className="font-medium">{item.name}</span> },
    { key: "quantity", label: "Quantity", render: (item) => <span className="font-mono">{formatNumber(item.quantity)}</span> },
    { key: "unit", label: "Unit", render: (item) => <span className="text-muted-foreground">{item.unit || "—"}</span> },
    { key: "status", label: "Status", render: (item) => (
      <Badge variant={item.status === "active" ? "success" : "secondary"}>{item.status}</Badge>
    )},
  ]

  const orderItemColumns: Column<any>[] = [
    { key: "orderNumber", label: "Order", render: (item) => (
      <button onClick={() => router.push(`/orders/${item.orderId}`)} className="font-mono text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">{item.order?.orderNumber}</button>
    )},
    { key: "type", label: "Type", render: (item) => <span className="capitalize text-muted-foreground">{item.order?.type}</span> },
    { key: "status", label: "Status", render: (item) => <Badge variant={statusVariant[item.order?.status] || "secondary"}>{item.order?.status}</Badge> },
    { key: "quantity", label: "Qty", render: (item) => <span className="font-mono">{formatNumber(item.quantity)}</span> },
    { key: "unitPrice", label: "Unit Price", render: (item) => <span className="font-mono">{formatCurrency(item.unitPrice)}</span> },
    { key: "total", label: "Total", render: (item) => <span className="font-mono font-medium">{formatCurrency(item.total)}</span> },
  ]

  const invoiceItemColumns: Column<any>[] = [
    { key: "invoiceNumber", label: "Invoice", render: (item) => (
      <button onClick={() => router.push(`/invoices/${item.invoiceId}`)} className="font-mono text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">{item.invoice?.invoiceNumber}</button>
    )},
    { key: "status", label: "Status", render: (item) => <Badge variant={statusVariant[item.invoice?.status] || "secondary"}>{item.invoice?.status}</Badge> },
    { key: "quantity", label: "Qty", render: (item) => <span className="font-mono">{formatNumber(item.quantity)}</span> },
    { key: "unitPrice", label: "Unit Price", render: (item) => <span className="font-mono">{formatCurrency(item.unitPrice)}</span> },
    { key: "total", label: "Total", render: (item) => <span className="font-mono font-medium">{formatCurrency(item.total)}</span> },
  ]

  const movementColumns: Column<any>[] = [
    { key: "type", label: "Type", render: (item) => {
      const variant: Record<string, "success" | "default" | "warning" | "secondary"> = { received: "success", sold: "default", adjusted: "warning", returned: "success", transferred: "secondary" }
      return <Badge variant={variant[item.type] || "secondary"} className="capitalize">{item.type}</Badge>
    }},
    { key: "quantity", label: "Quantity", render: (item) => {
      const isPositive = ["received", "returned"].includes(item.type)
      return <span className={`font-mono font-medium ${isPositive ? "text-success" : "text-destructive"}`}>{isPositive ? "+" : "-"}{formatNumber(Math.abs(item.quantity))}</span>
    }},
    { key: "description", label: "Description", render: (item) => <span className="text-muted-foreground">{item.description || "—"}</span> },
    { key: "reference", label: "Reference", render: (item) => <span className="font-mono text-xs text-muted-foreground">{item.reference || "—"}</span> },
    { key: "createdAt", label: "Date", render: (item) => <span className="text-muted-foreground text-sm">{formatDateTime(new Date(item.createdAt))}</span> },
  ]

  const lotColumns: Column<any>[] = [
    { key: "lotNumber", label: "Lot Number", render: (item) => <span className="font-mono text-xs font-medium">{item.lotNumber}</span> },
    { key: "quantity", label: "Quantity", render: (item) => <span className="font-mono">{formatNumber(item.quantity)}</span> },
    { key: "expiryDate", label: "Expiry", render: (item) => {
      const date = item.expiryDate
      if (!date) return <span className="text-muted-foreground">—</span>
      const expired = new Date(date) < new Date()
      return <span className={expired ? "text-destructive" : "text-muted-foreground"}>{formatDate(new Date(date))}{expired && <AlertTriangle className="w-3 h-3 inline ml-1" />}</span>
    }},
    { key: "createdAt", label: "Created", render: (item) => <span className="text-muted-foreground text-sm">{formatDate(new Date(item.createdAt))}</span> },
  ]

  const supplierPriceColumns: Column<any>[] = [
    { key: "supplier", label: "Supplier", render: (item) => <span className="font-medium">{item.supplier?.name}</span> },
    { key: "price", label: "Price", render: (item) => <span className="font-mono font-medium">{formatCurrency(item.price)}</span> },
    { key: "currency", label: "Currency", render: (item) => <span className="font-mono text-xs">{item.currency}</span> },
    { key: "validFrom", label: "Valid From", render: (item) => item.validFrom ? <span className="text-muted-foreground text-sm">{formatDate(new Date(item.validFrom))}</span> : <span className="text-muted-foreground">—</span> },
    { key: "validTo", label: "Valid To", render: (item) => {
      const date = item.validTo
      if (!date) return <span className="text-muted-foreground">—</span>
      return <span className={`text-sm ${new Date(date) < new Date() ? "text-destructive" : "text-muted-foreground"}`}>{formatDate(new Date(date))}</span>
    }},
  ]

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 -mx-6 -mt-6 px-6 pt-6 pb-3 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <button onClick={() => router.push("/inventory")} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Inventory
            </button>
            <div className="flex items-center gap-2.5 flex-wrap">
              {editing ? (
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="text-lg font-semibold h-8 w-64" />
              ) : (
                <h1 className="text-lg font-semibold">{product.name}</h1>
              )}
              <Badge variant="outline" className="font-mono text-[10px]">{product.sku}</Badge>
              <Badge variant={statusVariant[product.status] || "secondary"} className="capitalize text-[10px]">{product.status}</Badge>
              {isLowStock && (
                <Badge variant="destructive" className="gap-1 text-[10px]"><AlertTriangle className="w-3 h-3" /> Low Stock</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Created {formatDate(new Date(product.createdAt))}{product.updatedAt && ` · Updated ${formatDate(new Date(product.updatedAt))}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            {editing ? (
              <>
                <Button size="sm" onClick={handleSave} className="gap-1.5 h-8 text-xs">Save</Button>
                <Button variant="secondary" size="sm" onClick={cancelEdit} className="gap-1.5 h-8 text-xs">Cancel</Button>
              </>
            ) : (
              <>
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)} className="gap-1.5 h-8 text-xs"><Pencil className="w-3.5 h-3.5" /> Edit</Button>
                <Button variant="secondary" size="sm" onClick={() => setShowAdjust(true)} className="gap-1.5 h-8 text-xs"><Boxes className="w-3.5 h-3.5" /> Adjust Stock</Button>
                <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)} className="h-8 w-8 p-0"><Trash2 className="w-3.5 h-3.5" /></Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bento Grid — Main Content + Sidebar */}
      <div className="grid grid-cols-12 gap-4">
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
              {editing ? (
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <FieldGroup label="Product Name" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-8 text-sm" /></FieldGroup>
                  <FieldGroup label="SKU" required><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="h-8 text-sm font-mono" /></FieldGroup>
                  <FieldGroup label="Type"><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. Finished Good" className="h-8 text-sm" /></FieldGroup>
                  <FieldGroup label="Barcode"><Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="UPC / EAN" className="h-8 text-sm font-mono" /></FieldGroup>
                  <div className="col-span-2">
                    <FieldGroup label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="text-sm" /></FieldGroup>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                  <FieldDisplay label="Name" value={product.name} />
                  <FieldDisplay label="SKU" value={product.sku} mono />
                  <FieldDisplay label="Type" value={product.type || "—"} />
                  <FieldDisplay label="Barcode" value={product.barcode || "—"} mono />
                  {product.description && (
                    <div className="col-span-2">
                      <p className="text-[11px] text-muted-foreground font-medium mb-0.5">Description</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                    </div>
                  )}
                </div>
              )}
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
              {editing ? (
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <FieldGroup label="Current Stock"><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="h-8 text-sm" /></FieldGroup>
                  <FieldGroup label="Min Stock Level"><Input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} className="h-8 text-sm" /></FieldGroup>
                  <FieldGroup label="Max Stock Level"><Input type="number" value={form.maxStock} onChange={(e) => setForm({ ...form, maxStock: e.target.value })} className="h-8 text-sm" /></FieldGroup>
                  <FieldGroup label="Location"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Aisle-Bin" className="h-8 text-sm" /></FieldGroup>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                  <FieldDisplay label="Current Stock" value={`${formatNumber(product.stock)} units`} mono />
                  <FieldDisplay label="Min Stock Level" value={formatNumber(product.minStock)} mono />
                  <FieldDisplay label="Max Stock Level" value={product.maxStock ? formatNumber(product.maxStock) : "Not set"} mono />
                  <FieldDisplay label="Location" value={product.location || "—"} />
                </div>
              )}
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
              {editing ? (
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <FieldGroup label="Unit Price (Sell)"><Input type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} className="h-8 text-sm" /></FieldGroup>
                  <FieldGroup label="Cost Price"><Input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className="h-8 text-sm" /></FieldGroup>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                  <FieldDisplay label="Unit Price" value={formatCurrency(product.unitPrice)} mono />
                  <FieldDisplay label="Cost Price" value={formatCurrency(product.costPrice)} mono />
                  <FieldDisplay label="Gross Margin" value={`${profitMargin >= 0 ? "+" : ""}${profitMargin.toFixed(1)}%`} mono />
                  <FieldDisplay label="Profit per Unit" value={formatCurrency(profit)} mono />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols) — Contextual / Meta */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Quick Status */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Boxes className="w-4 h-4 text-primary" />
                Stock Overview
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className={`text-2xl font-semibold font-mono ${isLowStock ? "text-destructive" : ""}`}>{formatNumber(product.stock)}</span>
                <span className="text-xs text-muted-foreground">units in stock</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${isLowStock ? "bg-destructive" : "bg-success"}`}
                  style={{ width: `${Math.min((product.stock / (product.maxStock || product.stock * 2)) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Min: {formatNumber(product.minStock)}</span>
                <span>Max: {product.maxStock ? formatNumber(product.maxStock) : "∞"}</span>
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
              {editing ? (
                <div className="space-y-2">
                  <FieldGroup label="Category"><Select options={categories.map(c => ({ value: c.id, label: c.name }))} placeholder="Select category" value={form.categoryId} onChange={(e: any) => setForm({ ...form, categoryId: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Supplier"><Select options={suppliers.map(s => ({ value: s.id, label: s.name }))} placeholder="Select supplier" value={form.supplierId} onChange={(e: any) => setForm({ ...form, supplierId: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Warehouse"><Select options={warehouses.map(w => ({ value: w.id, label: w.name }))} placeholder="Select warehouse" value={form.warehouseId} onChange={(e: any) => setForm({ ...form, warehouseId: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Location"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Aisle-Bin" className="h-8 text-sm" /></FieldGroup>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5"><Tags className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Category</span><span className="text-sm font-medium ml-auto">{product.category?.name || "—"}</span></div>
                  <div className="flex items-center gap-2.5"><Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Supplier</span><span className="text-sm font-medium ml-auto">{product.supplier?.name || "—"}</span></div>
                  <div className="flex items-center gap-2.5"><Warehouse className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Warehouse</span><span className="text-sm font-medium ml-auto">{product.warehouse?.name || "—"}</span></div>
                  <div className="flex items-center gap-2.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Location</span><span className="text-sm font-medium ml-auto">{product.location || "—"}</span></div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dimensions & Weight */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Ruler className="w-4 h-4 text-primary" />
                Dimensions & Weight
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {editing ? (
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Length (cm)"><Input type="number" step="0.1" value={form.length} onChange={(e) => setForm({ ...form, length: e.target.value })} className="h-8 text-sm" /></FieldGroup>
                  <FieldGroup label="Width (cm)"><Input type="number" step="0.1" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} className="h-8 text-sm" /></FieldGroup>
                  <FieldGroup label="Height (cm)"><Input type="number" step="0.1" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} className="h-8 text-sm" /></FieldGroup>
                  <FieldGroup label="Weight (kg)"><Input type="number" step="0.01" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="h-8 text-sm" /></FieldGroup>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                  <FieldDisplay label="Length" value={product.length ? `${product.length} cm` : "—"} />
                  <FieldDisplay label="Width" value={product.width ? `${product.width} cm` : "—"} />
                  <FieldDisplay label="Height" value={product.height ? `${product.height} cm` : "—"} />
                  <FieldDisplay label="Weight" value={product.weight ? `${product.weight} kg` : "—"} />
                </div>
              )}
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
                <FieldDisplay label="Created" value={formatDate(new Date(product.createdAt))} />
                <FieldDisplay label="Updated" value={product.updatedAt ? formatDate(new Date(product.updatedAt)) : "—"} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unified Tab Module */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full overflow-x-auto px-4">
            <TabsTrigger value="bom"><Layers className="w-4 h-4" /> BOM</TabsTrigger>
            <TabsTrigger value="orders"><ShoppingCart className="w-4 h-4" /> Orders</TabsTrigger>
            <TabsTrigger value="invoices"><FileText className="w-4 h-4" /> Invoices</TabsTrigger>
            <TabsTrigger value="movements"><Boxes className="w-4 h-4" /> Movements</TabsTrigger>
            <TabsTrigger value="lots"><Hash className="w-4 h-4" /> Lots</TabsTrigger>
            <TabsTrigger value="pricing"><DollarSign className="w-4 h-4" /> Supplier Pricing</TabsTrigger>
          </TabsList>

          <TabsContent value="bom" className="p-3">
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-6 flex flex-col">
                <Card className="flex-1">
                  <CardHeader className="px-3 pt-3 pb-0">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Layers className="w-4 h-4 text-primary" />
                      As Finished Good
                    </div>
                  </CardHeader>
                  <CardContent className="p-3">
                    {(product.bomAsFinished || []).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <Layers className="w-8 h-8 text-muted-foreground/30 mb-2" />
                        <p className="text-xs text-muted-foreground mb-2">No BOM linked as finished good</p>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5"><Package className="w-3.5 h-3.5" /> Link BOM</Button>
                      </div>
                    ) : (
                      <DataTable columns={bomColumns} data={product.bomAsFinished || []} noBorder compact />
                    )}
                  </CardContent>
                </Card>
              </div>
              <div className="col-span-6 flex flex-col">
                <Card className="flex-1">
                  <CardHeader className="px-3 pt-3 pb-0">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Package className="w-4 h-4 text-primary" />
                      Where Used
                    </div>
                  </CardHeader>
                  <CardContent className="p-3">
                    {(product.bomAsMaterial || []).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <Package className="w-8 h-8 text-muted-foreground/30 mb-2" />
                        <p className="text-xs text-muted-foreground">Not used as a component in any BOM</p>
                      </div>
                    ) : (
                      <DataTable columns={bomColumns} data={product.bomAsMaterial || []} noBorder compact />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="p-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              Order History ({product.orderItems?.length || 0})
            </div>
            <DataTable columns={orderItemColumns} data={product.orderItems || []} searchable searchPlaceholder="Search orders..." noBorder compact />
          </TabsContent>

          <TabsContent value="invoices" className="p-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <FileText className="w-4 h-4 text-primary" />
              Invoices ({product.invoiceItems?.length || 0})
            </div>
            <DataTable columns={invoiceItemColumns} data={product.invoiceItems || []} searchable searchPlaceholder="Search invoices..." noBorder compact />
          </TabsContent>

          <TabsContent value="movements" className="p-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Boxes className="w-4 h-4 text-primary" />
              Stock Movements
            </div>
            <DataTable columns={movementColumns} data={product.movements || []} searchable searchPlaceholder="Search movements..." noBorder compact />
          </TabsContent>

          <TabsContent value="lots" className="p-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Hash className="w-4 h-4 text-primary" />
              Lot / Serial Number Tracking
            </div>
            <DataTable columns={lotColumns} data={product.lots || []} searchable searchPlaceholder="Search lots..." noBorder compact />
          </TabsContent>

          <TabsContent value="pricing" className="p-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Supplier Prices
            </div>
            <DataTable columns={supplierPriceColumns} data={product.supplierPrices || []} searchable searchPlaceholder="Search supplier prices..." noBorder compact />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <Dialog open={showAdjust} onOpenChange={setShowAdjust}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>Update the stock quantity for <span className="font-medium text-foreground">{product.name}</span></DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="adjustQty">New Stock Quantity</Label>
              <Input id="adjustQty" type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} />
            </div>
            <div className="space-y-2">
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

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{product.name}</strong>? This action cannot be undone.</DialogDescription>
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
