"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { SkeletonForm } from "@/components/ui/skeleton"

const TYPE_OPTIONS = [
 { value: "Course", label: "Course" },
 { value: "Workshop", label: "Workshop" },
 { value: "Video", label: "Video" },
]

const LEVEL_OPTIONS = [
 { value: "Beginner", label: "Beginner" },
 { value: "Intermediate", label: "Intermediate" },
 { value: "Advanced", label: "Advanced" },
]

export default function EditTrainingPage({ params }: { params: Promise<{ id: string }> }) {
 const router = useRouter()
 const { id } = use(params)
 const [saving, setSaving] = useState(false)
 const [fetching, setFetching] = useState(true)
 const [form, setForm] = useState({ title: "", type: "Course", level: "Beginner", description: "", duration: "", modules: "1" })

 useEffect(() => {
 fetch(`/api/knowledge/training/${id}`)
 .then(r => r.json())
 .then((d) => {
 if (!d || d.error) { toast.error("Program not found"); router.push("/knowledge/training"); return }
 setForm({ title: d.title || "", type: d.type || "Course", level: d.level || "Beginner", description: d.description || "", duration: d.duration || "", modules: String(d.modules || 1) })
 })
 .finally(() => setFetching(false))
 }, [id, router])

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!form.title) { toast.error("Title is required"); return }
 setSaving(true)
 try {
 const res = await fetch(`/api/knowledge/training/${id}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ ...form, modules: parseInt(form.modules) || 1 }),
 })
 if (!res.ok) throw new Error()
 toast.success("Training program updated")
 router.push(`/knowledge/training/${id}`)
 router.refresh()
 } catch { toast.error("Failed to update") }
 finally { setSaving(false) }
 }

 if (fetching) return <SkeletonForm fields={5} />

 return (
 <div className="animate-fade-in max-w-2xl">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
 Back
 </button>
 <div className="page-header"><h1>Edit Training Program</h1><p>{form.title}</p></div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader><CardTitle className="flex items-center gap-2">Program Info</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label>Title <span className="text-destructive">*</span></Label>
 <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Program title" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label>Type</Label>
 <Select options={TYPE_OPTIONS} value={form.type} onChange={(e: any) => setForm({ ...form, type: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label>Level</Label>
 <Select options={LEVEL_OPTIONS} value={form.level} onChange={(e: any) => setForm({ ...form, level: e.target.value })} />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label>Duration</Label>
 <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 2 hours" />
 </div>
 <div className="space-y-2">
 <Label>Modules</Label>
 <Input type="number" min="1" value={form.modules} onChange={(e) => setForm({ ...form, modules: e.target.value })} />
 </div>
 </div>
 <div className="space-y-2">
 <Label>Description</Label>
 <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
 </div>
 </CardContent>
 </Card>

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
 <Button type="submit" loading={saving}>Update Program</Button>
 </div>
 </form>
 </div>
 )
}
