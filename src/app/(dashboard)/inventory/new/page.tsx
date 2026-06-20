"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useFormValidation } from "@/hooks/use-form-validation"
import { productSchema, z } from "@/lib/validation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ImageGallery } from "@/components/ui/image-gallery"
import { EmptyState } from "@/components/ui/empty-state"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AlertCircle, AlertTriangle, X, Boxes, DollarSign, Layers, MapPin, Package, Tags } from "lucide-react"

const UOM_OPTIONS = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "g", label: "Grams (g)" },
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
  { value: "liter", label: "Liter (L)" },
  { value: "ml", label: "Milliliter (ml)" },
  { value: "m", label: "Meters (m)" },
  { value: "roll", label: "Roll" },
  { value: "sheet", label: "Sheet" },
  { value: "set", label: "Set" },
  { value: "unit", label: "Unit" },
]

const CURRENCIES = [
  { value: "THB", label: "THB (฿)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "JPY", label: "JPY (¥)" },
  { value: "CNY", label: "CNY (¥)" },
  { value: "SGD", label: "SGD (S$)" },
  { value: "MYR", label: "MYR (RM)" },
  { value: "VND", label: "VND (₫)" },
  { value: "KRW", label: "KRW (₩)" },
]

const VAT_OPTIONS = [
  { value: "include_vat", label: "รวม VAT (Include VAT)" },
  { value: "exclude_vat", label: "ไม่รวม VAT (Exclude VAT)" },
  { value: "import_duty", label: "ภาษีขาเข้า (Import Duty)" },
  { value: "zero_rated", label: "Zero Rated" },
  { value: "exempt", label: "ยกเว้นภาษี (Exempt)" },
]

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "discontinued", label: "Discontinued" },
]

const PRESET_TAGS = [
  "Best Seller", "Seasonal", "Fragile", "Hazardous",
  "Perishable", "Imported", "Premium", "Eco-Friendly", "Bulk", "Sample",
]

