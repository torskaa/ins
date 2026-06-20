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

import { ImageGallery } from "@/components/ui/image-gallery"
import { Progress } from "@/components/ui/progress"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { AlertTriangle, Barcode, Boxes, Building2, Calendar, Clock, DollarSign, FileText, Hash, HouseIcon, ImageIcon, Layers, MapPin, Package, Pencil, Ruler, ShoppingCart, TagIcon, Tags, Trash2, Warehouse, Weight, XCircle } from "lucide-react"
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

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
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

  const [searchOrders, setSearchOrders] = useState("")
  const [searchInvoices, setSearchInvoices] = useState("")
  const [searchMovements, setSearchMovements] = useState("")
  const [searchLots, setSearchLots] = useState("")
  const [searchPricing, setSearchPricing] = useState("")

  useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  useEffect(() => {
    if (!id) return
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json?.success) throw new Error(json?.error || "Failed to load")
        const data = json.data
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
      .catch((err) => { setError(err.message) })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then(r => r.json()).then(d => d.data || d).catch(() => []),
      fetch("/api/suppliers").then(r => r.json()).then(d => d.data || d).catch(() => []),
      fetch("/api/warehouses").then(r => r.json()).then(d => d.data || d).catch(() => []),
    ]).then(([cats, sups, whs]) => {
      setCategories(Array.isArray(cats) ? cats : [])
      setSuppliers(Array.isArray(sups) ? sups : [])
      setWarehouses(Array.isArray(whs) ? whs : [])
    })
  }, [])

  if (error) return (
    <div className="animate-fade-in pb-8 space-y-4">
      <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
    </div>
  )

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
      setShowEdit(false)
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


  const bomColumns = [
    { key: "name", label: "Name", render: (item: any) => <span className="font-medium">{item.material?.name || item.finishedGood?.name || "—"}</span> },
    { key: "quantity", label: "Quantity", render: (item: any) => <span className="font-mono">{formatNumber(item.quantity)}</span> },
    { key: "unit", label: "Unit", render: (item: any) => <span className="text-muted-foreground">{item.unit || "—"}</span> },
    { key: "status", label: "Status", render: (item: any) => (
      <SemanticBadge semantic={item.status || ""} category="status">{item.status}</SemanticBadge>
    )},
  ]

  const orderItemColumns = [
    { key: "orderNumber", label: "Order", render: (item: any) => (
      <button onClick={() => router.push(`/orders/${item.orderId}`)} className="font-mono text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">{item.order?.orderNumber}</button>
    )},
    { key: "type", label: "Type", render: (item: any) => <span className="capitalize text-muted-foreground">{item.order?.type}</span> },
    { key: "status", label: "Status", render: (item: any) => <SemanticBadge semantic={item.order?.status || ""} category="status">{item.order?.status}</SemanticBadge> },
    { key: "quantity", label: "Qty", render: (item: any) => <span className="font-mono">{formatNumber(item.quantity)}</span> },
    { key: "unitPrice", label: "Unit Price", render: (item: any) => <span className="font-mono">{formatCurrency(item.unitPrice)}</span> },
    { key: "total", label: "Total", render: (item: any) => <span className="font-mono font-medium">{formatCurrency(item.total)}</span> },
  ]

  const invoiceItemColumns = [
    { key: "invoiceNumber", label: "Invoice", render: (item: any) => (
      <button onClick={() => router.push(`/invoices/${item.invoiceId}`)} className="font-mono text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">{item.invoice?.invoiceNumber}</button>
    )},
    { key: "status", label: "Status", render: (item: any) => <SemanticBadge semantic={item.invoice?.status || ""} category="status">{item.invoice?.status}</SemanticBadge> },
    { key: "quantity", label: "Qty", render: (item: any) => <span className="font-mono">{formatNumber(item.quantity)}</span> },
    { key: "unitPrice", label: "Unit Price", render: (item: any) => <span className="font-mono">{formatCurrency(item.unitPrice)}</span> },
    { key: "total", label: "Total", render: (item: any) => <span className="font-mono font-medium">{formatCurrency(item.total)}</span> },
  ]

  const movementColumns = [
    { key: "type", label: "Type", render: (item: any) => <SemanticBadge semantic={item.type || ""} category="type" className="">{item.type}</SemanticBadge>
    },
    { key: "quantity", label: "Quantity", render: (item: any) => {
      const isPositive = ["received", "returned"].includes(item.type)
      return <span className={`font-mono font-medium ${isPositive ? "text-success" : "text-destructive"}`}>{isPositive ? "+" : "-"}{formatNumber(Math.abs(item.quantity))}</span>
    }},
    { key: "description", label: "Description", render: (item: any) => <span className="text-muted-foreground">{item.description || "—"}</span> },
    { key: "reference", label: "Reference", render: (item: any) => <span className="font-mono text-xs text-muted-foreground">{item.reference || "—"}</span> },
    { key: "createdAt", label: "Date", render: (item: any) => <span className="text-muted-foreground text-sm">{formatDateTime(new Date(item.createdAt))}</span> },
  ]

  const lotColumns = [
    { key: "lotNumber", label: "Lot Number", render: (item: any) => <span className="font-mono text-xs font-medium">{item.lotNumber}</span> },
    { key: "quantity", label: "Quantity", render: (item: any) => <span className="font-mono">{formatNumber(item.quantity)}</span> },
    { key: "expiryDate", label: "Expiry", render: (item: any) => {
      const date = item.expiryDate
      if (!date) return <span className="text-muted-foreground">—</span>
      const expired = new Date(date) < new Date()
      return <span className={expired ? "text-destructive" : "text-muted-foreground"}>{formatDate(new Date(date))}{expired && <AlertTriangle className="w-3 h-3 inline ml-1" />}</span>
    }},
    { key: "createdAt", label: "Created", render: (item: any) => <span className="text-muted-foreground text-sm">{formatDate(new Date(item.createdAt))}</span> },
  ]

  const supplierPriceColumns = [
    { key: "supplier", label: "Supplier", render: (item: any) => <span className="font-medium">{item.supplier?.name}</span> },
    { key: "price", label: "Price", render: (item: any) => <span className="font-mono font-medium">{formatCurrency(item.price)}</span> },
    { key: "currency", label: "Currency", render: (item: any) => <span className="font-mono text-xs">{item.currency}</span> },
    { key: "validFrom", label: "Valid From", render: (item: any) => item.validFrom ? <span className="text-muted-foreground text-sm">{formatDate(new Date(item.validFrom))}</span> : <span className="text-muted-foreground">—</span> },
    { key: "validTo", label: "Valid To", render: (item: any) => {
      const date = item.validTo
      if (!date) return <span className="text-muted-foreground">—</span>
      return <span className={`text-sm ${new Date(date) < new Date() ? "text-destructive" : "text-muted-foreground"}`}>{formatDate(new Date(date))}</span>
    }},
  ]

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      <Frame variant="ghost" className="w-fit">
        <FramePanel className="gap-2 px-3! py-2! border-0!">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/inventory" className="flex items-center gap-1.5">
                  <HouseIcon className="size-4" aria-hidden="true" />
                  Inventory
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">{product.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </FramePanel>
      </Frame>
      <div className="grid grid-cols-12 gap-4">
        {/* Page Header — bento card */}
        <div className="col-span-12 border border-border/60 rounded-lg bg-card p-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex gap-3 min-w-0 flex-1">
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-14 self-stretch rounded-lg object-cover border border-border/60 shrink-0"
                />
              )}
              <div className="flex flex-col gap-2 w-auto">
                <h1 className="text-2xl font-bold">{product.name}</h1>
                <div className="inline-flex flex-wrap items-center gap-2">
                  <SemanticBadge semantic={product.status} category="status" className="gap-1 text-[11px]"><BadgeDot />{product.status}</SemanticBadge>
                  <SemanticBadge semantic={product.sku} category="id" className="gap-1 font-mono text-[11px]"><Hash className="w-3 h-3" />{product.sku}</SemanticBadge>
                  {product.category && (
                    <SemanticBadge semantic={product.category.name} category="category" className="gap-1 text-[11px]"><Tags className="w-3 h-3" />{product.category.name}</SemanticBadge>
                  )}
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
            {product.updatedAt && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>Updated {formatDate(new Date(product.updatedAt))}</span>
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
                  <FieldDisplay label="Current Stock" value={`${formatNumber(product.stock)} units`} mono />
                  <FieldDisplay label="Min Stock Level" value={formatNumber(product.minStock)} mono />
                  <FieldDisplay label="Max Stock Level" value={product.maxStock ? formatNumber(product.maxStock) : "Not set"} mono />
                  <FieldDisplay label="Location" value={product.location || "—"} />
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
                  <FieldDisplay label="Unit Price" value={formatCurrency(product.unitPrice)} mono />
                  <FieldDisplay label="Cost Price" value={formatCurrency(product.costPrice)} mono />
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
                <Boxes className="w-4 h-4 text-primary" />
                Stock Overview
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className={`text-2xl font-semibold font-mono ${isLowStock ? "text-destructive" : ""}`}>{formatNumber(product.stock)}</span>
                <span className="text-xs text-muted-foreground">units in stock</span>
              </div>
              <Progress
                className="h-1.5 mb-2"
                indicatorClassName={isLowStock ? "bg-destructive" : "bg-success"}
                value={Math.min((product.stock / (product.maxStock || product.stock * 2)) * 100, 100)}
              />
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
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5"><Tags className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Category</span><span className="text-sm font-medium ml-auto">{product.category?.name || "—"}</span></div>
                  <div className="flex items-center gap-2.5"><Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Supplier</span><span className="text-sm font-medium ml-auto">{product.supplier?.name || "—"}</span></div>
                  <div className="flex items-center gap-2.5"><Warehouse className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Warehouse</span><span className="text-sm font-medium ml-auto">{product.warehouse?.name || "—"}</span></div>
                  <div className="flex items-center gap-2.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Location</span><span className="text-sm font-medium ml-auto">{product.location || "—"}</span></div>
                </div>
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
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                  <FieldDisplay label="Length" value={product.length ? `${product.length} cm` : "—"} />
                  <FieldDisplay label="Width" value={product.width ? `${product.width} cm` : "—"} />
                  <FieldDisplay label="Height" value={product.height ? `${product.height} cm` : "—"} />
                  <FieldDisplay label="Weight" value={product.weight ? `${product.weight} kg` : "—"} />
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
                <FieldDisplay label="Created" value={formatDate(new Date(product.createdAt))} />
                <FieldDisplay label="Updated" value={product.updatedAt ? formatDate(new Date(product.updatedAt)) : "—"} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unified Tab Module */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden pt-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full overflow-x-auto px-4">
            <TabsTrigger value="bom" className="gap-1.5"><Layers className="w-4 h-4" /> BOM</TabsTrigger>
            <TabsTrigger value="orders" className="gap-1.5"><ShoppingCart className="w-4 h-4" /> Orders</TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1.5"><FileText className="w-4 h-4" /> Invoices</TabsTrigger>
            <TabsTrigger value="movements" className="gap-1.5"><Boxes className="w-4 h-4" /> Movements</TabsTrigger>
            <TabsTrigger value="lots" className="gap-1.5"><Hash className="w-4 h-4" /> Lots</TabsTrigger>
            <TabsTrigger value="pricing" className="gap-1.5"><DollarSign className="w-4 h-4" /> Supplier Pricing</TabsTrigger>
            <TabsTrigger value="gallery" className="gap-1.5"><ImageIcon className="w-4 h-4" /> Gallery</TabsTrigger>
          </TabsList>

          <TabsContent value="bom" className="pt-8 px-3 pb-3">
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
                      <EmptyState
                        icons={[<Layers key="f1" className="w-6 h-6" />, <Package key="f2" className="w-6 h-6" />, <Boxes key="f3" className="w-6 h-6" />]}
                        title="No BOM linked"
                        description="This product is not yet linked to a bill of materials as a finished good"
                        actions={[{ label: "Link BOM", onClick: () => router.push(`/bom/new?finishedGoodId=${id}`) }]}
                        size="sm"
                      />
                    ) : (
                      <div data-slot="frame">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {bomColumns.map((col) => (
                                <TableHead key={col.key}>{col.label}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {product.bomAsFinished.map((item: any) => (
                              <TableRow key={item.id}>
                                {bomColumns.map((col) => (
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
                      <EmptyState
                        icons={[<Package key="m1" className="w-6 h-6" />, <Layers key="m2" className="w-6 h-6" />, <Boxes key="m3" className="w-6 h-6" />]}
                        title="Not used as a component"
                        description="This product is not referenced as a material in any BOM"
                        size="sm"
                      />
                    ) : (
                      <div data-slot="frame">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {bomColumns.map((col) => (
                                <TableHead key={col.key}>{col.label}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {product.bomAsMaterial.map((item: any) => (
                              <TableRow key={item.id}>
                                {bomColumns.map((col) => (
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
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              Order History ({product.orderItems?.length || 0})
            </div>
            <div className="flex items-center mb-3">
              <input className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Search orders..." value={searchOrders} onChange={(e) => setSearchOrders(e.target.value)} />
            </div>
            {(() => {
              const filtered = (product.orderItems || []).filter((item: any) => !searchOrders || JSON.stringify(item).toLowerCase().includes(searchOrders.toLowerCase()))
              return filtered.length === 0 ? (
              <EmptyState
                icons={[<ShoppingCart key="oi1" className="w-6 h-6" />, <Package key="oi2" className="w-6 h-6" />]}
                title="No orders"
                description={searchOrders ? "No orders match your search" : "This product has not been ordered yet"}
                size="sm"
              />
            ) : (
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {orderItemColumns.map((col) => (
                        <TableHead key={col.key}>{col.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item: any) => (
                      <TableRow key={item.id}>
                        {orderItemColumns.map((col) => (
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
              Invoices ({product.invoiceItems?.length || 0})
            </div>
            <div className="flex items-center mb-3">
              <input className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Search invoices..." value={searchInvoices} onChange={(e) => setSearchInvoices(e.target.value)} />
            </div>
            {(() => {
              const filtered = (product.invoiceItems || []).filter((item: any) => !searchInvoices || JSON.stringify(item).toLowerCase().includes(searchInvoices.toLowerCase()))
              return filtered.length === 0 ? (
              <EmptyState
                icons={[<FileText key="ii1" className="w-6 h-6" />, <Package key="ii2" className="w-6 h-6" />]}
                title="No invoices"
                description={searchInvoices ? "No invoices match your search" : "This product has no invoice history"}
                size="sm"
              />
            ) : (
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {invoiceItemColumns.map((col) => (
                        <TableHead key={col.key}>{col.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item: any) => (
                      <TableRow key={item.id}>
                        {invoiceItemColumns.map((col) => (
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

          <TabsContent value="movements" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Boxes className="w-4 h-4 text-primary" />
              Stock Movements
            </div>
            <div className="flex items-center mb-3">
              <input className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Search movements..." value={searchMovements} onChange={(e) => setSearchMovements(e.target.value)} />
            </div>
            {(() => {
              const filtered = (product.movements || []).filter((item: any) => !searchMovements || JSON.stringify(item).toLowerCase().includes(searchMovements.toLowerCase()))
              return filtered.length === 0 ? (
              <EmptyState
                icons={[<Boxes key="sm1" className="w-6 h-6" />, <Package key="sm2" className="w-6 h-6" />]}
                title="No movements"
                description={searchMovements ? "No movements match your search" : "No stock movements recorded yet"}
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
                    {filtered.map((item: any) => (
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
            )
            })()}
          </TabsContent>

          <TabsContent value="lots" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Hash className="w-4 h-4 text-primary" />
              Lot / Serial Number Tracking
            </div>
            <div className="flex items-center mb-3">
              <input className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Search lots..." value={searchLots} onChange={(e) => setSearchLots(e.target.value)} />
            </div>
            {(() => {
              const filtered = (product.lots || []).filter((item: any) => !searchLots || JSON.stringify(item).toLowerCase().includes(searchLots.toLowerCase()))
              return filtered.length === 0 ? (
              <EmptyState
                icons={[<Hash key="lt1" className="w-6 h-6" />, <Package key="lt2" className="w-6 h-6" />]}
                title="No lots"
                description={searchLots ? "No lots match your search" : "This product has no lot or serial number tracking data"}
                size="sm"
              />
            ) : (
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {lotColumns.map((col) => (
                        <TableHead key={col.key}>{col.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item: any) => (
                      <TableRow key={item.id}>
                        {lotColumns.map((col) => (
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

          <TabsContent value="pricing" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Supplier Prices
            </div>
            <div className="flex items-center mb-3">
              <input className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Search prices..." value={searchPricing} onChange={(e) => setSearchPricing(e.target.value)} />
            </div>
            {(() => {
              const filtered = (product.supplierPrices || []).filter((item: any) => !searchPricing || JSON.stringify(item).toLowerCase().includes(searchPricing.toLowerCase()))
              return filtered.length === 0 ? (
              <EmptyState
                icons={[<DollarSign key="sp1" className="w-6 h-6" />, <Building2 key="sp2" className="w-6 h-6" />]}
                title="No supplier prices"
                description={searchPricing ? "No supplier prices match your search" : "No supplier price records found"}
                size="sm"
              />
            ) : (
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {supplierPriceColumns.map((col) => (
                        <TableHead key={col.key}>{col.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item: any) => (
                      <TableRow key={item.id}>
                        {supplierPriceColumns.map((col) => (
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
          <TabsContent value="gallery" className="pt-8 px-3 pb-3">
            <ImageGallery maxFiles={5} selectable />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-2xl flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update details for <span className="font-medium text-foreground">{product?.name}</span></DialogDescription>
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
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Type"><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. Finished Good" /></FieldGroup>
                  <FieldGroup label="Barcode"><Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="UPC / EAN" /></FieldGroup>
                </div>
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

            {/* Dimensions & Weight */}
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Ruler className="w-4 h-4 text-primary" />
                  Dimensions & Weight
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Length (cm)"><Input type="number" step="0.1" value={form.length} onChange={(e) => setForm({ ...form, length: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Width (cm)"><Input type="number" step="0.1" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} /></FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Height (cm)"><Input type="number" step="0.1" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Weight (kg)"><Input type="number" step="0.01" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} /></FieldGroup>
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border/60">
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes <ShortcutBadge shortcut="⌘↵" /></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogs */}
      <Dialog open={showAdjust} onOpenChange={setShowAdjust}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>Update the stock quantity for <span className="font-medium text-foreground">{product.name}</span></DialogDescription>
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
            <Button variant="outline" onClick={() => setShowAdjust(false)}><XCircle className="w-4 h-4" /> Cancel</Button>
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
            <Button variant="outline" onClick={() => setShowDelete(false)}><XCircle className="w-4 h-4" /> Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}><Trash2 className="w-4 h-4" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
