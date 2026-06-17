"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

export default function NewQuotationPage() {
 const router = useRouter()
 const [customers, setCustomers] = useState<any[]>([])
 const [products, setProducts] = useState<any[]>([])
 const [customerId, setCustomerId] = useState("")
 const [validUntil, setValidUntil] = useState("")
 const [notes, setNotes] = useState("")
 const [saving, setSaving] = useState(false)
 const [items, setItems] = useState<{ productId: string; productName: string; quantity: number; unitPrice: number }[]>([])

 useEffect(() => {
 fetch("/api/customers").then(r => r.json()).then((data) => {
 if (Array.isArray(data)) setCustomers(data)
 })
 fetch("/api/products").then(r => r.json()).then((data) => {
 if (Array.isArray(data)) setProducts(data)
 })
 }, [])

 function addItem() {
 setItems([...items, { productId: "", productName: "", quantity: 1, unitPrice: 0 }])
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

 async function handleSave() {
 if (!customerId) { toast.error("Please select a customer"); return }
 if (items.length === 0 || !items[0].productId) { toast.error("Please add at least one item"); return }
 setSaving(true)
 try {
 const res = await fetch("/api/quotations", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 customerId,
 validUntil: validUntil || undefined,
 notes: notes || undefined,
 items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
 }),
 })
 if (!res.ok) {
 const err = await res.json()
 throw new Error(err.error || "Failed to save")
 }
 toast.success("Quotation created")
 router.push("/quotations")
 } catch (e: any) {
 toast.error(e.message)
 } finally {
 setSaving(false)
 }
 }

 const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)

 return (
 <div className="animate-fade-in max-w-3xl">
 <div className="page-header"><h1>New Quotation</h1><p>Create a quotation from product catalog</p></div>

 <Card className="mb-6">
 <CardHeader><CardTitle>Quotation Details</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label>Customer *</Label>
 <Select
 options={customers.map(c => ({ value: c.id, label: c.name }))}
 placeholder="Select customer"
 value={customerId}
 onChange={(e: any) => setCustomerId(e.target.value)}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="validUntil">Valid Until</Label>
 <Input id="validUntil" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
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
 <CardTitle>Items (from catalog)</CardTitle>
 <Button type="button" variant="secondary" size="sm" onClick={addItem}>
 Add from Catalog
 </Button>
 </div>
 </CardHeader>
 <CardContent>
 {items.map((item, i) => (
 <div key={i} className="flex items-end gap-3 mb-3 p-3 rounded-lg bg-surface/50">
 <div className="flex-1 space-y-2">
 <Label className="text-xs">Product</Label>
 <Select
 options={products.map(p => ({ value: p.id, label: `${p.name} (${formatCurrency(p.unitPrice)})` }))}
 placeholder="Select product"
 value={item.productId}
 onChange={(e: any) => updateItem(i, "productId", e.target.value)}
 />
 </div>
 <div className="w-20 space-y-2">
 <Label className="text-xs">Qty</Label>
 <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 0)} />
 </div>
 <div className="w-28 space-y-2">
 <Label className="text-xs">Price</Label>
 <Input type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)} />
 </div>
 <div className="w-24 text-right pb-2">
 <p className="text-sm font-mono font-medium">{formatCurrency(item.quantity * item.unitPrice)}</p>
 </div>
 <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="p-2 text-muted-foreground hover:text-destructive">
 </button>
 </div>
 ))}
 {items.length === 0 && (
 <div className="text-center py-8">
 <p className="text-sm text-muted-foreground mb-3">Select products from your catalog to add</p>
 <Button type="button" variant="secondary" size="sm" onClick={addItem}>
 Browse Catalog
 </Button>
 </div>
 )}
 </CardContent>
 </Card>

 <div className="flex items-center justify-between border-t pt-4 mt-6">
 <div className="text-lg font-semibold">Total: <span className="font-mono">{formatCurrency(total)}</span></div>
 <div className="flex gap-3">
 <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
 <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Quotation"}</Button>
 </div>
 </div>
 </div>
 )
}