function generateSku(name: string): string {
  const prefix = name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase())
    .slice(0, 3)
    .join("")
  const num = Math.floor(1000 + Math.random() * 9000)
  return prefix ? `${prefix}-${num}` : `SKU-${num}`
}

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([])
  const [skuError, setSkuError] = useState("")
  const [skuChecking, setSkuChecking] = useState(false)
  const [skuValid, setSkuValid] = useState<boolean | null>(null)
  const skuTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const formRef = useRef<HTMLFormElement>(null)

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useFormValidation(productSchema, {
    defaultValues: {
      name: "", sku: "", barcode: "", description: "",
      unitPrice: 0, costPrice: 0, currency: "THB", vatStatus: "exclude_vat",
      stock: 0, minStock: 0, maxStock: undefined, safetyStock: 0,
      uom: "pcs", leadTime: 0,
      weight: undefined, dimensions: "", externalId: "",
      location: "", image: "",
      categoryId: undefined, supplierId: undefined, warehouseId: undefined, status: "active" } })

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then(r => r.json()).catch((err) => { setError(err.message); setLoading(false); return [] }),
      fetch("/api/suppliers").then(r => r.json()).catch((err) => { setError(err.message); setLoading(false); return [] }),
      fetch("/api/warehouses").then(r => r.json()).catch((err) => { setError(err.message); setLoading(false); return [] }),
    ]).then(([cats, sups, whs]) => {
      if (Array.isArray(cats)) setCategories(cats)
      if (Array.isArray(sups)) setSuppliers(sups)
      if (Array.isArray(whs)) setWarehouses(whs)
    })
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault(); formRef.current?.requestSubmit()
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const checkSku = useCallback(async (sku: string) => {
    if (!sku || sku.length < 2) { setSkuError(""); setSkuValid(null); return }
    setSkuChecking(true)
    try {
      const res = await fetch("/api/products", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sku }) })
      const json = await res.json()
      if (json.success && json.data?.exists) { setSkuError("This SKU is already in use"); setSkuValid(false) }
      else { setSkuError(""); setSkuValid(true) }
    } catch { setSkuError("Could not verify SKU"); setSkuValid(null) }
    finally { setSkuChecking(false) }
  }, [])

  const handleSkuChange = (value: string) => {
    setValue("sku", value)
    if (skuTimer.current) clearTimeout(skuTimer.current)
    setSkuValid(null); setSkuError("")
    skuTimer.current = setTimeout(() => checkSku(value), 500)
  }

  const autoGenerateSku = () => {
    const sku = generateSku(watch("name") || "Product")
    handleSkuChange(sku)
    toast.success("SKU generated", { duration: 2000 })
  }

  const addTag = (tag: string) => {
    const t = tag.trim()
    if (!t || tags.includes(t)) return
    setTags([...tags, t]); setTagInput("")
  }

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag))

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addTag(tagInput) }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) removeTag(tags[tags.length - 1])
  }

  async function onSubmit(data: z.infer<typeof productSchema>) {
    if (skuValid === false) { toast.error("Please use a different SKU"); return }

    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        ...data,
        weight: data.weight ?? null,
        dimensions: data.dimensions || undefined,
        externalId: data.externalId || undefined,
        tags: tags.length > 0 ? JSON.stringify(tags) : undefined,
        type: "finished_good" }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload) })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create")
      }
      const created = await res.json()
      toast.success("Product created successfully", {
        description: `${data.name} (${data.sku})`,
        action: { label: "View", onClick: () => router.push(`/inventory/${created.id}`) },
        duration: 5000 })
      router.push("/inventory")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create product")
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ id, label, required, children, className }: { id: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      {children}
    </div>
  )

  const wMinStock = watch("minStock") || 0
  const wSafetyStock = watch("safetyStock") || 0
  const wCostPrice = watch("costPrice") || 0
  const wUnitPrice = watch("unitPrice") || 0
  const wStock = watch("stock") || 0
  const reorderPoint = String(Number(wMinStock) + Number(wSafetyStock))
  const marginPct = Number(wCostPrice) && Number(wUnitPrice) > 0
    ? ((Number(wUnitPrice) - Number(wCostPrice)) / Number(wUnitPrice) * 100).toFixed(1)
    : null

  if (error) return (
    <div className="animate-fade-in pb-8 space-y-4">
      <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
    </div>
  )
  return (
    <div className="animate-fade-in pb-28">
      <div className="page-header mb-5">
        <h1>Add New Product</h1>
        <p>Create a finished good for your inventory</p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="col-span-8 flex flex-col gap-6">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Package className="w-4 h-4 text-primary" />
                  General Information
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-6 gap-3">
                  <Field id="name" label="Product Name" required className="col-span-3">
                    <Input id="name" {...register("name")} placeholder="e.g. Wireless Mouse" />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </Field>
                  <Field id="sku" label="SKU" required className="col-span-3">
                    <div className="relative">
                      <Input id="sku" value={watch("sku")} onChange={(e) => handleSkuChange(e.target.value)} placeholder="e.g. MS-001"
                        className={cn("pr-16", skuValid === true && "border-success", skuValid === false && "border-destructive")}
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        <button type="button" onClick={autoGenerateSku}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                          title="Auto-generate SKU"
                        ></button>
                        {skuChecking && <div className="w-3.5 h-3.5 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />}
                        {skuValid === true && !skuChecking && null}
                        {skuValid === false && !skuChecking && <AlertCircle className="w-3.5 h-3.5 text-destructive" />}
                      </div>
                    </div>
                    {skuError && <p className="text-xs text-destructive">{skuError}</p>}
                    {skuValid === true && <p className="text-xs text-success">SKU is available</p>}
                  </Field>
                </div>
                <div className="grid grid-cols-6 gap-3">
                  <Field id="barcode" label="Barcode" className="col-span-3">
                    <Input id="barcode" {...register("barcode")} placeholder="e.g. 8851234567890" />
                    {errors.barcode && <p className="text-xs text-destructive">{errors.barcode.message}</p>}
                  </Field>
                  <Field id="externalId" label="External ID" className="col-span-3">
                    <Input id="externalId" {...register("externalId")} placeholder="Shopee SKU / Accounting code" />
                    {errors.externalId && <p className="text-xs text-destructive">{errors.externalId.message}</p>}
                  </Field>
                </div>
                <Field id="description" label="Description">
                  <Textarea id="description" {...register("description")} placeholder="Describe the product — features, specifications, etc." rows={2} />
                  {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Layers className="w-4 h-4 text-primary" />
                  Inventory & Stock Controls
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <Field id="uom" label="Unit of Measure">
                    <Select id="uom" options={UOM_OPTIONS} placeholder="Select UoM" value={watch("uom")} onChange={(e: any) => setValue("uom", e.target.value)} />
                    {errors.uom && <p className="text-xs text-destructive">{errors.uom.message}</p>}
                  </Field>
                  <Field id="stock" label="Initial Stock">
                    <Input id="stock" type="number" min="0" {...register("stock")} />
                    {errors.stock && <p className="text-xs text-destructive">{errors.stock.message}</p>}
                  </Field>
                  <Field id="minStock" label="Min Stock">
                    <Input id="minStock" type="number" min="0" {...register("minStock")} />
                    {errors.minStock && <p className="text-xs text-destructive">{errors.minStock.message}</p>}
                  </Field>
                  <Field id="maxStock" label="Max Stock">
                    <Input id="maxStock" type="number" min="0" {...register("maxStock")} />
                    {errors.maxStock && <p className="text-xs text-destructive">{errors.maxStock.message}</p>}
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field id="safetyStock" label={<span className="flex items-center gap-1">Safety Stock <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-muted text-[9px] font-semibold text-muted-foreground cursor-help" title="Buffer stock to prevent out-of-stock">?</span></span>}>
                    <Input id="safetyStock" type="number" min="0" {...register("safetyStock")} />
                    {errors.safetyStock && <p className="text-xs text-destructive">{errors.safetyStock.message}</p>}
                  </Field>
                  <Field id="reorderPoint" label={<span className="flex items-center gap-1">Reorder Point <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-muted text-[9px] font-semibold text-muted-foreground cursor-help" title="Min Stock + Safety Stock">?</span></span>}>
                    <Input id="reorderPoint" type="number" value={reorderPoint} readOnly className="bg-surface/50 text-muted-foreground cursor-default" />
                  </Field>
                  <Field id="leadTime" label={<span className="flex items-center gap-1">Lead Time (Days) <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-muted text-[9px] font-semibold text-muted-foreground cursor-help" title="Days from order to delivery">?</span></span>}>
                    <Input id="leadTime" type="number" min="0" {...register("leadTime")} />
                    {errors.leadTime && <p className="text-xs text-destructive">{errors.leadTime.message}</p>}
                  </Field>
                </div>
                {Number(wStock) > 0 && Number(wMinStock) > 0 && Number(wStock) <= Number(wMinStock) && (
                  <div className="flex items-center gap-2 text-xs text-warning bg-warning/5 rounded-lg px-3 py-2 border border-warning/20">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Initial stock is at or below minimum stock level
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Procurement & Financials
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <Field id="supplierId" label="Primary Supplier">
                    <Combobox value={watch("supplierId") || ""} onValueChange={(v) => setValue("supplierId", v || "")}>
                      <ComboboxInput placeholder="Select supplier" showTrigger />
                      <ComboboxContent>
                        <ComboboxList>
                          {suppliers.map(s => (
                            <ComboboxItem key={s.id} value={s.id}>{s.name}</ComboboxItem>
                          ))}
                          <ComboboxEmpty>No supplier found</ComboboxEmpty>
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    {errors.supplierId && <p className="text-xs text-destructive">{errors.supplierId.message}</p>}
                  </Field>
                  <Field id="costPrice" label="Cost Price (per UoM)">
                    <Input id="costPrice" type="number" step="0.01" min="0" {...register("costPrice")} />
                    {errors.costPrice && <p className="text-xs text-destructive">{errors.costPrice.message}</p>}
                  </Field>
                  <Field id="currency" label="Currency">
                    <Select id="currency" options={CURRENCIES} value={watch("currency")} onChange={(e: any) => setValue("currency", e.target.value)} />
                    {errors.currency && <p className="text-xs text-destructive">{errors.currency.message}</p>}
                  </Field>
                  <Field id="unitPrice" label="Unit Price (Sell)">
                    <Input id="unitPrice" type="number" step="0.01" min="0" {...register("unitPrice")} />
                    {errors.unitPrice && <p className="text-xs text-destructive">{errors.unitPrice.message}</p>}
                  </Field>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <Field id="vatStatus" label="VAT Status">
                    <Select id="vatStatus" options={VAT_OPTIONS} value={watch("vatStatus")} onChange={(e: any) => setValue("vatStatus", e.target.value)} />
                    {errors.vatStatus && <p className="text-xs text-destructive">{errors.vatStatus.message}</p>}
                  </Field>
                </div>
                {marginPct && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-surface rounded-lg px-3 py-2">
                    Margin: {marginPct}%
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Tags className="w-4 h-4 text-primary" />
                  Tags & Labels
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Input id="tags" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="Type a tag and press Enter..." />
                  <Button type="button" variant="default" size="sm" onClick={() => addTag(tagInput)} disabled={!tagInput.trim()}>Add</Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1 pl-2 pr-1 py-1 text-xs">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Suggested tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
                      <button key={tag} type="button" onClick={() => addTag(tag)}
                        className="px-3 py-1 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                      >+ {tag}</button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="col-span-4 flex flex-col gap-6">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Package className="w-4 h-4 text-primary" />
                  Image
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <ImageGallery
                  maxFiles={1}
                  onFilesChange={(files) => {
                    if (files.length > 0) {
                      const f = files[0]
                      if (f.preview) {
                        if (f.preview.startsWith("blob:")) {
                          const reader = new FileReader()
                          reader.onload = (ev) => setValue("image", ev.target?.result as string)
                          reader.readAsDataURL(f.file)
                        } else {
                          setValue("image", f.preview)
                        }
                      }
                    } else {
                      setValue("image", "")
                    }
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="w-4 h-4 text-primary" />
                  Location
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <Field id="warehouseId" label="Warehouse">
                    <Select id="warehouseId" options={warehouses.map(w => ({ value: w.id, label: w.name }))} placeholder="Select warehouse" value={watch("warehouseId")} onChange={(e: any) => setValue("warehouseId", e.target.value)} />
                    {errors.warehouseId && <p className="text-xs text-destructive">{errors.warehouseId.message}</p>}
                  </Field>
                  <Field id="location" label="Aisle / Bin">
                    <Input id="location" placeholder="Aisle-Bin" {...register("location")} />
                    {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
                  </Field>
                  <Field id="weight" label={<span className="flex items-center gap-1">Weight (kg) <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-muted text-[9px] font-semibold text-muted-foreground cursor-help" title="For warehouse space utilization">?</span></span>}>
                    <Input id="weight" type="number" step="0.001" min="0" {...register("weight")} placeholder="0.000" />
                    {errors.weight && <p className="text-xs text-destructive">{errors.weight.message}</p>}
                  </Field>
                  <Field id="dimensions" label={<span className="flex items-center gap-1">Dimensions <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-muted text-[9px] font-semibold text-muted-foreground cursor-help" title="Width x Length x Height (cm)">?</span></span>}>
                    <Input id="dimensions" {...register("dimensions")} placeholder="e.g. 30x20x10 cm" />
                    {errors.dimensions && <p className="text-xs text-destructive">{errors.dimensions.message}</p>}
                  </Field>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Boxes className="w-4 h-4 text-primary" />
                  Classification
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <Field id="categoryId" label="Category">
                  <Combobox value={watch("categoryId") || ""} onValueChange={(v) => setValue("categoryId", v || "")}>
                    <ComboboxInput placeholder="Select category" showTrigger />
                    <ComboboxContent>
                      <ComboboxList>
                        {categories.map(c => (
                          <ComboboxItem key={c.id} value={c.id}>{c.name}</ComboboxItem>
                        ))}
                        <ComboboxEmpty>No category found</ComboboxEmpty>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
                </Field>
                <Field id="status" label="Status">
                  <Combobox value={watch("status") || "active"} onValueChange={(v) => setValue("status", v || "active")}>
                    <ComboboxInput placeholder="Select status" showTrigger />
                    <ComboboxContent>
                      <ComboboxList>
                        {STATUS_OPTIONS.map(s => (
                          <ComboboxItem key={s.value} value={s.value}>{s.label}</ComboboxItem>
                        ))}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
                </Field>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm shadow-lg shadow-black/5 ml-60">
        <div className="max-w-[calc(12*80px+11*16px)] mx-auto px-6 py-3 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>Cancel</Button>
            <Button loading={loading} size="sm" onClick={() => formRef.current?.requestSubmit()}>Create Product <kbd className="ml-1.5 px-1.5 py-0.5 rounded border border-primary-foreground/20 text-[10px] font-mono bg-primary-foreground/10">⌘↵</kbd></Button>
          </div>
        </div>
      </div>
    </div>
  )
}
