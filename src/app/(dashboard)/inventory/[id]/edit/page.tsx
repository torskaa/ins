"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { SkeletonForm } from "@/components/ui/skeleton"
import { XCircle, Package, DollarSign, Boxes, Layers, Barcode, Ruler } from "lucide-react"

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

import { cn } from "@/lib/utils"

type Product = { id: string; name: string; sku: string }

const TYPE_OPTIONS = [
  { value: "raw_material", label: "Raw Material" },
  { value: "finished_good", label: "Finished Good" },
  { value: "service", label: "Service" },
]

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "discontinued", label: "Discontinued" },
]

const VAT_OPTIONS = [
  { value: "include_vat", label: "Include VAT" },
  { value: "exclude_vat", label: "Exclude VAT" },
]

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState("")
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({ name: "", sku: "", description: "", type: "finished_good", status: "active", price: "0", costPrice: "0", stock: "0", minStock: "0", categoryId: "", vatStatus: "include_vat", unit: "pcs", barcode: "", weight: "0", image: "", leadTime: "0" })

  useEffect(() => { params.then((p) => setId(p.id)) }, [params])
  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/products/${id}`).then(r => r.json()),
      fetch("/api/categories").then(r => r.json()),
    ]).then(([prod, cats]) => {
      if (prod.error) { toast.error("Product not found"); router.push("/inventory"); return }
      setForm({ name: prod.name || "", sku: prod.sku || "", description: prod.description || "", type: prod.type || "finished_good", status: prod.status || "active", price: String(prod.price || 0), costPrice: String(prod.costPrice || 0), stock: String(prod.stock || 0), minStock: String(prod.minStock || 0), categoryId: prod.categoryId || "", vatStatus: prod.vatStatus || "include_vat", unit: prod.unit || "pcs", barcode: prod.barcode || "", weight: String(prod.weight || 0), image: prod.image || "", leadTime: String(prod.leadTime || 0) })
      if (Array.isArray(cats)) setCategories(cats)
    }).finally(() => setFetching(false))
  }, [id, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { toast.error("Name is required"); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/products/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, price: parseFloat(form.price), costPrice: parseFloat(form.costPrice), stock: parseInt(form.stock) || 0, minStock: parseInt(form.minStock) || 0, weight: parseFloat(form.weight) || 0, leadTime: parseInt(form.leadTime) || 0 }) })
      if (!res.ok) throw new Error()
      toast.success("Product updated"); router.push(`/inventory/${id}`); router.refresh()
    } catch { toast.error("Failed to update") } finally { setSaving(false) }
  }

  if (fetching) return <SkeletonForm fields={8} />

  return (
    <div className="animate-fade-in pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">Back</button>
      <div className="page-header mb-5"><h1>Edit Product</h1><p>{form.sku} · {form.name}</p></div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Package className="w-4 h-4 text-primary" />
                  General Information
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Name" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                  <Field label="SKU"><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></Field>
                </div>
                <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Type"><Select options={TYPE_OPTIONS} value={form.type} onChange={(e: any) => setForm({ ...form, type: e.target.value })} /></Field>
                  <Field label="Unit"><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Barcode"><Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></Field>
                  <Field label="Weight (kg)"><Input type="number" min="0" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} /></Field>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Pricing & Inventory
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Selling Price"><Input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
                  <Field label="Cost Price"><Input type="number" min="0" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /></Field>
                  <Field label="Stock"><Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></Field>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Min Stock"><Input type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} /></Field>
                  <Field label="Lead Time (days)"><Input type="number" min="0" value={form.leadTime} onChange={(e) => setForm({ ...form, leadTime: e.target.value })} /></Field>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-4 flex flex-col gap-4">
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Boxes className="w-4 h-4 text-primary" />
                  Classification
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Field label="Category"><Select options={categories.map((c) => ({ value: c.id, label: c.name }))} value={form.categoryId} onChange={(e: any) => setForm({ ...form, categoryId: e.target.value })} placeholder="Select category" /></Field>
                <Field label="Status"><Select options={STATUS_OPTIONS} value={form.status} onChange={(e: any) => setForm({ ...form, status: e.target.value })} /></Field>
                <Field label="VAT Status"><Select options={VAT_OPTIONS} value={form.vatStatus} onChange={(e: any) => setForm({ ...form, vatStatus: e.target.value })} /></Field>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" loading={saving}>Update Product</Button>
        </div>
      </form>
    </div>
  )
}
