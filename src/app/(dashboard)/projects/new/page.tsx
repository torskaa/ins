"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FolderKanban, XCircle } from "lucide-react"
import { toast } from "sonner"

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", priority: "medium", startDate: "", dueDate: "", budget: "0" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { toast.error("Name is required"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error()
      toast.success("Project created"); router.push("/projects"); router.refresh()
    } catch { toast.error("Failed to create") } finally { setLoading(false) }
  }

  return (
    <div className="animate-fade-in pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5">Back</button>
      <div className="page-header mb-5"><h1>New Project</h1><p>Create a new project to organize tasks</p></div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4" />
                  <span className="text-sm font-semibold">Project Details</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Field id="name" label="Name" required>
                  <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Project name" />
                </Field>
                <Field id="description" label="Description">
                  <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Project description..." />
                </Field>
                <Field id="priority" label="Priority">
                  <Select id="priority" options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "urgent", label: "Urgent" }]} value={form.priority} onChange={(e: any) => setForm({ ...form, priority: e.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field id="startDate" label="Start Date">
                    <Input id="startDate" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                  </Field>
                  <Field id="dueDate" label="Due Date">
                    <Input id="dueDate" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                  </Field>
                </div>
                <Field id="budget" label="Budget (฿)">
                  <Input id="budget" type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
                </Field>
              </CardContent>
            </Card>
            <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
              <Button type="submit" loading={loading}>Create Project</Button>
            </div>
          </div>
          <div className="col-span-4 flex flex-col gap-4" />
        </div>
      </form>
    </div>
  )
}
