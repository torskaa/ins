"use client"

import { useState, useEffect, use, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { SkeletonForm } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { XCircle, Settings, SlidersHorizontal } from "lucide-react"

export default function EditWorkCenterPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [form, setForm] = useState({ code: "", name: "", description: "", costPerHour: "0", capacity: "1", location: "", isActive: true })

  useEffect(() => {
    fetch(`/api/work-centers/${id}`)
      .then(r => r.json())
      .then((d) => {
        if (!d || d.error) { toast.error("Work center not found"); router.push("/production/work-centers"); return }
        setForm({ code: d.code || "", name: d.name || "", description: d.description || "", costPerHour: String(d.costPerHour || 0), capacity: String(d.capacity || 1), location: d.location || "", isActive: d.isActive ?? true })
      })
      .finally(() => setFetching(false))
  }, [id, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { toast.error("Name is required"); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/work-centers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, costPerHour: parseFloat(form.costPerHour) || 0, capacity: parseInt(form.capacity) || 1 }),
      })
      if (!res.ok) throw new Error()
      toast.success("Work center updated")
      router.push(`/production/work-centers/${id}`)
      router.refresh()
    } catch { toast.error("Failed to update") }
    finally { setSaving(false) }
  }

  if (fetching) return <SkeletonForm fields={5} />

  const Field = ({ id, label, required, children, className }: { id?: string; label: ReactNode; required?: boolean; children: ReactNode; className?: string }) => (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      {children}
    </div>
  )

  return (
    <div className="animate-fade-in pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        Back
      </button>
      <div className="mb-5">
        <div className="page-header"><h1>Edit Work Center</h1><p>{form.name}</p></div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-semibold">Basic Info</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field id="code" label="Code">
                    <Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="WC-001" />
                  </Field>
                  <Field id="name" label="Name" required>
                    <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Assembly Line 1" />
                  </Field>
                </div>
                <Field id="description" label="Description">
                  <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                </Field>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-4 flex flex-col gap-4">
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="text-sm font-semibold">Configuration</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Field id="costPerHour" label="Cost per Hour (฿)">
                  <Input id="costPerHour" type="number" min="0" value={form.costPerHour} onChange={(e) => setForm({ ...form, costPerHour: e.target.value })} />
                </Field>
                <Field id="capacity" label="Capacity">
                  <Input id="capacity" type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
                </Field>
                <Field id="location" label="Location">
                  <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Building A, Floor 2" />
                </Field>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-border" />
                  <span className="text-sm">Active</span>
                </label>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" loading={saving}>Update Work Center</Button>
        </div>
      </form>
    </div>
  )
}
