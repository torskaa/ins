"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { XCircle } from "lucide-react"

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = use(params)
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [fetching, setFetching] = useState(true)
 const [form, setForm] = useState({ name: "", description: "" })

 useEffect(() => {
 fetch(`/api/categories/${id}`).then(r => r.json()).then(d => {
 if (d.error) { toast.error("Category not found"); router.push("/categories"); return }
 setForm({ name: d.name || "", description: d.description || "" })
 }).finally(() => setFetching(false))
 }, [id, router])

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!form.name) { toast.error("Name is required"); return }
 setLoading(true)
 try {
 const res = await fetch(`/api/categories/${id}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(form),
 })
 if (!res.ok) throw new Error()
 toast.success("Category updated")
 router.push(`/categories/${id}`)
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
 <div className="page-header"><h1>Edit Category</h1></div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader><CardTitle className="flex items-center gap-2">Category Info</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
 <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
 </div>
 <div className="space-y-2">
 <Label htmlFor="description">Description</Label>
 <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
 </div>
 </CardContent>
 </Card>
 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
 <Button type="submit" loading={loading}>Update Category</Button>
 </div>
 </form>
 </div>
 )
}
