"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { toast } from "sonner"
import { SkeletonForm } from "@/components/ui/skeleton"
import { BookOpen, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

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

  if (fetching) return <div className="animate-fade-in pb-28"><SkeletonForm fields={4} /></div>

  return (
    <div className="animate-fade-in pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        Back
      </button>
      <div className="page-header mb-5"><h1>Edit Article</h1></div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Article Details</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Field id="title" label="Title" required>
                  <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </Field>
                <Field id="category" label="Category">
                  <Select id="category" options={["Getting Started", "Inventory", "Orders", "CRM", "Reports", "Settings"].map(c => ({ value: c, label: c }))} value={form.category} onChange={(e: any) => setForm({ ...form, category: e.target.value })} />
                </Field>
                <Field id="excerpt" label="Excerpt">
                  <Input id="excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
                </Field>
                <Field id="content" label="Content">
                  <Textarea id="content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={12} className="font-mono text-sm" />
                </Field>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-4 space-y-4" />
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" loading={loading}>Update Article</Button>
        </div>
      </form>
    </div>
  )
}
