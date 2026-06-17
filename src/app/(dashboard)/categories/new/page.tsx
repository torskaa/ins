"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Tag, XCircle } from "lucide-react"

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

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
    <div className="animate-fade-in pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        Back
      </button>
      <div className="page-header mb-5"><h1>New Category</h1></div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  <h3 className="text-sm font-semibold">Category Info</h3>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Field id="name" label="Name" required>
                  <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </Field>
                <Field id="parentId" label="Parent Category (optional)">
                  <Select id="parentId" options={categories.filter(c => c.id !== form.parentId).map(c => ({ value: c.id, label: c.name }))} placeholder="None (top level)" value={form.parentId} onChange={(e: any) => setForm({ ...form, parentId: e.target.value })} />
                </Field>
                <Field id="description" label="Description">
                  <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </Field>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-4 space-y-4">
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" loading={loading}>Create Category</Button>
        </div>
      </form>
    </div>
  )
}
