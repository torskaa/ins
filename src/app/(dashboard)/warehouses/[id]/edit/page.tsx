"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Warehouse, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

export default function EditWarehousePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [form, setForm] = useState({ name: "", location: "", capacity: "", binLocation: "" })

  useEffect(() => {
    fetch(`/api/warehouses/${id}`).then(r => r.json()).then(d => {
      if (d.error) { toast.error("Warehouse not found"); router.push("/warehouses"); return }
      setForm({ name: d.name || "", location: d.location || "", capacity: d.capacity ? String(d.capacity) : "", binLocation: d.binLocation || "" })
    }).finally(() => setFetching(false))
  }, [id, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { toast.error("Name is required"); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/warehouses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          location: form.location || null,
          capacity: form.capacity ? parseInt(form.capacity) : null,
          binLocation: form.binLocation || null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Warehouse updated")
      router.push(`/warehouses/${id}`)
      router.refresh()
    } catch { toast.error("Failed to update") }
    finally { setLoading(false) }
  }

  if (fetching) return <Skeleton className="h-48 w-full rounded-xl" />

  return (
    <div className="animate-fade-in pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        Back
      </button>
      <div className="page-header mb-5"><h1>Edit Warehouse</h1></div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Warehouse Info</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field id="name" label="Name" required>
                    <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </Field>
                  <Field id="capacity" label="Capacity">
                    <Input id="capacity" type="number" min="0" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
                  </Field>
                </div>
                <Field id="location" label="Location">
                  <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </Field>
                <Field id="binLocation" label="Bin Location">
                  <Input id="binLocation" value={form.binLocation} onChange={(e) => setForm({ ...form, binLocation: e.target.value })} />
                </Field>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-4 flex flex-col gap-4" />
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" loading={loading}>Update Warehouse</Button>
        </div>
      </form>
    </div>
  )
}
