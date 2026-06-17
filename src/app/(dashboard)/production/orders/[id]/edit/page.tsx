"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { toast } from "sonner"
import { SkeletonForm } from "@/components/ui/skeleton"
import { XCircle } from "lucide-react"

export default function EditProductionOrderPage() {
 const router = useRouter()
 const params = useParams()
 const [loading, setLoading] = useState(false)
 const [initialLoading, setInitialLoading] = useState(true)
 const [form, setForm] = useState({ number: "", productId: "", bomId: "", quantity: "1", startDate: "", dueDate: "", notes: "", warehouseId: "", status: "" })

 useEffect(() => {
 Promise.all([
 fetch(`/api/production-orders/${params.id}`).then(r => r.json()),
 ]).then(([order]) => {
 if (order.error) { toast.error("Order not found"); router.push("/production/orders"); return }
 setForm({
 number: order.number || "",
 productId: order.productId || "",
 bomId: order.bomId || "",
 quantity: String(order.quantity || 1),
 startDate: order.startDate ? order.startDate.split("T")[0] : "",
 dueDate: order.dueDate ? order.dueDate.split("T")[0] : "",
 notes: order.notes || "",
 warehouseId: order.warehouse?.id || "",
 status: order.status || "draft",
 })
 }).finally(() => setInitialLoading(false))
 }, [params.id, router])

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!form.number || !form.productId) { toast.error("Order number and product are required"); return }
 setLoading(true)
 try {
 const res = await fetch(`/api/production-orders/${params.id}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 ...form,
 quantity: parseInt(form.quantity) || 1,
 startDate: form.startDate || null,
 dueDate: form.dueDate || null,
 warehouseId: form.warehouseId || null,
 }),
 })
 if (!res.ok) throw new Error()
 toast.success("Production order updated")
 router.push(`/production/orders/${params.id}`)
 router.refresh()
 } catch { toast.error("Failed to update") }
 finally { setLoading(false) }
 }

 if (initialLoading) return <SkeletonForm fields={5} />

 return (
 <div className="animate-fade-in max-w-2xl">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
 Back
 </button>
 <div className="page-header"><h1>Edit Production Order</h1><p>Update order details</p></div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader className="pb-3"><h3 className="text-sm font-semibold">Order Info</h3></CardHeader>
 <CardContent className="space-y-4 pt-0">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="number">Order Number <span className="text-destructive">*</span></Label>
 <div className="relative">
 <Input id="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="pl-9" required />
 </div>
 </div>
 <div className="space-y-2">
 <Label>Product</Label>
 <Input value={form.productId} disabled className="bg-muted" />
 </div>
 </div>
 <div className="grid grid-cols-3 gap-4">
 <div className="space-y-2">
 <Label htmlFor="quantity">Quantity</Label>
 <Input id="quantity" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="startDate">Start Date</Label>
 <Input id="startDate" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="dueDate">Due Date</Label>
 <Input id="dueDate" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="notes">Notes</Label>
 <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
 </div>
 </CardContent>
 </Card>
 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
 <Button type="submit" loading={loading}>Update Order</Button>
 </div>
 </form>
 </div>
 )
}
