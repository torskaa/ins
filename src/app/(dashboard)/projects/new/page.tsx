"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { FolderKanban } from "lucide-react"
import { toast } from "sonner"

export default function NewProjectPage() {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [form, setForm] = useState({ name: "", description: "", priority: "medium", startDate: "", dueDate: "", budget: "0" })

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!form.name) { toast.error("Name is required"); return }
 setLoading(true)
 try {
 const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
 if (!res.ok) throw new Error()
 toast.success("Project created"); router.push("/projects"); router.refresh()
 } catch { toast.error("Failed to create") } finally { setLoading(false) }
 }

 return (
 <div className="animate-fade-in max-w-2xl">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">Back</button>
 <div className="page-header"><h1>New Project</h1><p>Create a new project to organize tasks</p></div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card><CardHeader className="pb-3"><h3 className="text-sm font-semibold flex items-center gap-2"><FolderKanban className="w-4 h-4" /> Project Details</h3></CardHeader>
 <CardContent className="space-y-4 pt-0">
 <div className="space-y-2"><Label>Name <span className="text-destructive">*</span></Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Project name" /></div>
 <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Project description..." /></div>
 <div className="space-y-2"><Label>Priority</Label><Select options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "urgent", label: "Urgent" }]} value={form.priority} onChange={(e: any) => setForm({ ...form, priority: e.target.value })} /></div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
 <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
 </div>
 <div className="space-y-2"><Label>Budget (฿)</Label><Input type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></div>
 </CardContent>
 </Card>
 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
 <Button type="submit" loading={loading}>Create Project</Button>
 </div>
 </form>
 </div>
 )
}
