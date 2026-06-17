"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { GraduationCap, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

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
    <div className="animate-fade-in pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        Back
      </button>
      <div className="page-header mb-5"><h1>New Training Program</h1><p>Create a training course or workshop</p></div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Program Details</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Field id="title" label="Title" required>
                  <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Inventory Management Basics" required />
                </Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field id="type" label="Type">
                    <select id="type" className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      <option value="Course">Course</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Video">Video</option>
                    </select>
                  </Field>
                  <Field id="level" label="Level">
                    <select id="level" className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </Field>
                  <Field id="modules" label="Modules">
                    <Input id="modules" type="number" min="1" value={form.modules} onChange={(e) => setForm({ ...form, modules: e.target.value })} />
                  </Field>
                </div>
                <Field id="duration" label="Duration">
                  <Input id="duration" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 2 hours" />
                </Field>
                <Field id="description" label="Description">
                  <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                </Field>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-4 space-y-4" />
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" loading={loading}>Create Program</Button>
        </div>
      </form>
    </div>
  )
}
