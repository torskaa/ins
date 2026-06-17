"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

export default function NewInvoicePage() {
 const router = useRouter()
 const [customers, setCustomers] = useState<any[]>([])
 const [products, setProducts] = useState<any[]>([])
 const [customerId, setCustomerId] = useState("")
 const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0])
 const [dueDate, setDueDate] = useState("")
 const [notes, setNotes] = useState("")
 const [saving, setSaving] = useState(false)
 const [items, setItems] = useState<{ productId: string; description: string; quantity: number; unitPrice: number; total: number }[]>([])

 useEffect(() => {
 Promise.all([
 fetch("/api/customers").then(r => r.json()),
 fetch("/api/products").then(r => r.json()),
 ]).then(([c, p]) => {
 if (Array.isArray(c)) setCustomers(c)
 if (Array.isArray(p)) setProducts(p)
 })
 }, [])

 function addItem() {
 setItems([...items, { productId: "", description: "", quantity: 1, unitPrice: 0, total: 0 }])
 }

 function updateItem(index: number, field: string, value: any) {
 const newItems = [...items]
 if (field === "productId") {
 const product = products.find(p => p.id === value)
 newItems[index] = {
 ...newItems[index],
 productId: value,
 description: product?.name || "",
 unitPrice: product?.unitPrice || 0,
 total: (product?.unitPrice || 0) * newItems[index].quantity,
 }
 } else {
 (newItems[index] as any)[field] = value
 if (field === "quantity" || field === "unitPrice") {
 newItems[index].total = newItems[index].quantity * newItems[index].unitPrice
 }
 }
 setItems(newItems)
 }

 async function handleSave() {
 if (!customerId) { toast.error("Please select a customer"); return }
 if (items.length === 0 || !items[0].productId) { toast.error("Please add at least one item"); return }
 setSaving(true)
 try {
 const res = await fetch("/api/invoices", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 customerId,
 issueDate,
 dueDate: dueDate || undefined,
 notes: notes || undefined,
 items: items.map(i => ({
 productId: i.productId,
 description: i.description,
 quantity: i.quantity,
 unitPrice: i.unitPrice,
 })),
 }),
 })
 if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to save") }
 toast.success("Invoice created")
 router.push("/invoices")
 } catch (e: any) { toast.error(e.message) }
 finally { setSaving(false) }
 }

 const subtotal = items.reduce((s, i) => s + i.total, 0)

 return (
 <div className="animate-fade-in max-w-4xl">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
 Back
 </button>
 <div className="page-header"><h1>New Invoice</h1><p>Create a customer invoice</p></div>

 <Card className="mb-6">
 <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label>Customer *</Label>
 <Select options={customers.map(c => ({ value: c.id, label: `${c.name}${c.company ? ` (${c.company})` : ""}` }))} placeholder="Select customer" value={customerId} onChange={(e: any) => setCustomerId(e.target.value)} />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="issueDate">Issue Date</Label>
 <Input id="issueDate" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="dueDate">Due Date</Label>
 <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
 </div>
 </div>
 </CardContent>
 </Card>

 <Card className="mb-6">
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle>Invoice Items</CardTitle>
 <Button type="button" variant="secondary" size="sm" onClick={addItem}>Add Item</Button>
 </div>
 </CardHeader>
 <CardContent>
 {items.map((item, i) => (
 <div key={i} className="flex items-end gap-3 mb-3 p-3 rounded-lg bg-surface/50">
 <div className="flex-[2] space-y-2">
 <Label className="text-xs">Product</Label>
 <Select options={products.map(p => ({ value: p.id, label: `${p.name} (${p.sku})` }))} placeholder="Select product" value={item.productId} onChange={(e: any) => updateItem(i, "productId", e.target.value)} />
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
 <p className="text-sm font-mono font-medium">{formatCurrency(item.total)}</p>
 </div>
 <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="p-2 text-muted-foreground hover:text-destructive">
 </button>
 </div>
 ))}
 {items.length === 0 && (
 <div className="text-center py-8">
 <p className="text-sm text-muted-foreground mb-3">Add line items to this invoice</p>
 <Button type="button" variant="secondary" size="sm" onClick={addItem}>Add Item</Button>
 </div>
 )}
 </CardContent>
 </Card>

 <div className="flex items-center justify-between border-t pt-4">
 <div className="text-lg font-semibold">Subtotal: <span className="font-mono">{formatCurrency(subtotal)}</span></div>
 <div className="flex gap-3">
 <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
 <Button onClick={handleSave} loading={saving}>Create Invoice</Button>
 </div>
 </div>
 </div>
 )
}
