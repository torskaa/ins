"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { SkeletonForm } from "@/components/ui/skeleton"

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
 const router = useRouter()
 const { id } = use(params)
 const [saving, setSaving] = useState(false)
 const [fetching, setFetching] = useState(true)
 const [form, setForm] = useState({ name: "", description: "", priority: "medium", status: "draft", startDate: "", dueDate: "", budget: "0" })

 useEffect(() => {
 fetch(`/api/projects/${id}`).then(r => r.json()).then(d => {
 if (d.error) { toast.error("Not found"); router.push("/projects"); return }
 setForm({ name: d.name || "", description: d.description || "", priority: d.priority || "medium", status: d.status || "draft", startDate: d.startDate?.slice(0, 10) || "", dueDate: d.dueDate?.slice(0, 10) || "", budget: String(d.budget || 0) })
 }).finally(() => setFetching(false))
 }, [id, router])

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!form.name) { toast.error("Name is required"); return }
 setSaving(true)
 try {
 const res = await fetch(`/api/projects/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
 if (!res.ok) throw new Error()
 toast.success("Project updated"); router.push(`/projects/${id}`); router.refresh()
 } catch { toast.error("Failed to update") } finally { setSaving(false) }
 }

 if (fetching) return <SkeletonForm fields={5} />

 return (
 <div className="animate-fade-in max-w-2xl">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">Back</button>
 <div className="page-header"><h1>Edit Project</h1><p>{form.name}</p></div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card><CardHeader className="pb-3"><h3 className="text-sm font-semibold">Project Details</h3></CardHeader>
 <CardContent className="space-y-4 pt-0">
 <div className="space-y-2"><Label>Name <span className="text-destructive">*</span></Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
 <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2"><Label>Status</Label><Select options={[{ value: "draft", label: "Draft" }, { value: "active", label: "Active" }, { value: "paused", label: "Paused" }, { value: "completed", label: "Completed" }, { value: "cancelled", label: "Cancelled" }]} value={form.status} onChange={(e: any) => setForm({ ...form, status: e.target.value })} /></div>
 <div className="space-y-2"><Label>Priority</Label><Select options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "urgent", label: "Urgent" }]} value={form.priority} onChange={(e: any) => setForm({ ...form, priority: e.target.value })} /></div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
 <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
 </div>
 <div className="space-y-2"><Label>Budget (฿)</Label><Input type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></div>
 </CardContent>
 </Card>
 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
 <Button type="submit" loading={saving}>Update Project</Button>
 </div>
 </form>
 </div>
 )
}
