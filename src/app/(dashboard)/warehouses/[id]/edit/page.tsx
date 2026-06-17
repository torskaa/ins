"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Warehouse } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditWarehousePage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = use(params)
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [fetching, setFetching] = useState(true)
 const [form, setForm] = useState({ name: "", location: "", capacity: "", binLocation: "" })

 useEffect(() => {
 fetch(`/api/warehouses/${id}`).then(r => r.json()).then(d => {
 if (d.error) { toast.error("Warehouse not found"); router.push("/warehouses"); return }
 setForm({ name: d.name || "", location: d.location || "", capacity: d.capacity ? String(d.capacity) : "", binLocation: d.binLocation || "" })
 }).finally(() => setFetching(false))
 }, [id, router])

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!form.name) { toast.error("Name is required"); return }
 setLoading(true)
 try {
 const res = await fetch(`/api/warehouses/${id}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 name: form.name,
 location: form.location || null,
 capacity: form.capacity ? parseInt(form.capacity) : null,
 binLocation: form.binLocation || null,
 }),
 })
 if (!res.ok) throw new Error()
 toast.success("Warehouse updated")
 router.push(`/warehouses/${id}`)
 router.refresh()
 } catch { toast.error("Failed to update") }
 finally { setLoading(false) }
 }

 if (fetching) return <Skeleton className="h-48 w-full rounded-xl" />

 return (
 <div className="animate-fade-in max-w-2xl">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
 Back
 </button>
 <div className="page-header"><h1>Edit Warehouse</h1></div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader><CardTitle className="flex items-center gap-2"><Warehouse className="w-4 h-4" /> Warehouse Info</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
 <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
 </div>
 <div className="space-y-2">
 <Label htmlFor="capacity">Capacity</Label>
 <Input id="capacity" type="number" min="0" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="location">Location</Label>
 <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="binLocation">Bin Location</Label>
 <Input id="binLocation" value={form.binLocation} onChange={(e) => setForm({ ...form, binLocation: e.target.value })} />
 </div>
 </CardContent>
 </Card>
 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
 <Button type="submit" loading={loading}>Update Warehouse</Button>
 </div>
 </form>
 </div>
 )
}
