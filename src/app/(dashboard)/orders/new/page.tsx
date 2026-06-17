"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"
import { XCircle } from "lucide-react"

function NewOrderForm() {
 const router = useRouter()
 const searchParams = useSearchParams()
 const type = searchParams.get("type") || "sales"
 const [loading, setLoading] = useState(false)
 const [customers, setCustomers] = useState<any[]>([])
 const [suppliers, setSuppliers] = useState<any[]>([])
 const [products, setProducts] = useState<any[]>([])
 const [items, setItems] = useState<{ productId: string; productName: string; quantity: number; unitPrice: number }[]>([])
 const [customerId, setCustomerId] = useState("")
 const [supplierId, setSupplierId] = useState("")
 const [notes, setNotes] = useState("")
 const [expectedDate, setExpectedDate] = useState("")

 useEffect(() => {
 fetch("/api/customers").then(r => r.json()).then((data) => { if (Array.isArray(data)) setCustomers(data) }).catch(() => {})
 fetch("/api/suppliers").then(r => r.json()).then((data) => { if (Array.isArray(data)) setSuppliers(data) }).catch(() => {})
 fetch("/api/products").then(r => r.json()).then((data) => { if (Array.isArray(data)) setProducts(data) }).catch(() => {})
 }, [])

 function addItem() {
 setItems([...items, { productId: "", productName: "", quantity: 1, unitPrice: 0 }])
 }

 function removeItem(index: number) {
 setItems(items.filter((_, i) => i !== index))
 }

 function updateItem(index: number, field: string, value: any) {
 const newItems = [...items]
 if (field === "productId") {
 const product = products.find(p => p.id === value)
 newItems[index] = { ...newItems[index], productId: value, productName: product?.name || "", unitPrice: product?.unitPrice || 0 }
 } else {
 (newItems[index] as any)[field] = value
 }
 setItems(newItems)
 }

 const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (items.length === 0) {
 toast.error("Please add at least one item")
 return
 }
 setLoading(true)
 try {
 const body: any = {
 type,
 items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
 notes,
 expectedDate: expectedDate || undefined,
 status: "draft",
 }
 if (type === "sales") body.customerId = customerId
 else body.supplierId = supplierId

 const res = await fetch("/api/orders", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(body),
 })
 if (!res.ok) throw new Error("Failed")
 toast.success("Order created")
 router.push("/orders")
 router.refresh()
 } catch {
 toast.error("Failed to create order")
 } finally {
 setLoading(false)
 }
 }

 return (
 <div className="animate-fade-in max-w-3xl">
 <div className="page-header">
 <h1>New {type === "sales" ? "Sales" : "Purchase"} Order</h1>
 <p>Create a new order in the system</p>
 </div>

 <form onSubmit={handleSubmit}>
 <Card className="mb-6">
 <CardHeader>
 <CardTitle>Order Details</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label>{type === "sales" ? "Customer" : "Supplier"} *</Label>
 {type === "sales" ? (
 <Select
 options={customers.map(c => ({ value: c.id, label: c.name }))}
 placeholder="Select customer"
 value={customerId}
 onChange={(e: any) => setCustomerId(e.target.value)}
 />
 ) : (
 <Select
 options={suppliers.map(s => ({ value: s.id, label: s.name }))}
 placeholder="Select supplier"
 value={supplierId}
 onChange={(e: any) => setSupplierId(e.target.value)}
 />
 )}
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="expectedDate">Expected Date</Label>
 <Input id="expectedDate" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="notes">Notes</Label>
 <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
 </div>
 </CardContent>
 </Card>

 <Card className="mb-6">
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle>Order Items</CardTitle>
 <Button type="button" variant="secondary" size="sm" onClick={addItem}>Add Item</Button>
 </div>
 </CardHeader>
 <CardContent>
 {items.length === 0 ? (
 <div className="text-center py-8">
 <p className="text-sm text-muted-foreground mb-3">No items added yet</p>
 <Button type="button" variant="secondary" size="sm" onClick={addItem}>
 Add your first item
 </Button>
 </div>
 ) : (
 <div className="space-y-3">
 {items.map((item, index) => (
 <div key={index} className="flex items-end gap-3 p-3 rounded-lg bg-surface/50">
 <div className="flex-1 space-y-2">
 <Label className="text-xs">Product</Label>
 <Select
 options={products.map(p => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
 placeholder="Select product"
 value={item.productId}
 onChange={(e: any) => updateItem(index, "productId", e.target.value)}
 />
 </div>
 <div className="w-20 space-y-2">
 <Label className="text-xs">Qty</Label>
 <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)} />
 </div>
 <div className="w-28 space-y-2">
 <Label className="text-xs">Unit Price</Label>
 <Input type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)} />
 </div>
 <div className="w-24 text-right pb-2">
 <p className="text-sm font-mono font-medium">{formatCurrency(item.quantity * item.unitPrice)}</p>
 </div>
 <button type="button" onClick={() => removeItem(index)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
 </button>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>

 <div className="flex items-center justify-between mb-6">
 <div className="text-lg font-semibold">
 Total: <span className="font-mono">{formatCurrency(total)}</span>
 </div>
 <div className="flex items-center gap-3">
 <Button type="button" variant="secondary" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
 <Button type="submit" loading={loading}>Create Order</Button>
 </div>
 </div>
 </form>
 </div>
 )
}

export default function NewOrderPage() {
 return (
 <Suspense fallback={<div className="animate-fade-in max-w-3xl"><div className="page-header"><h1>Loading...</h1></div></div>}>
 <NewOrderForm />
 </Suspense>
 )
}
