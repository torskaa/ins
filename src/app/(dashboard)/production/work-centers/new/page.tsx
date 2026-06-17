"use client"

import { useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { XCircle, Settings, SlidersHorizontal } from "lucide-react"

export default function NewWorkCenterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ code: "", name: "", description: "", costPerHour: "0", capacity: "1", location: "", isActive: true })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { toast.error("Name is required"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/work-centers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, costPerHour: parseFloat(form.costPerHour) || 0, capacity: parseInt(form.capacity) || 1 }),
      })
      if (!res.ok) throw new Error()
      toast.success("Work center created")
      router.push("/production/work-centers")
      router.refresh()
    } catch { toast.error("Failed to create") }
    finally { setLoading(false) }
  }

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
        <div className="page-header"><h1>New Work Center</h1><p>Add a production work center</p></div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-semibold">Basic Info</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field id="code" label="Code">
                    <Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. WC-001" className="pl-9" />
                  </Field>
                  <Field id="name" label="Name" required>
                    <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Assembly Line 1" className="pl-9" required />
                  </Field>
                </div>
                <Field id="description" label="Description">
                  <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this work center do?" rows={2} />
                </Field>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-4 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="text-sm font-semibold">Settings</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Field id="costPerHour" label="Cost per Hour (฿)">
                  <Input id="costPerHour" type="number" min="0" value={form.costPerHour} onChange={(e) => setForm({ ...form, costPerHour: e.target.value })} className="pl-9" />
                </Field>
                <Field id="capacity" label="Capacity (units)">
                  <Input id="capacity" type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
                </Field>
                <Field id="location" label="Location">
                  <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Bldg/Floor" className="pl-9" />
                </Field>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" loading={loading}>Create Work Center</Button>
        </div>
      </form>
    </div>
  )
}
