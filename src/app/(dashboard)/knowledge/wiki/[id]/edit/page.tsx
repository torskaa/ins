"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { toast } from "sonner"
import { SkeletonForm } from "@/components/ui/skeleton"
import { XCircle } from "lucide-react"

export default function EditWikiArticlePage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = use(params)
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [fetching, setFetching] = useState(true)
 const [form, setForm] = useState({ title: "", category: "Getting Started", excerpt: "", content: "" })

 useEffect(() => {
 fetch(`/api/knowledge/wiki/${id}`)
 .then(r => r.json())
 .then(d => {
 if (d.error) { toast.error("Article not found"); router.push("/knowledge/wiki"); return }
 setForm({ title: d.title || "", category: d.category || "Getting Started", excerpt: d.excerpt || "", content: d.content || "" })
 })
 .finally(() => setFetching(false))
 }, [id, router])

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!form.title) { toast.error("Title is required"); return }
 setLoading(true)
 try {
 const res = await fetch(`/api/knowledge/wiki/${id}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(form),
 })
 if (!res.ok) throw new Error()
 toast.success("Article updated")
 router.push(`/knowledge/wiki/${id}`)
 router.refresh()
 } catch { toast.error("Failed to update") }
 finally { setLoading(false) }
 }

 if (fetching) return <SkeletonForm fields={4} />

 return (
 <div className="animate-fade-in max-w-3xl">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
 Back
 </button>
 <div className="page-header"><h1>Edit Article</h1></div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader><CardTitle className="flex items-center gap-2">Article Details</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
 <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
 </div>
 <div className="space-y-2">
 <Label htmlFor="category">Category</Label>
 <Select id="category" options={["Getting Started", "Inventory", "Orders", "CRM", "Reports", "Settings"].map(c => ({ value: c, label: c }))} value={form.category} onChange={(e: any) => setForm({ ...form, category: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="excerpt">Excerpt</Label>
 <Input id="excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="content">Content</Label>
 <Textarea id="content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={12} className="font-mono text-sm" />
 </div>
 </CardContent>
 </Card>
 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
 <Button type="submit" loading={loading}>Update Article</Button>
 </div>
 </form>
 </div>
 )
}
