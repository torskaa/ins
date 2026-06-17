"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { ArrowLeft, Building2, Calendar, Hash, MapPin, Package, Plus, Trash2, Truck, Warehouse, XCircle } from "lucide-react"

const STATUS_OPTIONS = [
 { value: "draft", label: "Draft" },
 { value: "packing", label: "Packing" },
 { value: "shipped", label: "Shipped" },
 { value: "in_transit", label: "In Transit" },
]

type SelectOption = { id: string; name: string }
type LineItem = { productId: string; productName: string; sku: string; quantity: number; unitPrice: number }

export default function NewDeliveryPage() {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [distributors, setDistributors] = useState<SelectOption[]>([])
 const [warehouses, setWarehouses] = useState<SelectOption[]>([])
 const [products, setProducts] = useState<SelectOption[]>([])
 const [items, setItems] = useState<LineItem[]>([])

 const [form, setForm] = useState({
 number: "", status: "draft", carrier: "", trackingNumber: "",
 estimatedDate: "", notes: "", origin: "", destination: "",
 distributorId: "", warehouseId: "",
 })

 useEffect(() => {
 Promise.all([
 fetch("/api/distributors").then(r => r.json()),
 fetch("/api/warehouses").then(r => r.json()),
 fetch("/api/products").then(r => r.json()),
 ]).then(([dists, whs, prods]) => {
 setDistributors(Array.isArray(dists) ? dists : [])
 setWarehouses(Array.isArray(whs) ? whs : [])
 setProducts(Array.isArray(prods) ? prods : [])
 })
 }, [])

 function addItem() {
 setItems([...items, { productId: "", productName: "", sku: "", quantity: 1, unitPrice: 0 }])
 }

 function updateItem(index: number, field: keyof LineItem, value: any) {
 setItems(prev => prev.map((item, i) => {
 if (i !== index) return item
 const updated = { ...item, [field]: value }
 if (field === "productId") {
 const prod = products.find(p => p.id === value)
 if (prod) {
 updated.productName = prod.name
 // Also try to get price from product data
 const fullProd = (prod as any).unitPrice
 if (fullProd) updated.unitPrice = fullProd
 }
 }
 return updated
 }))
 }

 function removeItem(index: number) {
 setItems(prev => prev.filter((_, i) => i !== index))
 }

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!form.distributorId) { toast.error("Distributor is required"); return }
 if (items.length === 0) { toast.error("Add at least one item"); return }
 setLoading(true)
 try {
 const body = {
 ...form,
 totalItems: items.length,
 totalValue: items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
 items: items.map(i => ({
 productId: i.productId,
 quantity: i.quantity,
 unitPrice: i.unitPrice,
 total: i.quantity * i.unitPrice,
 })),
 }
 const res = await fetch("/api/deliveries", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(body),
 })
 if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed") }
 const created = await res.json()
 toast.success("Delivery created")
 router.push(`/deliveries/${created.id}`)
 router.refresh()
 } catch (err: any) {
 toast.error(err.message || "Failed to create delivery")
 } finally {
 setLoading(false)
 }
 }

 return (
 <div className="animate-fade-in max-w-4xl pb-28">
 <button
 onClick={() => router.back()}
 className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
 >
 Back
 </button>

 <div className="page-header">
 <h1>New Delivery</h1>
 <p>Create a delivery to a distributor</p>
 </div>

 <form onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader className="pb-3"><h3 className="text-sm font-semibold">Delivery Info</h3></CardHeader>
 <CardContent className="space-y-4 pt-0">
 <div className="grid grid-cols-3 gap-4">
 <div className="space-y-2">
 <Label htmlFor="number">Delivery Number</Label>
 <div className="relative">
 <Input id="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="e.g. DEL-2025-016" className="pl-9 font-mono" />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="status">Status</Label>
 <Select id="status" options={STATUS_OPTIONS} value={form.status} onChange={(e: any) => setForm({ ...form, status: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="carrier">Carrier</Label>
 <div className="relative">
 <Input id="carrier" value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} placeholder="e.g. DHL" className="pl-9" />
 </div>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="distributorId">Distributor <span className="text-destructive">*</span></Label>
 <div className="relative">
 <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
 <Select id="distributorId" options={distributors.map(d => ({ value: d.id, label: d.name }))} placeholder="Select distributor" value={form.distributorId} onChange={(e: any) => setForm({ ...form, distributorId: e.target.value })} />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="warehouseId">Warehouse</Label>
 <div className="relative">
 <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
 <Select id="warehouseId" options={warehouses.map(w => ({ value: w.id, label: w.name }))} placeholder="Select warehouse" value={form.warehouseId} onChange={(e: any) => setForm({ ...form, warehouseId: e.target.value })} />
 </div>
 </div>
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-3"><h3 className="text-sm font-semibold">Routing</h3></CardHeader>
 <CardContent className="space-y-4 pt-0">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="origin">Origin</Label>
 <div className="relative">
 <Input id="origin" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="Origin city/warehouse" className="pl-9" />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="destination">Destination</Label>
 <div className="relative">
 <Input id="destination" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Destination city/address" className="pl-9" />
 </div>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="trackingNumber">Tracking Number</Label>
 <Input id="trackingNumber" value={form.trackingNumber} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} placeholder="Carrier tracking ID" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="estimatedDate">Estimated Date</Label>
 <div className="relative">
 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input id="estimatedDate" type="date" value={form.estimatedDate} onChange={(e) => setForm({ ...form, estimatedDate: e.target.value })} className="pl-9" />
 </div>
 </div>
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-3">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-semibold">Items</h3>
 <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1.5">Add Item
</Button>
 </div>
 </CardHeader>
 <CardContent className="space-y-3 pt-0">
 {items.length === 0 && (
 <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
 <p className="text-sm">No items yet. Click "Add Item" to add products.</p>
 </div>
 )}
 {items.map((item, idx) => (
 <div key={idx} className="flex items-end gap-3 p-3 rounded-lg border border-border bg-surface/50">
 <div className="flex-1 space-y-1.5">
 <Label className="text-[11px]">Product</Label>
 <Select
 options={products.map(p => ({ value: p.id, label: `${p.name} (${(p as any).sku || ""})` }))}
 placeholder="Select product"
 value={item.productId}
 onChange={(e: any) => updateItem(idx, "productId", e.target.value)}
 />
 </div>
 <div className="w-20 space-y-1.5">
 <Label className="text-[11px]">Qty</Label>
 <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)} className="text-center" />
 </div>
 <div className="w-28 space-y-1.5">
 <Label className="text-[11px]">Unit Price</Label>
 <Input type="number" min="0" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)} className="text-right font-mono" />
 </div>
 <div className="w-24 space-y-1.5">
 <Label className="text-[11px]">Total</Label>
 <div className="h-9 flex items-center justify-end text-sm font-mono font-medium px-2 rounded border border-transparent bg-background">
 ฿{(item.quantity * item.unitPrice).toLocaleString()}
 </div>
 </div>
 <Button type="button" variant="ghost" size="icon" className="text-destructive mb-0.5" onClick={() => removeItem(idx)}>
 </Button>
 </div>
 ))}
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-3"><h3 className="text-sm font-semibold">Notes</h3></CardHeader>
 <CardContent className="pt-0">
 <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Delivery notes, special instructions..." rows={3} />
 </CardContent>
 </Card>

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
 <Button type="submit" loading={loading}>Create Delivery</Button>
 </div>
 </form>
 </div>
 )
}
