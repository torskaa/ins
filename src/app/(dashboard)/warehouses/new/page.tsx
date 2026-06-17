"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Warehouse, XCircle } from "lucide-react"
import { toast } from "sonner"

export default function NewWarehousePage() {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [form, setForm] = useState({ name: "", location: "", capacity: "" })

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!form.name) { toast.error("Name is required"); return }
 setLoading(true)
 try {
 const res = await fetch("/api/warehouses", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 name: form.name,
 location: form.location || null,
 capacity: form.capacity ? parseInt(form.capacity) : null,
 }),
 })
 if (!res.ok) throw new Error()
 toast.success("Warehouse created")
 router.push("/warehouses")
 router.refresh()
 } catch { toast.error("Failed to create") }
 finally { setLoading(false) }
 }

 return (
 <div className="animate-fade-in max-w-2xl">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
 Back
 </button>
 <div className="page-header"><h1>New Warehouse</h1></div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader><CardTitle className="flex items-center gap-2"><Warehouse className="w-4 h-4" /> Warehouse Info</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
 <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
 </div>
 <div className="space-y-2">
 <Label htmlFor="location">Location</Label>
 <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="capacity">Capacity</Label>
 <Input id="capacity" type="number" min="0" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
 </div>
 </CardContent>
 </Card>
 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
 <Button type="submit" loading={loading}>Create Warehouse</Button>
 </div>
 </form>
 </div>
 )
}
