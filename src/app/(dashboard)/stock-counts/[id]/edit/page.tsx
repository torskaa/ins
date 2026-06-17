"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { use } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ClipboardList, FileText, Calendar, Save, Warehouse, XCircle } from "lucide-react"
import { SkeletonForm } from "@/components/ui/skeleton"

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

type SelectOption = { id: string; name: string }

export default function EditStockCountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [warehouses, setWarehouses] = useState<SelectOption[]>([])

  const [form, setForm] = useState({
    number: "", status: "draft", countDate: "",
    notes: "", warehouseId: "",
  })

  useEffect(() => {
    Promise.all([
      fetch("/api/stock-counts/" + id).then(r => r.json()),
      fetch("/api/warehouses").then(r => r.json()),
    ]).then(([sc, whs]) => {
      setWarehouses(Array.isArray(whs) ? whs : [])
      setForm({
        number: sc.number || "",
        status: sc.status || "draft",
        countDate: sc.countDate ? sc.countDate.split("T")[0] : "",
        notes: sc.notes || "",
        warehouseId: sc.warehouseId || "",
      })
    }).finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.warehouseId) { toast.error("Warehouse is required"); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/stock-counts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success("Stock count updated")
      router.push(`/stock-counts/${id}`)
      router.refresh()
    } catch {
      toast.error("Failed to update stock count")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="animate-fade-in"><SkeletonForm fields={6} /></div>

  return (
    <div className="animate-fade-in pb-28">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        Back
      </button>

      <div className="page-header mb-5">
        <h1>Edit Stock Count</h1>
        <p>Update stock count information</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  <h3 className="text-sm font-semibold">Count Info</h3>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <Field id="number" label="Count Number">
                    <Input id="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="font-mono" />
                  </Field>
                  <Field id="status" label="Status">
                    <Select id="status" options={STATUS_OPTIONS} value={form.status} onChange={(e: any) => setForm({ ...form, status: e.target.value })} />
                  </Field>
                  <Field id="countDate" label="Count Date">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="countDate" type="date" value={form.countDate} onChange={(e) => setForm({ ...form, countDate: e.target.value })} className="pl-9" />
                    </div>
                  </Field>
                </div>
                <Field id="warehouseId" label="Warehouse" required>
                  <div className="relative">
                    <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                    <Select id="warehouseId" options={warehouses.map(w => ({ value: w.id, label: w.name }))} placeholder="Select warehouse" value={form.warehouseId} onChange={(e: any) => setForm({ ...form, warehouseId: e.target.value })} />
                  </div>
                </Field>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <h3 className="text-sm font-semibold">Notes</h3>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
              </CardContent>
            </Card>
          </div>
          <div className="col-span-4 flex flex-col gap-4">
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" loading={saving}><Save className="w-4 h-4" /> Save Changes</Button>
        </div>
      </form>
    </div>
  )
}
