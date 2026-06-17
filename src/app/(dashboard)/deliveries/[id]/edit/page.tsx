"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { use } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Building2, Calendar, Save, Warehouse, XCircle } from "lucide-react"
import { SkeletonForm } from "@/components/ui/skeleton"

const STATUS_OPTIONS = [
 { value: "draft", label: "Draft" },
 { value: "packing", label: "Packing" },
 { value: "shipped", label: "Shipped" },
 { value: "in_transit", label: "In Transit" },
 { value: "delivered", label: "Delivered" },
 { value: "failed", label: "Failed" },
 { value: "cancelled", label: "Cancelled" },
]

type SelectOption = { id: string; name: string }

export default function EditDeliveryPage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = use(params)
 const router = useRouter()
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const [distributors, setDistributors] = useState<SelectOption[]>([])
 const [warehouses, setWarehouses] = useState<SelectOption[]>([])

 const [form, setForm] = useState({
 number: "", status: "draft", carrier: "", trackingNumber: "",
 estimatedDate: "", notes: "", origin: "", destination: "",
 distributorId: "", warehouseId: "",
 })

 useEffect(() => {
 Promise.all([
 fetch("/api/deliveries/" + id).then(r => r.json()),
 fetch("/api/distributors").then(r => r.json()),
 fetch("/api/warehouses").then(r => r.json()),
 ]).then(([del, dists, whs]) => {
 setDistributors(Array.isArray(dists) ? dists : [])
 setWarehouses(Array.isArray(whs) ? whs : [])
 setForm({
 number: del.number || "",
 status: del.status || "draft",
 carrier: del.carrier || "",
 trackingNumber: del.trackingNumber || "",
 estimatedDate: del.estimatedDate ? del.estimatedDate.split("T")[0] : "",
 notes: del.notes || "",
 origin: del.origin || "",
 destination: del.destination || "",
 distributorId: del.distributorId || "",
 warehouseId: del.warehouseId || "",
 })
 }).finally(() => setLoading(false))
 }, [id])

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!form.distributorId) { toast.error("Distributor is required"); return }
 setSaving(true)
 try {
 const res = await fetch(`/api/deliveries/${id}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(form),
 })
 if (!res.ok) throw new Error()
 toast.success("Delivery updated")
 router.push(`/deliveries/${id}`)
 router.refresh()
 } catch {
 toast.error("Failed to update delivery")
 } finally {
 setSaving(false)
 }
 }

 if (loading) return <div className="animate-fade-in max-w-4xl"><SkeletonForm fields={6} /></div>

 return (
 <div className="animate-fade-in max-w-4xl pb-28">
 <button
 onClick={() => router.back()}
 className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
 >
 Back
 </button>

 <div className="page-header">
 <h1>Edit Delivery</h1>
 <p>Update delivery information</p>
 </div>

 <form onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader className="pb-3"><h3 className="text-sm font-semibold">Delivery Info</h3></CardHeader>
 <CardContent className="space-y-4 pt-0">
 <div className="grid grid-cols-3 gap-4">
 <div className="space-y-2">
 <Label htmlFor="number">Delivery Number</Label>
 <div className="relative">
 <Input id="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="pl-9 font-mono" />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="status">Status</Label>
 <Select id="status" options={STATUS_OPTIONS} value={form.status} onChange={(e: any) => setForm({ ...form, status: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="carrier">Carrier</Label>
 <div className="relative">
 <Input id="carrier" value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} className="pl-9" />
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
 <Input id="origin" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} className="pl-9" />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="destination">Destination</Label>
 <div className="relative">
 <Input id="destination" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className="pl-9" />
 </div>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="trackingNumber">Tracking Number</Label>
 <Input id="trackingNumber" value={form.trackingNumber} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} />
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
 <CardHeader className="pb-3"><h3 className="text-sm font-semibold">Notes</h3></CardHeader>
 <CardContent className="pt-0">
 <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
 </CardContent>
 </Card>

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
 <Button type="submit" loading={saving}><Save className="w-4 h-4" /> Save Changes</Button>
 </div>
 </form>
 </div>
 )
}
