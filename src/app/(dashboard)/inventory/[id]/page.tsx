"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { AlertTriangle, ArrowLeft, Barcode, Boxes, Building2, CheckCircle2, Clock, DollarSign, ExternalLink, FileText, Hash, Layers, MapPin, Minus, Package, Pencil, Plus, RefreshCw, Ruler, ShoppingCart, Tags, Trash2, Warehouse, Weight, X, XCircle } from "lucide-react"
import { formatCurrency, formatNumber, formatDate, formatDateTime } from "@/lib/utils"
import { toast } from "sonner"
import { SkeletonDetail } from "@/components/ui/skeleton"
import {
 Dialog, DialogContent, DialogHeader, DialogTitle,
 DialogDescription, DialogFooter,
} from "@/components/ui/dialog"

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const [product, setProduct] = useState<any>(null)
 const [loading, setLoading] = useState(true)
 const [editing, setEditing] = useState(false)
 const [showDelete, setShowDelete] = useState(false)
 const [deleting, setDeleting] = useState(false)
 const [showAdjust, setShowAdjust] = useState(false)
 const [adjustQty, setAdjustQty] = useState("0")
 const [adjustReason, setAdjustReason] = useState("")
 const [tab, setTab] = useState("info")
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
 <Button variant="secondary" onClick={() => router.push("/inventory")}>
 Back to Inventory
 </Button>
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

 const bomColumns: Column<any>[] = [
 { key: "name", label: "Name", render: (item) => <span className="font-medium">{item.name}</span> },
 { key: "quantity", label: "Quantity", render: (item) => <span className="font-mono">{formatNumber(item.quantity)}</span> },
 { key: "unit", label: "Unit", render: (item) => <span className="text-muted-foreground">{item.unit || "—"}</span> },
 { key: "status", label: "Status", render: (item) => (
 <Badge variant={item.status === "active" ? "success" : "secondary"}>
 {item.status}
 </Badge>
 )},
 ]

 const orderItemColumns: Column<any>[] = [
 { key: "orderNumber", label: "Order", render: (item) => (
 <button
 onClick={() => router.push(`/orders/${item.orderId}`)}
 className="font-mono text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
 >
 {item.order?.orderNumber}
 </button>
 )},
 { key: "type", label: "Type", render: (item) => <span className="capitalize text-muted-foreground">{item.order?.type}</span> },
 { key: "status", label: "Status", render: (item) => (
 <Badge variant={statusVariant[item.order?.status] || "secondary"}>
 {item.order?.status}
 </Badge>
 )},
 { key: "quantity", label: "Qty", render: (item) => <span className="font-mono">{formatNumber(item.quantity)}</span> },
 { key: "unitPrice", label: "Unit Price", render: (item) => <span className="font-mono">{formatCurrency(item.unitPrice)}</span> },
 { key: "total", label: "Total", render: (item) => <span className="font-mono font-medium">{formatCurrency(item.total)}</span> },
 ]

 const invoiceItemColumns: Column<any>[] = [
 { key: "invoiceNumber", label: "Invoice", render: (item) => (
 <button
 onClick={() => router.push(`/invoices/${item.invoiceId}`)}
 className="font-mono text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
 >
 {item.invoice?.invoiceNumber}
 </button>
 )},
 { key: "status", label: "Status", render: (item) => (
 <Badge variant={statusVariant[item.invoice?.status] || "secondary"}>
 {item.invoice?.status}
 </Badge>
 )},
 { key: "quantity", label: "Qty", render: (item) => <span className="font-mono">{formatNumber(item.quantity)}</span> },
 { key: "unitPrice", label: "Unit Price", render: (item) => <span className="font-mono">{formatCurrency(item.unitPrice)}</span> },
 { key: "total", label: "Total", render: (item) => <span className="font-mono font-medium">{formatCurrency(item.total)}</span> },
 ]

 const movementColumns: Column<any>[] = [
 { key: "type", label: "Type", render: (item) => {
 const type = item.type
 const variant: Record<string, "success" | "default" | "warning" | "secondary"> = {
 received: "success",
 sold: "default",
 adjusted: "warning",
 returned: "success",
 transferred: "secondary",
 }
 return <Badge variant={variant[type] || "secondary"} className="capitalize">{type}</Badge>
 }},
 { key: "quantity", label: "Quantity", render: (item) => {
 const isPositive = ["received", "returned"].includes(item.type)
 return (
 <span className={`font-mono font-medium ${isPositive ? "text-success" : "text-destructive"}`}>
 {isPositive ? "+" : "-"}{formatNumber(Math.abs(item.quantity))}
 </span>
 )
 }},
 { key: "description", label: "Description", render: (item) => <span className="text-muted-foreground">{item.description || "—"}</span> },
 { key: "reference", label: "Reference", render: (item) => <span className="font-mono text-xs text-muted-foreground">{item.reference || "—"}</span> },
 { key: "createdAt", label: "Date", render: (item) => <span className="text-muted-foreground text-sm">{formatDateTime(new Date(item.createdAt))}</span> },
 ]

 const lotColumns: Column<any>[] = [
 { key: "lotNumber", label: "Lot Number", render: (item) => <span className="font-mono text-xs font-medium">{item.lotNumber}</span> },
 { key: "quantity", label: "Quantity", render: (item) => <span className="font-mono">{formatNumber(item.quantity)}</span> },
 { key: "expiryDate", label: "Expiry Date", render: (item) => {
 const date = item.expiryDate
 if (!date) return <span className="text-muted-foreground">—</span>
 const expired = new Date(date) < new Date()
 return (
 <span className={`${expired ? "text-destructive" : "text-muted-foreground"}`}>
 {formatDate(new Date(date))}
 {expired && <AlertTriangle className="w-3 h-3 inline ml-1" />}
 </span>
 )
 }},
 { key: "createdAt", label: "Created", render: (item) => <span className="text-muted-foreground text-sm">{formatDate(new Date(item.createdAt))}</span> },
 ]

 const supplierPriceColumns: Column<any>[] = [
 { key: "supplier", label: "Supplier", render: (item) => <span className="font-medium">{item.supplier?.name}</span> },
 { key: "price", label: "Price", render: (item) => <span className="font-mono font-medium">{formatCurrency(item.price)}</span> },
 { key: "currency", label: "Currency", render: (item) => <span className="font-mono text-xs">{item.currency}</span> },
 { key: "validFrom", label: "Valid From", render: (item) => {
 const date = item.validFrom
 return date ? <span className="text-muted-foreground text-sm">{formatDate(new Date(date))}</span> : <span className="text-muted-foreground">—</span>
 }},
 { key: "validTo", label: "Valid To", render: (item) => {
 const date = item.validTo
 if (!date) return <span className="text-muted-foreground">—</span>
 const expired = new Date(date) < new Date()
 return (
 <span className={`text-sm ${expired ? "text-destructive" : "text-muted-foreground"}`}>
 {formatDate(new Date(date))}
 </span>
 )
 }},
 ]

 return (
 <div className="animate-fade-in space-y-6">
 <button
 onClick={() => router.push("/inventory")}
 className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
 >
 Back to Inventory
 </button>

 <div className="flex items-start justify-between">
 <div className="flex items-start gap-4">
 <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1">
 </div>
 <div>
 <div className="flex items-center gap-2.5 flex-wrap">
 {editing ? (
 <Input
 value={form.name}
 onChange={(e) => setForm({ ...form, name: e.target.value })}
 className="text-xl font-semibold h-9 w-72"
 />
 ) : (
 <h1 className="text-xl font-semibold">{product.name}</h1>
 )}
 <Badge variant="outline" className="font-mono text-xs">
 {product.sku}
 </Badge>
 <Badge variant={statusVariant[product.status] || "secondary"}>
 {product.status}
 </Badge>
 {isLowStock && (
 <Badge variant="destructive" className="gap-1">
 <AlertTriangle className="w-3 h-3" />
 Low Stock
 </Badge>
 )}
 </div>
 <p className="text-sm text-muted-foreground mt-1">
 Created {formatDate(new Date(product.createdAt))}
 {product.updatedAt && ` · Updated ${formatDate(new Date(product.updatedAt))}`}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 {editing ? (
 <>
 <Button size="sm" onClick={handleSave} className="gap-1.5">
 Save
 </Button>
 <Button variant="secondary" size="sm" onClick={() => {
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
 }} className="gap-1.5">
 Cancel
 </Button>
 </>
 ) : (
 <>
 <Button variant="secondary" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
 Edit
 </Button>
 <Button variant="secondary" size="sm" onClick={() => setShowAdjust(true)} className="gap-1.5">
 Adjust Stock
 </Button>
 <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)} className="gap-1.5">
 </Button>
 </>
 )}
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <Card>
 <CardContent className="p-5">
 <div className="flex items-center gap-3 mb-3">
 <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
 <Boxes className="w-4 h-4 text-success" />
 </div>
 <div>
 <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Stock Level</p>
 </div>
 </div>
 <div className="flex items-baseline gap-2">
 <span className={`text-3xl font-semibold font-mono ${isLowStock ? "text-destructive" : ""}`}>
 {formatNumber(product.stock)}
 </span>
 <span className="text-xs text-muted-foreground">units</span>
 </div>
 <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
 <span>Min: <span className="font-mono font-medium text-foreground">{formatNumber(product.minStock)}</span></span>
 <span>Max: <span className="font-mono font-medium text-foreground">{product.maxStock ? formatNumber(product.maxStock) : "∞"}</span></span>
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardContent className="p-5">
 <div className="flex items-center gap-3 mb-3">
 <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
 </div>
 <div>
 <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pricing</p>
 </div>
 </div>
 <div className="space-y-1">
 <div className="flex items-baseline justify-between">
 <span className="text-xs text-muted-foreground">Unit Price</span>
 <span className="text-xl font-semibold font-mono">{formatCurrency(product.unitPrice)}</span>
 </div>
 <div className="flex items-baseline justify-between">
 <span className="text-xs text-muted-foreground">Cost Price</span>
 <span className="text-sm font-mono text-muted-foreground">{formatCurrency(product.costPrice)}</span>
 </div>
 <div className="flex items-baseline justify-between pt-1 border-t border-border">
 <span className="text-xs text-muted-foreground">Margin</span>
 <span className={`text-sm font-mono font-medium ${profitMargin >= 0 ? "text-success" : "text-destructive"}`}>
 {profitMargin >= 0 ? "+" : ""}{profitMargin.toFixed(1)}%
 </span>
 </div>
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardContent className="p-5">
 <div className="flex items-center gap-3 mb-3">
 <div className="w-9 h-9 rounded-lg bg-secondary/15 flex items-center justify-center">
 <Building2 className="w-4 h-4 text-secondary-dark" />
 </div>
 <div>
 <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Organization</p>
 </div>
 </div>
 <div className="space-y-2">
 <div className="flex items-center gap-2 text-sm">
 <Tags className="w-3.5 h-3.5 text-muted-foreground" />
 <span className="text-muted-foreground">Category:</span>
 <span className="font-medium">{product.category?.name || "—"}</span>
 </div>
 <div className="flex items-center gap-2 text-sm">
 <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
 <span className="text-muted-foreground">Supplier:</span>
 <span className="font-medium">{product.supplier?.name || "—"}</span>
 </div>
 <div className="flex items-center gap-2 text-sm">
 <Warehouse className="w-3.5 h-3.5 text-muted-foreground" />
 <span className="text-muted-foreground">Warehouse:</span>
 <span className="font-medium">{product.warehouse?.name || "—"}</span>
 </div>
 <div className="flex items-center gap-2 text-sm">
 <span className="text-muted-foreground">Location:</span>
 <span className="font-medium">{product.location || "—"}</span>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>

 <Tabs value={tab} onValueChange={setTab}>
 <TabsList className="w-full overflow-x-auto">
 <TabsTrigger value="info"><Package className="w-4 h-4" />Info</TabsTrigger>
 <TabsTrigger value="bom">
 <Layers className="w-3.5 h-3.5 mr-1.5" />
 BOM
 </TabsTrigger>
 <TabsTrigger value="orders">
 <ShoppingCart className="w-4 h-4" />
  Orders
 </TabsTrigger>
 <TabsTrigger value="invoices">
 <FileText className="w-4 h-4" />
  Invoices
 </TabsTrigger>
 <TabsTrigger value="inventory">
 <Boxes className="w-3.5 h-3.5 mr-1.5" />
 Inventory
 </TabsTrigger>
 <TabsTrigger value="pricing">
 <DollarSign className="w-4 h-4" />
  Pricing
 </TabsTrigger>
 </TabsList>

 <TabsContent value="info">
 <Card>
 <CardHeader>
 <CardTitle>General Information</CardTitle>
 <CardDescription>Basic product details and specifications</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {editing ? (
 <>
 <FieldGroup label="Name" required>
 <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
 </FieldGroup>
 <FieldGroup label="SKU" required>
 <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="font-mono" />
 </FieldGroup>
 <FieldGroup label="Type">
 <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. Finished Good, Raw Material" />
 </FieldGroup>
 <FieldGroup label="Barcode">
 <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="UPC / EAN" className="font-mono" />
 </FieldGroup>
 <FieldGroup label="Category">
 <Select
 options={categories.map(c => ({ value: c.id, label: c.name }))}
 placeholder="Select category"
 value={form.categoryId}
 onChange={(e: any) => setForm({ ...form, categoryId: e.target.value })}
 />
 </FieldGroup>
 <FieldGroup label="Supplier">
 <Select
 options={suppliers.map(s => ({ value: s.id, label: s.name }))}
 placeholder="Select supplier"
 value={form.supplierId}
 onChange={(e: any) => setForm({ ...form, supplierId: e.target.value })}
 />
 </FieldGroup>
 <FieldGroup label="Warehouse">
 <Select
 options={warehouses.map(w => ({ value: w.id, label: w.name }))}
 placeholder="Select warehouse"
 value={form.warehouseId}
 onChange={(e: any) => setForm({ ...form, warehouseId: e.target.value })}
 />
 </FieldGroup>
 <FieldGroup label="Location">
 <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Aisle-Bin" />
 </FieldGroup>
 <FieldGroup label="Status">
 <Input value={product.status} disabled className="text-muted-foreground" />
 </FieldGroup>
 </>
 ) : (
 <>
 <FieldDisplay label="Name" value={product.name} />
 <FieldDisplay label="SKU" value={product.sku} mono />
 <FieldDisplay label="Type" value={product.type || "—"} />
 <FieldDisplay label="Barcode" value={product.barcode || "—"} mono />
 <FieldDisplay label="Category" value={product.category?.name || "—"} />
 <FieldDisplay label="Supplier" value={product.supplier?.name || "—"} />
 <FieldDisplay label="Warehouse" value={product.warehouse?.name || "—"} />
 <FieldDisplay label="Location" value={product.location || "—"} />
 <FieldDisplay label="Status" value={product.status} badge />
 </>
 )}
 </div>
 </CardContent>
 </Card>

 <Card className="mt-4">
 <CardHeader>
 <CardTitle>Description</CardTitle>
 </CardHeader>
 <CardContent>
 {editing ? (
 <Textarea
 value={form.description}
 onChange={(e) => setForm({ ...form, description: e.target.value })}
 rows={4}
 placeholder="Product description..."
 />
 ) : (
 <p className="text-sm text-muted-foreground leading-relaxed">
 {product.description || <span className="italic">No description provided.</span>}
 </p>
 )}
 </CardContent>
 </Card>

 <Card className="mt-4">
 <CardHeader>
 <CardTitle>Dimensions & Weight</CardTitle>
 <CardDescription>Physical specifications for shipping and storage</CardDescription>
 </CardHeader>
 <CardContent>
 {editing ? (
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <FieldGroup label="Length (cm)">
 <Input type="number" step="0.1" value={form.length} onChange={(e) => setForm({ ...form, length: e.target.value })} />
 </FieldGroup>
 <FieldGroup label="Width (cm)">
 <Input type="number" step="0.1" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} />
 </FieldGroup>
 <FieldGroup label="Height (cm)">
 <Input type="number" step="0.1" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
 </FieldGroup>
 <FieldGroup label="Weight (kg)">
 <Input type="number" step="0.01" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
 </FieldGroup>
 </div>
 ) : (
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <FieldDisplay label="Length" value={product.length ? `${product.length} cm` : "—"} />
 <FieldDisplay label="Width" value={product.width ? `${product.width} cm` : "—"} />
 <FieldDisplay label="Height" value={product.height ? `${product.height} cm` : "—"} />
 <FieldDisplay label="Weight" value={product.weight ? `${product.weight} kg` : "—"} />
 </div>
 )}
 </CardContent>
 </Card>

 <Card className="mt-4">
 <CardHeader>
 <CardTitle>Stock Settings</CardTitle>
 <CardDescription>Inventory thresholds and reorder levels</CardDescription>
 </CardHeader>
 <CardContent>
 {editing ? (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <FieldGroup label="Current Stock">
 <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
 </FieldGroup>
 <FieldGroup label="Min Stock Level">
 <Input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
 </FieldGroup>
 <FieldGroup label="Max Stock Level">
 <Input type="number" value={form.maxStock} onChange={(e) => setForm({ ...form, maxStock: e.target.value })} />
 </FieldGroup>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <FieldDisplay label="Current Stock" value={formatNumber(product.stock)} />
 <FieldDisplay label="Min Stock Level" value={formatNumber(product.minStock)} />
 <FieldDisplay label="Max Stock Level" value={product.maxStock ? formatNumber(product.maxStock) : "Not set"} />
 </div>
 )}
 </CardContent>
 </Card>

 <Card className="mt-4">
 <CardHeader>
 <CardTitle>Pricing</CardTitle>
 <CardDescription>Sales and cost pricing information</CardDescription>
 </CardHeader>
 <CardContent>
 {editing ? (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <FieldGroup label="Unit Price">
 <Input type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
 </FieldGroup>
 <FieldGroup label="Cost Price">
 <Input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
 </FieldGroup>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <FieldDisplay label="Unit Price" value={formatCurrency(product.unitPrice)} />
 <FieldDisplay label="Cost Price" value={formatCurrency(product.costPrice)} />
 </div>
 )}
 </CardContent>
 </Card>
 </TabsContent>

 <TabsContent value="bom">
 <Card>
 <CardHeader>
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
 <Layers className="w-4 h-4 text-primary" />
 </div>
 <div>
 <CardTitle>Bill of Materials</CardTitle>
 <CardDescription>
 {product.bomAsFinished?.length
 ? `${product.bomAsFinished.length} BOM(s) where this is the finished good`
 : "No BOMs as finished good"}
 </CardDescription>
 </div>
 </div>
 </CardHeader>
 <CardContent>
 <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
 As Finished Good
 </h4>
 <DataTable
 columns={bomColumns}
 data={product.bomAsFinished || []}
 noBorder
 />
 </CardContent>
 </Card>

 <Card className="mt-4">
 <CardHeader>
 <CardTitle>Where Used</CardTitle>
 <CardDescription>
 {product.bomAsMaterial?.length
 ? `${product.bomAsMaterial.length} BOM(s) where this is a component`
 : "No BOMs as component"}
 </CardDescription>
 </CardHeader>
 <CardContent>
 <DataTable
 columns={bomColumns}
 data={product.bomAsMaterial || []}
 noBorder
 />
 </CardContent>
 </Card>
 </TabsContent>

 <TabsContent value="orders">
 <Card>
 <CardHeader>
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
 </div>
 <div>
 <CardTitle>Orders</CardTitle>
 <CardDescription>
 {product.orderItems?.length
 ? `${product.orderItems.length} order(s) containing this product`
 : "No orders contain this product"}
 </CardDescription>
 </div>
 </div>
 </CardHeader>
 <CardContent>
 <DataTable
 columns={orderItemColumns}
 data={product.orderItems || []}
 searchable
 searchPlaceholder="Search orders..."
 noBorder
 />
 </CardContent>
 </Card>
 </TabsContent>

 <TabsContent value="invoices">
 <Card>
 <CardHeader>
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
 </div>
 <div>
 <CardTitle>Invoices</CardTitle>
 <CardDescription>
 {product.invoiceItems?.length
 ? `${product.invoiceItems.length} invoice(s) containing this product`
 : "No invoices contain this product"}
 </CardDescription>
 </div>
 </div>
 </CardHeader>
 <CardContent>
 <DataTable
 columns={invoiceItemColumns}
 data={product.invoiceItems || []}
 searchable
 searchPlaceholder="Search invoices..."
 noBorder
 />
 </CardContent>
 </Card>
 </TabsContent>

 <TabsContent value="inventory">
 <Card>
 <CardHeader>
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
 </div>
 <div>
 <CardTitle>Stock Movements</CardTitle>
 <CardDescription>History of all stock changes for this product</CardDescription>
 </div>
 </div>
 </CardHeader>
 <CardContent>
 <DataTable
 columns={movementColumns}
 data={product.movements || []}
 searchable
 searchPlaceholder="Search movements..."
 noBorder
 />
 </CardContent>
 </Card>

 <Card className="mt-4">
 <CardHeader>
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-lg bg-secondary/15 flex items-center justify-center">
 </div>
 <div>
 <CardTitle>Lot / Serial Number Tracking</CardTitle>
 <CardDescription>Individual lot and serial number traceability</CardDescription>
 </div>
 </div>
 </CardHeader>
 <CardContent>
 <DataTable
 columns={lotColumns}
 data={product.lots || []}
 searchable
 searchPlaceholder="Search lots..."
 noBorder
 />
 </CardContent>
 </Card>
 </TabsContent>

 <TabsContent value="pricing">
 <Card>
 <CardHeader>
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
 </div>
 <div>
 <CardTitle>Supplier Prices</CardTitle>
 <CardDescription>Prices offered by different suppliers for this product</CardDescription>
 </div>
 </div>
 </CardHeader>
 <CardContent>
 <DataTable
 columns={supplierPriceColumns}
 data={product.supplierPrices || []}
 searchable
 searchPlaceholder="Search supplier prices..."
 />
 </CardContent>
 </Card>
 </TabsContent>
 </Tabs>

 <Dialog open={showAdjust} onOpenChange={setShowAdjust}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Adjust Stock</DialogTitle>
 <DialogDescription>
 Update the stock quantity for <span className="font-medium text-foreground">{product.name}</span>
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-4 py-2">
 <div className="space-y-2">
 <Label htmlFor="adjustQty">New Stock Quantity</Label>
 <Input
 id="adjustQty"
 type="number"
 value={adjustQty}
 onChange={(e) => setAdjustQty(e.target.value)}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="adjustReason">Reason</Label>
 <Input
 id="adjustReason"
 placeholder="e.g. Inventory count adjustment"
 value={adjustReason}
 onChange={(e) => setAdjustReason(e.target.value)}
 />
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
 <DialogDescription>
 Are you sure you want to delete <strong>{product.name}</strong>? This action cannot be undone.
 </DialogDescription>
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

function FieldGroup({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
 return (
 <div className="space-y-1.5">
 <Label className="text-xs text-muted-foreground font-medium">
 {label}
 {required && <span className="text-destructive ml-0.5">*</span>}
 </Label>
 {children}
 </div>
 )
}

function FieldDisplay({ label, value, mono, badge }: { label: string; value: string; mono?: boolean; badge?: boolean }) {
 return (
 <div className="space-y-1">
 <p className="text-xs text-muted-foreground font-medium">{label}</p>
 {badge ? (
 <Badge variant={value === "active" ? "success" : "secondary"}>{value}</Badge>
 ) : (
 <p className={`text-sm ${mono ? "font-mono" : "font-medium"}`}>{value}</p>
 )}
 </div>
 )
}
