"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function NewCategoryPage() {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [form, setForm] = useState({ name: "", description: "", parentId: "" })
 const [categories, setCategories] = useState<any[]>([])

 useEffect(() => {
 fetch("/api/categories").then(r => r.json()).then(d => { if (Array.isArray(d)) setCategories(d) })
 }, [])

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!form.name) { toast.error("Name is required"); return }
 setLoading(true)
 try {
 const res = await fetch("/api/categories", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ name: form.name, description: form.description, parentId: form.parentId || null }),
 })
 if (!res.ok) throw new Error()
 toast.success("Category created")
 router.push("/categories")
 router.refresh()
 } catch { toast.error("Failed to create") }
 finally { setLoading(false) }
 }

 return (
 <div className="animate-fade-in max-w-2xl">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
 Back
 </button>
 <div className="page-header"><h1>New Category</h1></div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader><CardTitle className="flex items-center gap-2">Category Info</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
 <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
 </div>
 <div className="space-y-2">
 <Label htmlFor="parentId">Parent Category (optional)</Label>
 <Select id="parentId" options={categories.filter(c => c.id !== form.parentId).map(c => ({ value: c.id, label: c.name }))} placeholder="None (top level)" value={form.parentId} onChange={(e: any) => setForm({ ...form, parentId: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="description">Description</Label>
 <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
 </div>
 </CardContent>
 </Card>
 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
 <Button type="submit" loading={loading}>Create Category</Button>
 </div>
 </form>
 </div>
 )
}
