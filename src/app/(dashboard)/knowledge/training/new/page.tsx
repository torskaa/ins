"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ArrowLeft, GraduationCap } from "lucide-react"
import { toast } from "sonner"

export default function NewTrainingProgramPage() {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [form, setForm] = useState({ title: "", type: "Course", level: "Beginner", description: "", duration: "", modules: "1" })

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!form.title) { toast.error("Title is required"); return }
 setLoading(true)
 try {
 const res = await fetch("/api/knowledge/training", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ ...form, modules: parseInt(form.modules) || 1 }),
 })
 if (!res.ok) throw new Error()
 toast.success("Training program created")
 router.push("/knowledge/training")
 router.refresh()
 } catch { toast.error("Failed to create") }
 finally { setLoading(false) }
 }

 return (
 <div className="animate-fade-in max-w-2xl">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
 Back
 </button>
 <div className="page-header"><h1>New Training Program</h1><p>Create a training course or workshop</p></div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader><CardTitle className="flex items-center gap-2">Program Details</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
 <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Inventory Management Basics" required />
 </div>
 <div className="grid grid-cols-3 gap-4">
 <div className="space-y-2">
 <Label htmlFor="type">Type</Label>
 <select id="type" className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
 <option value="Course">Course</option>
 <option value="Workshop">Workshop</option>
 <option value="Video">Video</option>
 </select>
 </div>
 <div className="space-y-2">
 <Label htmlFor="level">Level</Label>
 <select id="level" className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
 <option value="Beginner">Beginner</option>
 <option value="Intermediate">Intermediate</option>
 <option value="Advanced">Advanced</option>
 </select>
 </div>
 <div className="space-y-2">
 <Label htmlFor="modules">Modules</Label>
 <Input id="modules" type="number" min="1" value={form.modules} onChange={(e) => setForm({ ...form, modules: e.target.value })} />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="duration">Duration</Label>
 <Input id="duration" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 2 hours" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="description">Description</Label>
 <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
 </div>
 </CardContent>
 </Card>
 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
 <Button type="submit" loading={loading}>Create Program</Button>
 </div>
 </form>
 </div>
 )
}
