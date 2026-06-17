"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { XCircle } from "lucide-react"

export default function NewWorkCenterPage() {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [form, setForm] = useState({ code: "", name: "", description: "", costPerHour: "0", capacity: "1", location: "", isActive: true })

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!form.name) { toast.error("Name is required"); return }
 setLoading(true)
 try {
 const res = await fetch("/api/work-centers", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ ...form, costPerHour: parseFloat(form.costPerHour) || 0, capacity: parseInt(form.capacity) || 1 }),
 })
 if (!res.ok) throw new Error()
 toast.success("Work center created")
 router.push("/production/work-centers")
 router.refresh()
 } catch { toast.error("Failed to create") }
 finally { setLoading(false) }
 }

 return (
 <div className="animate-fade-in max-w-2xl">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
 Back
 </button>
 <div className="page-header"><h1>New Work Center</h1><p>Add a production work center</p></div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader className="pb-3"><h3 className="text-sm font-semibold">Basic Info</h3></CardHeader>
 <CardContent className="space-y-4 pt-0">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="code">Code</Label>
 <div className="relative">
 <Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. WC-001" className="pl-9" />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
 <div className="relative">
 <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Assembly Line 1" className="pl-9" required />
 </div>
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="description">Description</Label>
 <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this work center do?" rows={2} />
 </div>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-3"><h3 className="text-sm font-semibold">Settings</h3></CardHeader>
 <CardContent className="space-y-4 pt-0">
 <div className="grid grid-cols-3 gap-4">
 <div className="space-y-2">
 <Label htmlFor="costPerHour">Cost per Hour (฿)</Label>
 <div className="relative">
 <Input id="costPerHour" type="number" min="0" value={form.costPerHour} onChange={(e) => setForm({ ...form, costPerHour: e.target.value })} className="pl-9" />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="capacity">Capacity (units)</Label>
 <Input id="capacity" type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="location">Location</Label>
 <div className="relative">
 <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Bldg/Floor" className="pl-9" />
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
 <Button type="submit" loading={loading}>Create Work Center</Button>
 </div>
 </form>
 </div>
 )
}
