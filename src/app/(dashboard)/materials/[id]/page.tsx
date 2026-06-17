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
import { ArrowLeft, AlertTriangle, Pencil, Trash2 } from "lucide-react"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { SkeletonDetail } from "@/components/ui/skeleton"

export default function MaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const [material, setMaterial] = useState<any>(null)
 const [loading, setLoading] = useState(true)
 const [editing, setEditing] = useState(false)
 const [showDelete, setShowDelete] = useState(false)
 const [deleting, setDeleting] = useState(false)
 const [showAdjust, setShowAdjust] = useState(false)
 const [adjustQty, setAdjustQty] = useState("0")
 const [adjustReason, setAdjustReason] = useState("")
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
 setCategories(cats)
 setSuppliers(sups)
 setWarehouses(whs)
 })
 }, [])

 if (loading) return <SkeletonDetail cards={3} hasChart={false} />

 if (!material) {
 return (
 <div className="animate-fade-in">
 <p>Material not found</p>
 <Button variant="secondary" onClick={() => router.push("/materials")}>Back to Materials</Button>
 </div>
 )
 }

 const isLowStock = material.stock <= material.minStock
 const profit = material.unitPrice - material.costPrice
 const profitMargin = material.unitPrice > 0 ? ((profit / material.unitPrice) * 100).toFixed(1) : "0"

 async function handleSave() {
 try {
 const res = await fetch(`/api/materials/${id}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(form),
 })
 if (!res.ok) throw new Error("Failed")
 const updated = await res.json()
 setMaterial(updated)
 setEditing(false)
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
 } catch {
 toast.error("Failed to adjust stock")
 }
 }

 return (
 <div className="animate-fade-in">
 <button
 onClick={() => router.push("/materials")}
 className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
 >
 Back to Materials
 </button>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 space-y-6">
 <Card>
 <CardHeader>
 <div className="flex items-start justify-between">
 <div>
 <div className="flex items-center gap-2 mb-1">
 {editing ? (
 <Input
 value={form.name}
 onChange={(e) => setForm({ ...form, name: e.target.value })}
 className="text-xl font-semibold h-9 w-64"
 />
 ) : (
 <CardTitle className="text-xl">{material.name}</CardTitle>
 )}
 <Badge variant={material.status === "active" ? "success" : "secondary"}>
 {material.status}
 </Badge>
 {isLowStock && (
 <Badge variant="destructive" className="gap-1">
 <AlertTriangle className="w-3 h-3" />
 Low Stock
 </Badge>
 )}
 </div>
 {editing ? (
 <Input
 value={form.sku}
 onChange={(e) => setForm({ ...form, sku: e.target.value })}
 className="h-8 mt-1 max-w-xs font-mono text-xs"
 />
 ) : (
 <CardDescription>SKU: {material.sku}</CardDescription>
 )}
 </div>
 <div className="flex items-center gap-2">
 {editing ? (
 <>
 <Button size="sm" onClick={handleSave}>Save</Button>
 <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
 </>
 ) : (
 <>
 <Button variant="secondary" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
 Edit
 </Button>
 <Button variant="secondary" size="sm" onClick={() => setShowAdjust(true)}>
 Adjust Stock
 </Button>
 <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)} className="gap-1.5">
 </Button>
 </>
 )}
 </div>
 </div>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-4 gap-6">
 <div>
 <p className="text-xs text-muted-foreground mb-1">Current Stock</p>
 <p className={`text-2xl font-semibold font-mono ${isLowStock ? "text-destructive" : ""}`}>
 {material.stock}
 </p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1">Unit Price</p>
 <p className="text-2xl font-semibold font-mono">{formatCurrency(material.unitPrice)}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1">Cost Price</p>
 <p className="text-2xl font-semibold font-mono">{formatCurrency(material.costPrice)}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1">Margin</p>
 <p className="text-2xl font-semibold font-mono">{profitMargin}%</p>
 </div>
 </div>
 {editing ? (
 <div className="mt-4 pt-4 border-t border-border space-y-2">
 <Label htmlFor="desc-edit">Description</Label>
 <Textarea id="desc-edit" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
 </div>
 ) : material.description && (
 <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border">{material.description}</p>
 )}
 </CardContent>
 </Card>

 <Card>
 <CardHeader>
 <CardTitle>Stock Movements</CardTitle>
 </CardHeader>
 <CardContent>
 {material.movements?.length > 0 ? (
 <div className="space-y-2">
 {material.movements.map((mov: any) => (
 <div key={mov.id} className="flex items-center justify-between p-3 rounded-lg bg-surface/50">
 <div className="flex items-center gap-3">
 <Badge variant={
 mov.type === "received" ? "success" :
 mov.type === "sold" ? "default" :
 mov.type === "adjusted" ? "warning" : "secondary"
 } className="capitalize">
 {mov.type}
 </Badge>
 <span className="text-sm">{mov.description || "—"}</span>
 </div>
 <div className="text-right">
 <span className={`font-mono text-sm font-medium ${
 ["received", "returned"].includes(mov.type) ? "text-success" : "text-destructive"
 }`}>
 {["received", "returned"].includes(mov.type) ? "+" : "-"}{mov.quantity}
 </span>
 <p className="text-xs text-muted-foreground">{formatDateTime(new Date(mov.createdAt))}</p>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-sm text-muted-foreground text-center py-8">No movements recorded</p>
 )}
 </CardContent>
 </Card>

 {editing && (
 <Card>
 <CardHeader>
 <CardTitle>Pricing & Stock</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="edit-unitPrice">Unit Price</Label>
 <Input id="edit-unitPrice" type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="edit-costPrice">Cost Price</Label>
 <Input id="edit-costPrice" type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
 </div>
 </div>
 <div className="grid grid-cols-3 gap-4">
 <div className="space-y-2">
 <Label htmlFor="edit-stock">Stock</Label>
 <Input id="edit-stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="edit-minStock">Min Stock</Label>
 <Input id="edit-minStock" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="edit-maxStock">Max Stock</Label>
 <Input id="edit-maxStock" type="number" value={form.maxStock} onChange={(e) => setForm({ ...form, maxStock: e.target.value })} />
 </div>
 </div>
 </CardContent>
 </Card>
 )}
 </div>

 <div className="space-y-6">
 {editing ? (
 <Card>
 <CardHeader>
 <CardTitle>Relations</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="edit-categoryId">Category</Label>
 <Select
 id="edit-categoryId"
 options={categories.map(c => ({ value: c.id, label: c.name }))}
 placeholder="Select category"
 value={form.categoryId}
 onChange={(e: any) => setForm({ ...form, categoryId: e.target.value })}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="edit-supplierId">Supplier</Label>
 <Select
 id="edit-supplierId"
 options={suppliers.map(s => ({ value: s.id, label: s.name }))}
 placeholder="Select supplier"
 value={form.supplierId}
 onChange={(e: any) => setForm({ ...form, supplierId: e.target.value })}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="edit-warehouseId">Warehouse</Label>
 <Select
 id="edit-warehouseId"
 options={warehouses.map(w => ({ value: w.id, label: w.name }))}
 placeholder="Select warehouse"
 value={form.warehouseId}
 onChange={(e: any) => setForm({ ...form, warehouseId: e.target.value })}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="edit-location">Location</Label>
 <Input id="edit-location" placeholder="Aisle-Bin" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
 </div>
 </CardContent>
 </Card>
 ) : (
 <Card>
 <CardHeader>
 <CardTitle>Details</CardTitle>
 </CardHeader>
 <CardContent className="space-y-3">
 <div>
 <p className="text-xs text-muted-foreground">Category</p>
 <p className="text-sm font-medium">{material.category?.name || "—"}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground">Supplier</p>
 <p className="text-sm font-medium">{material.supplier?.name || "—"}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground">Warehouse</p>
 <p className="text-sm font-medium">{material.warehouse?.name || "—"}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground">Location</p>
 <p className="text-sm font-medium">{material.location || "—"}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground">Min Stock Level</p>
 <p className="text-sm font-medium font-mono">{material.minStock}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground">Max Stock Level</p>
 <p className="text-sm font-medium font-mono">{material.maxStock || "—"}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground">Created</p>
 <p className="text-sm font-medium">{formatDateTime(new Date(material.createdAt))}</p>
 </div>
 </CardContent>
 </Card>
 )}
 </div>
 </div>

 <Dialog open={showAdjust} onOpenChange={setShowAdjust}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Adjust Stock</DialogTitle>
 <DialogDescription>Update the stock quantity for {material.name}</DialogDescription>
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
 <Button variant="secondary" onClick={() => setShowAdjust(false)}>Cancel</Button>
 <Button onClick={handleAdjust}>Save</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 <Dialog open={showDelete} onOpenChange={setShowDelete}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Delete Material</DialogTitle>
 <DialogDescription>
 Are you sure you want to delete <strong>{material.name}</strong>? This action cannot be undone.
 </DialogDescription>
 </DialogHeader>
 <DialogFooter>
 <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
 <Button variant="destructive" onClick={handleDelete} loading={deleting}><Trash2 className="w-4 h-4" /> Delete</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 )
}
