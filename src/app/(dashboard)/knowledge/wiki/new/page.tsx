"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { toast } from "sonner"
import { BookOpen, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

export default function NewWikiArticlePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: "", category: "Getting Started", excerpt: "", content: "" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) { toast.error("Title is required"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/knowledge/wiki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success("Article created")
      router.push("/knowledge/wiki")
      router.refresh()
    } catch { toast.error("Failed to create") }
    finally { setLoading(false) }
  }

  return (
    <div className="animate-fade-in pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        Back
      </button>
      <div className="page-header mb-5"><h1>New Article</h1><p>Create a knowledge base article</p></div>
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
                  <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. How to add a new product" required />
                </Field>
                <Field id="category" label="Category">
                  <Select id="category" options={["Getting Started", "Inventory", "Orders", "CRM", "Reports", "Settings"].map(c => ({ value: c, label: c }))} value={form.category} onChange={(e: any) => setForm({ ...form, category: e.target.value })} />
                </Field>
                <Field id="excerpt" label="Excerpt">
                  <Input id="excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Brief description of the article" />
                </Field>
                <Field id="content" label="Content">
                  <Textarea id="content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write your article content here..." rows={12} className="font-mono text-sm" />
                </Field>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-4 space-y-4" />
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" loading={loading}>Publish Article</Button>
        </div>
      </form>
    </div>
  )
}
