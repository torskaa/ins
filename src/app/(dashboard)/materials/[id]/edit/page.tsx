"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Box, Package, Truck, XCircle } from "lucide-react"
import { toast } from "sonner"
import { SkeletonForm } from "@/components/ui/skeleton"

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      {children}
    </div>
  )
}

export default function EditMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState("")
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({ name: "", sku: "", description: "", price: "0", costPrice: "0", stock: "0", minStock: "0", unit: "pcs", supplierId: "", leadTime: "0" })

  useEffect(() => { params.then((p) => setId(p.id)) }, [params])
  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/materials/${id}`).then(r => r.json()),
      fetch("/api/suppliers").then(r => r.json()),
    ]).then(([mat, sups]) => {
      if (mat.error) { toast.error("Material not found"); router.push("/materials"); return }
      setForm({ name: mat.name || "", sku: mat.sku || "", description: mat.description || "", price: String(mat.price || 0), costPrice: String(mat.costPrice || 0), stock: String(mat.stock || 0), minStock: String(mat.minStock || 0), unit: mat.unit || "pcs", supplierId: mat.supplierId || "", leadTime: String(mat.leadTime || 0) })
      if (Array.isArray(sups)) setSuppliers(sups)
    }).finally(() => setFetching(false))
  }, [id, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { toast.error("Name is required"); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/materials/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, price: parseFloat(form.price), costPrice: parseFloat(form.costPrice), stock: parseInt(form.stock) || 0, minStock: parseInt(form.minStock) || 0, leadTime: parseInt(form.leadTime) || 0 }) })
      if (!res.ok) throw new Error()
      toast.success("Material updated"); router.push(`/materials/${id}`); router.refresh()
    } catch { toast.error("Failed to update") } finally { setSaving(false) }
  }

  if (fetching) return <SkeletonForm fields={5} />

  return (
    <div className="animate-fade-in pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">Back</button>
      <div className="page-header"><h1>Edit Material</h1><p>{form.sku} · {form.name}</p></div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Box className="w-4 h-4" /> General Information
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Name" required>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </Field>
                  <Field label="SKU">
                    <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                  </Field>
                </div>
                <Field label="Description">
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
                </Field>
                <Field label="Unit">
                  <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Package className="w-4 h-4" /> Inventory & Stock
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Stock">
                    <Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                  </Field>
                  <Field label="Min Stock">
                    <Input type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
                  </Field>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Truck className="w-4 h-4" /> Procurement
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Supplier">
                    <Select options={suppliers.map(s => ({ value: s.id, label: s.name }))} value={form.supplierId} onChange={(e: any) => setForm({ ...form, supplierId: e.target.value })} placeholder="Select supplier" />
                  </Field>
                  <Field label="Lead Time (days)">
                    <Input type="number" min="0" value={form.leadTime} onChange={(e) => setForm({ ...form, leadTime: e.target.value })} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Selling Price (฿)">
                    <Input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  </Field>
                  <Field label="Cost Price (฿)">
                    <Input type="number" min="0" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
                  </Field>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-4 space-y-4" />
        </div>

        <div className="sticky bottom-0 bg-background flex items-center justify-end gap-3 pt-4 border-t border-border mt-4 shadow-lg shadow-black/5">
          <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" loading={saving}>Update Material</Button>
        </div>
      </form>
    </div>
  )
}
