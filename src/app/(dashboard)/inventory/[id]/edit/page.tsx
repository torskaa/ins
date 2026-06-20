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
import { AlertTriangle, XCircle, Package, DollarSign, Boxes, Layers, Barcode, Ruler } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import { useFormValidation } from "@/hooks/use-form-validation"
import { productSchema, z } from "@/lib/validation"

const Field = ({ id, label, required, children, error, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; error?: string; className?: string }) => (
  <div className={cn("space-y-1", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
)

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
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useFormValidation(productSchema)

  useEffect(() => { params.then((p) => setId(p.id)) }, [params])
  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/products/${id}`).then(r => r.json()),
      fetch("/api/categories").then(r => r.json()),
    ]).then(([prod, cats]) => {
      if (prod.error) { toast.error("Product not found"); router.push("/inventory"); return }
      reset({
        name: prod.name || "",
        sku: prod.sku || "",
        description: prod.description || "",
        type: prod.type || "finished_good",
        status: prod.status || "active",
        unitPrice: prod.price ? parseFloat(prod.price) : 0,
        costPrice: prod.costPrice ? parseFloat(prod.costPrice) : 0,
        stock: prod.stock ? parseInt(prod.stock) : 0,
        minStock: prod.minStock ? parseInt(prod.minStock) : 0,
        categoryId: prod.categoryId || undefined,
        vatStatus: prod.vatStatus || "include_vat",
        uom: prod.unit || "pcs",
        barcode: prod.barcode || "",
        weight: prod.weight ? parseFloat(prod.weight) : 0,
        image: prod.image || "",
        leadTime: prod.leadTime ? parseInt(prod.leadTime) : 0,
      })
      if (Array.isArray(cats)) setCategories(cats)
    }).catch((err) => { setError(err.message); setFetching(false) }).finally(() => setFetching(false))
  }, [id, router, reset])

  async function onSubmit(data: z.infer<typeof productSchema>) {
    setSaving(true)
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          sku: data.sku,
          description: data.description,
          type: data.type,
          status: data.status,
          price: data.unitPrice,
          costPrice: data.costPrice,
          stock: data.stock,
          minStock: data.minStock,
          categoryId: data.categoryId,
          vatStatus: data.vatStatus,
          unit: data.uom,
          barcode: data.barcode,
          weight: data.weight,
          image: data.image,
          leadTime: data.leadTime,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Product updated"); router.push(`/inventory/${id}`); router.refresh()
    } catch { toast.error("Failed to update") } finally { setSaving(false) }
  }

  if (error) return (
    <div className="animate-fade-in pb-8 space-y-4">
      <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
    </div>
  )
  if (fetching) return <SkeletonForm fields={8} />

  return (
    <div className="animate-fade-in pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">Back</button>
      <div className="page-header mb-5"><h1>Edit Product</h1><p>{watch("sku")} · {watch("name")}</p></div>
      <form onSubmit={handleSubmit(onSubmit)}>
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
                  <Field label="Name" required error={errors.name?.message}><Input {...register("name")} /></Field>
                  <Field label="SKU" error={errors.sku?.message}><Input {...register("sku")} /></Field>
                </div>
                <Field label="Description" error={errors.description?.message}><Textarea {...register("description")} rows={2} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Type" error={errors.type?.message}>
                    <Select options={TYPE_OPTIONS} value={watch("type")} onChange={(e: any) => setValue("type", e.target.value, { shouldValidate: true })} />
                  </Field>
                  <Field label="Unit" error={errors.uom?.message}><Input {...register("uom")} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Barcode" error={errors.barcode?.message}><Input {...register("barcode")} /></Field>
                  <Field label="Weight (kg)" error={errors.weight?.message}><Input type="number" min="0" {...register("weight")} /></Field>
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
                  <Field label="Selling Price" error={errors.unitPrice?.message}><Input type="number" min="0" {...register("unitPrice")} /></Field>
                  <Field label="Cost Price" error={errors.costPrice?.message}><Input type="number" min="0" {...register("costPrice")} /></Field>
                  <Field label="Stock" error={errors.stock?.message}><Input type="number" min="0" {...register("stock")} /></Field>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Min Stock" error={errors.minStock?.message}><Input type="number" min="0" {...register("minStock")} /></Field>
                  <Field label="Lead Time (days)" error={errors.leadTime?.message}><Input type="number" min="0" {...register("leadTime")} /></Field>
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
                <Field label="Category" error={errors.categoryId?.message}>
                  <Select options={categories.map((c) => ({ value: c.id, label: c.name }))} value={watch("categoryId")} onChange={(e: any) => setValue("categoryId", e.target.value, { shouldValidate: true })} placeholder="Select category" />
                </Field>
                <Field label="Status" error={errors.status?.message}>
                  <Select options={STATUS_OPTIONS} value={watch("status")} onChange={(e: any) => setValue("status", e.target.value, { shouldValidate: true })} />
                </Field>
                <Field label="VAT Status" error={errors.vatStatus?.message}>
                  <Select options={VAT_OPTIONS} value={watch("vatStatus")} onChange={(e: any) => setValue("vatStatus", e.target.value, { shouldValidate: true })} />
                </Field>
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
