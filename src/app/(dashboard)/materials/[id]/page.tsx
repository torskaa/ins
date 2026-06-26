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
import { PlaceholderImage } from "@/components/ui/placeholder-image"
import { Progress } from "@/components/ui/progress"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import {
  AlertTriangle, ArrowLeftRight, Building2, Clock, DollarSign, FileText,
  Hash, ImageIcon, Layers, MapPin, Package, Pencil, ShoppingCart,
  Tags, Trash2, TrendingUp, Truck, Warehouse, XCircle, ClipboardList, FlaskConical,
} from "lucide-react"
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

export default function MaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [material, setMaterial] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

  const [searchMovements, setSearchMovements] = useState("")
  const [searchOrders, setSearchOrders] = useState("")
  const [searchPurchaseOrders, setSearchPurchaseOrders] = useState("")
  const [searchDeliveries, setSearchDeliveries] = useState("")
  const [searchInvoices, setSearchInvoices] = useState("")
  const [searchProduction, setSearchProduction] = useState("")
  const [searchBom, setSearchBom] = useState("")
  const [searchStockCounts, setSearchStockCounts] = useState("")
  const [searchForecast, setSearchForecast] = useState("")

  useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  useEffect(() => {
    if (!id) return
    fetch(`/api/materials/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json?.success) throw new Error(json?.error || "Failed to load")
        const data = json.data
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

  if (loading) return <SkeletonDetail cards={3} hasChart={false} />

  if (!material) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Material not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The material you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/materials")}>Back to Materials</Button>
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
    { key: "type", label: "Type", render: (item: any) => <SemanticBadge semantic={item.type || ""} category="type" className="">{item.type}</SemanticBadge> },
    { key: "quantity", label: "Quantity", render: (item: any) => {
      const isPositive = ["received", "returned"].includes(item.type)
      return <span className={`font-mono font-medium ${isPositive ? "text-success" : "text-destructive"}`}>{isPositive ? "+" : "-"}{formatNumber(Math.abs(item.quantity))}</span>
    }},
    { key: "description", label: "Description", render: (item: any) => <span className="text-muted-foreground">{item.description || "—"}</span> },
    { key: "reference", label: "Reference", render: (item: any) => <span className="font-mono text-xs text-muted-foreground">{item.reference || "—"}</span> },
    { key: "createdAt", label: "Date", render: (item: any) => <span className="text-muted-foreground text-sm">{formatDateTime(new Date(item.createdAt))}</span> },
  ]

  const orderColumns = [
    { key: "number", label: "Order", render: (item: any) => (
      <button onClick={() => router.push(`/orders/${item.orderId}`)} className="font-mono text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">{item.order?.number || item.orderId}</button>
    )},
    { key: "type", label: "Type", render: (item: any) => <span className="capitalize text-muted-foreground">{item.order?.type}</span> },
    { key: "status", label: "Status", render: (item: any) => <SemanticBadge semantic={item.order?.status || ""} category="status">{item.order?.status}</SemanticBadge> },
    { key: "quantity", label: "Qty", render: (item: any) => <span className="font-mono">{formatNumber(item.quantity)}</span> },
    { key: "unitPrice", label: "Unit Price", render: (item: any) => <span className="font-mono">{formatCurrency(item.unitPrice)}</span> },
    { key: "total", label: "Total", render: (item: any) => <span className="font-mono font-medium">{formatCurrency(item.total)}</span> },
  ]

  const deliveryColumns = [
    { key: "number", label: "Delivery", render: (item: any) => (
      <button onClick={() => router.push(`/deliveries/${item.deliveryId}`)} className="font-mono text-xs font-medium text-primary hover:underline">{item.delivery?.number || item.deliveryId}</button>
    )},
    { key: "status", label: "Status", render: (item: any) => <SemanticBadge semantic={item.delivery?.status || ""} category="status">{item.delivery?.status}</SemanticBadge> },
    { key: "quantity", label: "Qty", render: (item: any) => <span className="font-mono">{formatNumber(item.quantity)}</span> },
    { key: "deliveredQty", label: "Delivered", render: (item: any) => <span className="font-mono">{formatNumber(item.deliveredQty)}</span> },
    { key: "actualDate", label: "Date", render: (item: any) => <span className="text-muted-foreground text-sm">{item.delivery?.actualDate ? formatDate(new Date(item.delivery.actualDate)) : "—"}</span> },
  ]

  const invoiceColumns = [
    { key: "number", label: "Invoice", render: (item: any) => (
      <button onClick={() => router.push(`/invoices/${item.invoiceId}`)} className="font-mono text-xs font-medium text-primary hover:underline">{item.invoice?.number || item.invoiceId}</button>
    )},
    { key: "status", label: "Status", render: (item: any) => <SemanticBadge semantic={item.invoice?.status || ""} category="status">{item.invoice?.status}</SemanticBadge> },
    { key: "quantity", label: "Qty", render: (item: any) => <span className="font-mono">{formatNumber(item.quantity)}</span> },
    { key: "unitPrice", label: "Unit Price", render: (item: any) => <span className="font-mono">{formatCurrency(item.unitPrice)}</span> },
    { key: "total", label: "Total", render: (item: any) => <span className="font-mono font-medium">{formatCurrency(item.total)}</span> },
  ]

  const productionColumns = [
    { key: "number", label: "Production Order", render: (item: any) => (
      <button onClick={() => router.push(`/production/orders/${item.id}`)} className="font-mono text-xs font-medium text-primary hover:underline">{item.orderNumber || item.id}</button>
    )},
    { key: "status", label: "Status", render: (item: any) => <SemanticBadge semantic={item.status || ""} category="status">{item.status}</SemanticBadge> },
    { key: "quantity", label: "Qty", render: (item: any) => <span className="font-mono">{formatNumber(item.quantity)}</span> },
    { key: "plannedDate", label: "Planned Date", render: (item: any) => <span className="text-muted-foreground text-sm">{item.plannedDate ? formatDate(new Date(item.plannedDate)) : "—"}</span> },
  ]

  const forecastColumns = [
    { key: "period", label: "Period", render: (item: any) => <span className="text-muted-foreground">{item.period ? formatDate(new Date(item.period)) : "—"}</span> },
    { key: "quantity", label: "Forecast Qty", render: (item: any) => <span className="font-mono">{formatNumber(item.quantity)}</span> },
    { key: "probability", label: "Probability", render: (item: any) => <span className="font-mono">{item.probability ? `${(item.probability * 100).toFixed(0)}%` : "—"}</span> },
  ]

  const stockCountColumns = [
    { key: "number", label: "Count #", render: (item: any) => (
      <button onClick={() => router.push(`/stock-counts/${item.stockCountId}`)} className="font-mono text-xs font-medium text-primary hover:underline">{item.stockCount?.number || item.stockCountId}</button>
    )},
    { key: "status", label: "Status", render: (item: any) => <SemanticBadge semantic={item.stockCount?.status || ""} category="status">{item.stockCount?.status}</SemanticBadge> },
    { key: "expectedQty", label: "Expected", render: (item: any) => <span className="font-mono">{formatNumber(item.expectedQty)}</span> },
    { key: "actualQty", label: "Actual", render: (item: any) => <span className="font-mono">{formatNumber(item.actualQty)}</span> },
    { key: "difference", label: "Diff", render: (item: any) => {
      const diff = item.actualQty - item.expectedQty
      return <span className={`font-mono font-medium ${diff !== 0 ? "text-destructive" : "text-success"}`}>{diff > 0 ? "+" : ""}{diff}</span>
    }},
  ]

  const bomColumns = [
    { key: "finishedGood", label: "Used In (Finished Good)", render: (item: any) => (
      <button onClick={() => router.push(`/inventory/${item.finishedGoodId}`)} className="font-medium text-primary hover:underline">{item.finishedGood?.name}</button>
    )},
    { key: "quantity", label: "Qty per Unit", render: (item: any) => <span className="font-mono">{formatNumber(item.quantity)}</span> },
    { key: "scrapAllowance", label: "Scrap Allowance", render: (item: any) => <span className="font-mono">{item.scrapAllowance || 0}</span> },
    { key: "status", label: "BOM Status", render: (item: any) => <SemanticBadge semantic={item.status || ""} category="status">{item.status}</SemanticBadge> },
  ]

  const specEntries = material.materialSpecs ? (typeof material.materialSpecs === "string" ? JSON.parse(material.materialSpecs) : material.materialSpecs) : null

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button onClick={() => router.push("/materials")}>
                <Package className="size-4" />
                Materials
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{material.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-12 gap-4">
        {/* Page Header */}
        <div className="col-span-12 border border-border/60 rounded-lg bg-card p-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex gap-3 min-w-0 flex-1">
              {material.image ? (
                <img src={material.image} alt={material.name} className="w-14 self-stretch rounded-lg object-cover border border-border/60 shrink-0" />
              ) : (
                <PlaceholderImage name={material.name} className="w-14 self-stretch min-h-14" />
              )}
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{material.name}</h1>
                  {material.materialType && (
                    <SemanticBadge semantic={material.materialType} category="type" className="gap-1 text-[11px]"><FlaskConical className="w-3 h-3" />{material.materialType}</SemanticBadge>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <SemanticBadge semantic={material.status} category="status" className="gap-1 text-[11px]"><BadgeDot />{material.status}</SemanticBadge>
                  <SemanticBadge semantic={material.sku} category="id" className="gap-1 font-mono text-[11px]"><Hash className="w-3 h-3" />{material.sku}</SemanticBadge>
                  {isLowStock && <Badge variant="destructive" className="gap-1 text-[11px]"><AlertTriangle className="w-3 h-3" /> Low Stock</Badge>}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setShowAdjust(true)} className="h-9 gap-1.5">Adjust Stock <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘C</kbd></Button>
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

        {/* Left Column */}
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
                <FieldDisplay label="UoM" value={material.uom || "—"} />
                <FieldDisplay label="Material Type" value={material.materialType || "—"} />
                {material.description && (
                  <div className="col-span-2">
                    <p className="text-[11px] text-muted-foreground font-medium mb-0.5">Description</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{material.description}</p>
                  </div>
                )}
              </div>
              {specEntries && typeof specEntries === "object" && Object.keys(specEntries).length > 0 && (
                <div className="border-t border-border/60 pt-3 mt-1">
                  <p className="text-[11px] text-muted-foreground font-medium mb-2">Technical Specifications</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {Object.entries(specEntries).map(([key, val]) => (
                      <FieldDisplay key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())} value={String(val || "—")} />
                    ))}
                  </div>
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
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Current Stock" value={`${formatNumber(material.stock)} ${material.uom || "units"}`} mono />
                <FieldDisplay label="Min Stock Level" value={formatNumber(material.minStock)} mono />
                <FieldDisplay label="Max Stock Level" value={material.maxStock ? formatNumber(material.maxStock) : "Not set"} mono />
                <FieldDisplay label="Safety Stock" value={formatNumber(material.safetyStock || 0)} mono />
                <FieldDisplay label="Reorder Point" value={formatNumber((material.minStock || 0) + (material.safetyStock || 0))} mono />
                <FieldDisplay label="Lead Time" value={material.leadTime ? `${material.leadTime} days` : "—"} />
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

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
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
                <span className="text-xs text-muted-foreground">{material.uom || "units"} in stock</span>
              </div>
              <Progress className="h-1.5 mb-2" indicatorClassName={isLowStock ? "bg-destructive" : "bg-success"} value={Math.min((material.stock / (material.maxStock || material.stock * 2)) * 100, 100)} />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Min: {formatNumber(material.minStock)}</span>
                <span>Max: {material.maxStock ? formatNumber(material.maxStock) : "∞"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="w-4 h-4 text-primary" />
                Organization
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="flex items-center gap-2.5"><Tags className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Category</span><span className="text-sm font-medium ml-auto">{material.category?.name || "—"}</span></div>
              <div className="flex items-center gap-2.5"><Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Supplier</span><span className="text-sm font-medium ml-auto">{material.supplier?.name || "—"}</span></div>
              <div className="flex items-center gap-2.5"><Warehouse className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Warehouse</span><span className="text-sm font-medium ml-auto">{material.warehouse?.name || "—"}</span></div>
              <div className="flex items-center gap-2.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Location</span><span className="text-sm font-medium ml-auto">{material.location || "—"}</span></div>
            </CardContent>
          </Card>

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

      {/* Cross-Module Tabs */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden pt-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full overflow-x-auto px-4">
            <TabsTrigger value="movements" className="gap-1.5"><ArrowLeftRight className="w-4 h-4" /> Movements</TabsTrigger>
            <TabsTrigger value="orders" className="gap-1.5"><ShoppingCart className="w-4 h-4" /> Orders</TabsTrigger>
            <TabsTrigger value="purchase-orders" className="gap-1.5"><ShoppingCart className="w-4 h-4" /> Purchase Orders</TabsTrigger>
            <TabsTrigger value="deliveries" className="gap-1.5"><Truck className="w-4 h-4" /> Deliveries</TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1.5"><FileText className="w-4 h-4" /> Invoices</TabsTrigger>
            <TabsTrigger value="production" className="gap-1.5"><Layers className="w-4 h-4" /> Production</TabsTrigger>
            <TabsTrigger value="bom" className="gap-1.5"><ClipboardList className="w-4 h-4" /> BOM</TabsTrigger>
            <TabsTrigger value="stock-counts" className="gap-1.5"><ClipboardList className="w-4 h-4" /> Stock Counts</TabsTrigger>
            <TabsTrigger value="forecast" className="gap-1.5"><TrendingUp className="w-4 h-4" /> Forecast</TabsTrigger>
            <TabsTrigger value="gallery" className="gap-1.5"><ImageIcon className="w-4 h-4" /> Gallery</TabsTrigger>
          </TabsList>

          {/* Movements */}
          <TabsContent value="movements" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <ArrowLeftRight className="w-4 h-4 text-primary" />
              Stock Movements
            </div>
            <div className="flex items-center mb-3">
              <input className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Search movements..." value={searchMovements} onChange={(e) => setSearchMovements(e.target.value)} />
            </div>
            {(() => {
              const filtered = (material.movements || []).filter((item: any) => !searchMovements || JSON.stringify(item).toLowerCase().includes(searchMovements.toLowerCase()))
              return filtered.length === 0 ? (
              <EmptyState icons={[<ArrowLeftRight key="mm1" className="w-6 h-6" />, <Package key="mm2" className="w-6 h-6" />]} title="No movements" description={searchMovements ? "No movements match your search" : "No stock movements recorded yet"} size="sm" />
            ) : (
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>{movementColumns.map((col) => <TableHead key={col.key}>{col.label}</TableHead>)}</TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item: any) => (
                      <TableRow key={item.id}>
                        {movementColumns.map((col) => <TableCell key={col.key}>{col.render ? col.render(item) : String(item[col.key] ?? "")}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
            })()}
          </TabsContent>

          {/* Orders (Sales) */}
          <TabsContent value="orders" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              Sales Orders
            </div>
            <div className="flex items-center mb-3">
              <input className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Search orders..." value={searchOrders} onChange={(e) => setSearchOrders(e.target.value)} />
            </div>
            {(() => {
              const data = (material.orderItems || []).filter((i: any) => i.order?.type === "sales")
              const filtered = data.filter((item: any) => !searchOrders || JSON.stringify(item).toLowerCase().includes(searchOrders.toLowerCase()))
              return filtered.length === 0 ? (
              <EmptyState icons={[<ShoppingCart key="o1" className="w-6 h-6" />]} title="No sales orders" description={searchOrders ? "No sales orders match your search" : "This material has not been included in any sales orders"} size="sm" />
            ) : (
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>{orderColumns.map((col) => <TableHead key={col.key}>{col.label}</TableHead>)}</TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item: any) => (
                      <TableRow key={item.id}>
                        {orderColumns.map((col) => <TableCell key={col.key}>{col.render ? col.render(item) : String(item[col.key] ?? "")}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
            })()}
          </TabsContent>

          {/* Purchase Orders */}
          <TabsContent value="purchase-orders" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              Purchase Orders
            </div>
            <div className="flex items-center mb-3">
              <input className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Search purchase orders..." value={searchPurchaseOrders} onChange={(e) => setSearchPurchaseOrders(e.target.value)} />
            </div>
            {(() => {
              const data = (material.orderItems || []).filter((i: any) => i.order?.type === "purchase")
              const filtered = data.filter((item: any) => !searchPurchaseOrders || JSON.stringify(item).toLowerCase().includes(searchPurchaseOrders.toLowerCase()))
              return filtered.length === 0 ? (
              <EmptyState icons={[<ShoppingCart key="po1" className="w-6 h-6" />]} title="No purchase orders" description={searchPurchaseOrders ? "No purchase orders match your search" : "No purchase orders have been placed for this material"} size="sm" />
            ) : (
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>{orderColumns.map((col) => <TableHead key={col.key}>{col.label}</TableHead>)}</TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item: any) => (
                      <TableRow key={item.id}>
                        {orderColumns.map((col) => <TableCell key={col.key}>{col.render ? col.render(item) : String(item[col.key] ?? "")}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
            })()}
          </TabsContent>

          {/* Deliveries */}
          <TabsContent value="deliveries" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Truck className="w-4 h-4 text-primary" />
              Deliveries
            </div>
            <div className="flex items-center mb-3">
              <input className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Search deliveries..." value={searchDeliveries} onChange={(e) => setSearchDeliveries(e.target.value)} />
            </div>
            {(() => {
              const filtered = (material.deliveryItems || []).filter((item: any) => !searchDeliveries || JSON.stringify(item).toLowerCase().includes(searchDeliveries.toLowerCase()))
              return filtered.length === 0 ? (
              <EmptyState icons={[<Truck key="d1" className="w-6 h-6" />]} title="No deliveries" description={searchDeliveries ? "No deliveries match your search" : "No deliveries recorded for this material"} size="sm" />
            ) : (
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>{deliveryColumns.map((col) => <TableHead key={col.key}>{col.label}</TableHead>)}</TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item: any) => (
                      <TableRow key={item.id}>
                        {deliveryColumns.map((col) => <TableCell key={col.key}>{col.render ? col.render(item) : String(item[col.key] ?? "")}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
            })()}
          </TabsContent>

          {/* Invoices */}
          <TabsContent value="invoices" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <FileText className="w-4 h-4 text-primary" />
              Invoices
            </div>
            <div className="flex items-center mb-3">
              <input className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Search invoices..." value={searchInvoices} onChange={(e) => setSearchInvoices(e.target.value)} />
            </div>
            {(() => {
              const filtered = (material.invoiceItems || []).filter((item: any) => !searchInvoices || JSON.stringify(item).toLowerCase().includes(searchInvoices.toLowerCase()))
              return filtered.length === 0 ? (
              <EmptyState icons={[<FileText key="i1" className="w-6 h-6" />]} title="No invoices" description={searchInvoices ? "No invoices match your search" : "No invoices reference this material"} size="sm" />
            ) : (
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>{invoiceColumns.map((col) => <TableHead key={col.key}>{col.label}</TableHead>)}</TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item: any) => (
                      <TableRow key={item.id}>
                        {invoiceColumns.map((col) => <TableCell key={col.key}>{col.render ? col.render(item) : String(item[col.key] ?? "")}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
            })()}
          </TabsContent>

          {/* Production Orders */}
          <TabsContent value="production" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Layers className="w-4 h-4 text-primary" />
              Production Orders
            </div>
            <div className="flex items-center mb-3">
              <input className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Search production orders..." value={searchProduction} onChange={(e) => setSearchProduction(e.target.value)} />
            </div>
            {(() => {
              const filtered = (material.productionOrders || []).filter((item: any) => !searchProduction || JSON.stringify(item).toLowerCase().includes(searchProduction.toLowerCase()))
              return filtered.length === 0 ? (
              <EmptyState icons={[<Layers key="p1" className="w-6 h-6" />]} title="No production orders" description={searchProduction ? "No production orders match your search" : "No production orders use this material"} size="sm" />
            ) : (
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>{productionColumns.map((col) => <TableHead key={col.key}>{col.label}</TableHead>)}</TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item: any) => (
                      <TableRow key={item.id}>
                        {productionColumns.map((col) => <TableCell key={col.key}>{col.render ? col.render(item) : String(item[col.key] ?? "")}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
            })()}
          </TabsContent>

          {/* BOM */}
          <TabsContent value="bom" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              Bill of Materials
            </div>
            <div className="flex items-center mb-3">
              <input className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Search BOM..." value={searchBom} onChange={(e) => setSearchBom(e.target.value)} />
            </div>
            {(() => {
              const filtered = (material.bomComponents || []).filter((item: any) => !searchBom || JSON.stringify(item).toLowerCase().includes(searchBom.toLowerCase()))
              return filtered.length === 0 ? (
              <EmptyState icons={[<ClipboardList key="b1" className="w-6 h-6" />]} title="Not used in any BOM" description={searchBom ? "No BOM entries match your search" : "This material is not a component in any bill of materials"} size="sm" />
            ) : (
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>{bomColumns.map((col) => <TableHead key={col.key}>{col.label}</TableHead>)}</TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item: any) => (
                      <TableRow key={item.id}>
                        {bomColumns.map((col) => <TableCell key={col.key}>{col.render ? col.render(item) : String(item[col.key] ?? "")}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
            })()}
          </TabsContent>

          {/* Stock Counts */}
          <TabsContent value="stock-counts" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              Stock Counts
            </div>
            <div className="flex items-center mb-3">
              <input className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Search stock counts..." value={searchStockCounts} onChange={(e) => setSearchStockCounts(e.target.value)} />
            </div>
            {(() => {
              const filtered = (material.stockCountItems || []).filter((item: any) => !searchStockCounts || JSON.stringify(item).toLowerCase().includes(searchStockCounts.toLowerCase()))
              return filtered.length === 0 ? (
              <EmptyState icons={[<ClipboardList key="sc1" className="w-6 h-6" />]} title="No stock counts" description={searchStockCounts ? "No stock counts match your search" : "This material has not been included in any stock counts"} size="sm" />
            ) : (
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>{stockCountColumns.map((col) => <TableHead key={col.key}>{col.label}</TableHead>)}</TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item: any) => (
                      <TableRow key={item.id}>
                        {stockCountColumns.map((col) => <TableCell key={col.key}>{col.render ? col.render(item) : String(item[col.key] ?? "")}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
            })()}
          </TabsContent>

          {/* Forecast */}
          <TabsContent value="forecast" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Demand Forecast
            </div>
            <div className="flex items-center mb-3">
              <input className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Search forecast..." value={searchForecast} onChange={(e) => setSearchForecast(e.target.value)} />
            </div>
            {(() => {
              const filtered = (material.forecastEntries || []).filter((item: any) => !searchForecast || JSON.stringify(item).toLowerCase().includes(searchForecast.toLowerCase()))
              return filtered.length === 0 ? (
              <EmptyState icons={[<TrendingUp key="f1" className="w-6 h-6" />]} title="No forecast data" description={searchForecast ? "No forecast entries match your search" : "No demand forecast entries for this material"} size="sm" />
            ) : (
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>{forecastColumns.map((col) => <TableHead key={col.key}>{col.label}</TableHead>)}</TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item: any) => (
                      <TableRow key={item.id}>
                        {forecastColumns.map((col) => <TableCell key={col.key}>{col.render ? col.render(item) : String(item[col.key] ?? "")}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
            })()}
          </TabsContent>

          {/* Gallery */}
          <TabsContent value="gallery" className="pt-8 px-3 pb-3">
            <ImageGallery maxFiles={5} selectable />
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
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘↵</kbd></Button>
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
            <Button variant="outline" onClick={() => setShowAdjust(false)}>Cancel</Button>
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
            <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}><Trash2 className="w-4 h-4" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
