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
import { GraduationCap, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

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

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

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

  if (fetching) return <div className="animate-fade-in pb-28"><SkeletonForm fields={5} /></div>

  return (
    <div className="animate-fade-in pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        Back
      </button>
      <div className="page-header mb-5"><h1>Edit Training Program</h1><p>{form.title}</p></div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Program Info</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Field id="title" label="Title" required>
                  <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Program title" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field id="type" label="Type">
                    <Select id="type" options={TYPE_OPTIONS} value={form.type} onChange={(e: any) => setForm({ ...form, type: e.target.value })} />
                  </Field>
                  <Field id="level" label="Level">
                    <Select id="level" options={LEVEL_OPTIONS} value={form.level} onChange={(e: any) => setForm({ ...form, level: e.target.value })} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field id="duration" label="Duration">
                    <Input id="duration" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 2 hours" />
                  </Field>
                  <Field id="modules" label="Modules">
                    <Input id="modules" type="number" min="1" value={form.modules} onChange={(e) => setForm({ ...form, modules: e.target.value })} />
                  </Field>
                </div>
                <Field id="description" label="Description">
                  <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                </Field>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-4 flex flex-col gap-4" />
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" loading={saving}>Update Program</Button>
        </div>
      </form>
    </div>
  )
}
