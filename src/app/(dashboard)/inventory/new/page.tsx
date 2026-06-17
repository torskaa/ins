"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
 ChevronDown, ChevronRight, Upload, X, ImageIcon, Link2,
 CheckCircle, AlertCircle, DollarSign, Sparkles} from "lucide-react"

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

type Section = "general" | "inventory" | "procurement" | "location" | "tags"

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
 const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
 const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
 const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([])
 const [collapsed, setCollapsed] = useState<Record<Section, boolean>>({
 general: false, inventory: false, procurement: false, location: false, tags: false})
 const [skuError, setSkuError] = useState("")
 const [skuChecking, setSkuChecking] = useState(false)
 const [skuValid, setSkuValid] = useState<boolean | null>(null)
 const skuTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
 const [imagePreview, setImagePreview] = useState<string | null>(null)
 const [imageUrl, setImageUrl] = useState("")
 const fileInputRef = useRef<HTMLInputElement>(null)
 const handleUpload = useCallback(() => fileInputRef.current?.click(), [])
 useHotkey("u", handleUpload)
 const [tags, setTags] = useState<string[]>([])
 const [tagInput, setTagInput] = useState("")
 const formRef = useRef<HTMLFormElement>(null)

 const [form, setForm] = useState({
 name: "", sku: "", barcode: "", description: "",
 unitPrice: "0", costPrice: "0", currency: "THB", vatStatus: "exclude_vat",
 stock: "0", minStock: "0", maxStock: "", safetyStock: "0",
 uom: "pcs", leadTime: "0",
 weight: "", dimensions: "", externalId: "",
 location: "", image: "",
 categoryId: "", supplierId: "", warehouseId: "", status: "active"})

 useEffect(() => {
 Promise.all([
 fetch("/api/categories").then(r => r.json()).catch(() => []),
 fetch("/api/suppliers").then(r => r.json()).catch(() => []),
 fetch("/api/warehouses").then(r => r.json()).catch(() => []),
 ]).then(([cats, sups, whs]) => {
 if (Array.isArray(cats)) setCategories(cats)
 if (Array.isArray(sups)) setSuppliers(sups)
 if (Array.isArray(whs)) setWarehouses(whs)
 })
 }, [])

 // Cmd+S
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
 const data = await res.json()
 if (data.exists) { setSkuError("This SKU is already in use"); setSkuValid(false) }
 else { setSkuError(""); setSkuValid(true) }
 } catch { setSkuError("Could not verify SKU"); setSkuValid(null) }
 finally { setSkuChecking(false) }
 }, [])

 const handleSkuChange = (value: string) => {
 setForm({ ...form, sku: value })
 if (skuTimer.current) clearTimeout(skuTimer.current)
 setSkuValid(null); setSkuError("")
 skuTimer.current = setTimeout(() => checkSku(value), 500)
 }

 const autoGenerateSku = () => {
 const sku = generateSku(form.name || "Product")
 handleSkuChange(sku)
 toast.success("SKU generated", { duration: 2000 })
 }

 const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0]
 if (!file) return
 const reader = new FileReader()
 reader.onload = (ev) => {
 const dataUrl = ev.target?.result as string
 setImagePreview(dataUrl); setForm({ ...form, image: dataUrl }); setImageUrl("")
 }
 reader.readAsDataURL(file)
 }

 const handleImageUrl = () => {
 if (!imageUrl) return
 setImagePreview(imageUrl); setForm({ ...form, image: imageUrl }); setImageUrl("")
 }

 const removeImage = () => { setImagePreview(null); setForm({ ...form, image: "" }); setImageUrl("") }

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

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!form.name || !form.sku) { toast.error("Name and SKU are required"); return }
 if (skuValid === false) { toast.error("Please use a different SKU"); return }

 setLoading(true)
 try {
 const payload: Record<string, unknown> = {
 ...form,
 weight: form.weight || null,
 dimensions: form.dimensions || undefined,
 externalId: form.externalId || undefined,
 tags: tags.length > 0 ? JSON.stringify(tags) : undefined,
 type: "finished_good"}

 const res = await fetch("/api/products", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(payload)})
 if (!res.ok) {
 const err = await res.json()
 throw new Error(err.error || "Failed to create")
 }
 const created = await res.json()
 toast.success("Product created successfully", {
 description: `${form.name} (${form.sku})`,
 action: { label: "View", onClick: () => router.push(`/inventory/${created.id}`) },
 duration: 5000})
 router.push("/inventory")
 router.refresh()
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Failed to create product")
 } finally {
 setLoading(false)
 }
 }

 const toggleSection = (section: Section) => setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }))

 const SectionHeader = ({ title, section }: { title: string; section: Section }) => (
 <button type="button" onClick={() => toggleSection(section)}
 className="flex items-center gap-2 text-sm font-semibold text-foreground px-1 py-1.5 w-full text-left hover:text-primary transition-colors"
 >
 {collapsed[section] ? null : null}
 {title}
 </button>
 )

 const Field = ({ id, label, required, children, className }: { id: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
 <div className={cn("space-y-2", className)}>
 <Label htmlFor={id}>{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
 {children}
 </div>
 )

 const reorderPoint = String((parseInt(form.minStock) || 0) + (parseInt(form.safetyStock) || 0))
 const marginPct = form.costPrice && form.unitPrice && parseFloat(form.unitPrice) > 0
 ? ((parseFloat(form.unitPrice) - parseFloat(form.costPrice)) / parseFloat(form.unitPrice) * 100).toFixed(1)
 : null

 return (
 <div className="animate-fade-in max-w-3xl pb-28">
 <div className="page-header">
 <h1>Add New Product</h1>
 <p>Create a finished good for your inventory</p>
 </div>

 <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
 {/* General */}
 <Card>
 <CardHeader className="pb-3"><SectionHeader title="General Information" section="general" /></CardHeader>
 {!collapsed.general && (
 <CardContent className="space-y-4 pt-0">
 <div className="grid grid-cols-2 gap-4">
 <Field id="name" label="Product Name" required>
 <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wireless Mouse" required className="text-base" />
 </Field>
 <Field id="sku" label="SKU" required>
 <div className="relative">
 <Input id="sku" value={form.sku} onChange={(e) => handleSkuChange(e.target.value)} placeholder="e.g. MS-001" required
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
 <div className="grid grid-cols-2 gap-4">
 <Field id="barcode" label="Barcode">
 <Input id="barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="e.g. 8851234567890" className="h-9" />
 </Field>
 <Field id="externalId" label={
 <span className="flex items-center gap-1.5">External ID <span className="text-[10px] text-muted-foreground font-normal">(Shopee SKU, Accounting code)</span></span>
 }>
 <Input id="externalId" value={form.externalId} onChange={(e) => setForm({ ...form, externalId: e.target.value })} placeholder="e.g. ACC-SHOP-001" className="h-9" />
 </Field>
 </div>
 <Field id="description" label="Description">
 <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the product — features, specifications, etc." rows={3} />
 </Field>
 {/* Image */}
 <Field id="image-upload" label="Image">
 <div className="flex items-start gap-4">
 <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border bg-surface flex items-center justify-center shrink-0 overflow-hidden">
 {imagePreview ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-muted-foreground/40" />}
 </div>
 <div className="space-y-2 flex-1">
 <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
 <Button type="button" variant="outline" size="sm" onClick={handleUpload} className="gap-1.5 text-xs h-8"><Upload className="w-4 h-4" /> Upload Image <ShortcutBadge shortcut="⌘U" /></Button>
 <div className="flex items-center gap-2">
 <Input placeholder="Or paste image URL..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="h-8 text-xs" />
 <Button type="button" variant="secondary" size="sm" onClick={handleImageUrl} disabled={!imageUrl} className="h-8 text-xs"></Button>
 </div>
 {imagePreview && (
 <Button type="button" variant="ghost" size="sm" onClick={removeImage} className="h-7 text-xs text-destructive gap-1">Remove</Button>
 )}
 </div>
 </div>
 </Field>
 </CardContent>
 )}
 </Card>

 {/* Inventory & Stock Controls */}
 <Card>
 <CardHeader className="pb-3"><SectionHeader title="Inventory & Stock Controls" section="inventory" /></CardHeader>
 {!collapsed.inventory && (
 <CardContent className="space-y-4 pt-0">
 <div className="grid grid-cols-4 gap-4">
 <Field id="uom" label="Unit of Measure">
 <Select id="uom" options={UOM_OPTIONS} placeholder="Select UoM" value={form.uom} onChange={(e: any) => setForm({ ...form, uom: e.target.value })} />
 </Field>
 <Field id="stock" label="Initial Stock">
 <Input id="stock" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
 </Field>
 <Field id="minStock" label="Min Stock">
 <Input id="minStock" type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
 </Field>
 <Field id="maxStock" label="Max Stock">
 <Input id="maxStock" type="number" min="0" value={form.maxStock} onChange={(e) => setForm({ ...form, maxStock: e.target.value })} />
 </Field>
 </div>
 <div className="grid grid-cols-3 gap-4">
 <Field id="safetyStock" label={<span className="flex items-center gap-1">Safety Stock <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-muted text-[9px] font-semibold text-muted-foreground cursor-help" title="Buffer stock to prevent out-of-stock">?</span></span>}>
 <Input id="safetyStock" type="number" min="0" value={form.safetyStock} onChange={(e) => setForm({ ...form, safetyStock: e.target.value })} />
 </Field>
 <Field id="reorderPoint" label={<span className="flex items-center gap-1">Reorder Point <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-muted text-[9px] font-semibold text-muted-foreground cursor-help" title="Min Stock + Safety Stock">⚡</span></span>}>
 <Input id="reorderPoint" type="number" value={reorderPoint} readOnly className="bg-surface/50 text-muted-foreground cursor-default" />
 </Field>
 <Field id="leadTime" label={<span className="flex items-center gap-1">Lead Time (Days) <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-muted text-[9px] font-semibold text-muted-foreground cursor-help" title="Days from order to delivery">?</span></span>}>
 <Input id="leadTime" type="number" min="0" value={form.leadTime} onChange={(e) => setForm({ ...form, leadTime: e.target.value })} />
 </Field>
 </div>
 {parseInt(form.stock) > 0 && parseInt(form.minStock) > 0 && parseInt(form.stock) <= parseInt(form.minStock) && (
 <div className="flex items-center gap-2 text-xs text-warning bg-warning/5 rounded-lg px-3 py-2 border border-warning/20">
 <AlertCircle className="w-3.5 h-3.5 shrink-0" />
 Initial stock is at or below minimum stock level
 </div>
 )}
 </CardContent>
 )}
 </Card>

 {/* Procurement & Financials */}
 <Card>
 <CardHeader className="pb-3"><SectionHeader title="Procurement & Financials" section="procurement" /></CardHeader>
 {!collapsed.procurement && (
 <CardContent className="space-y-4 pt-0">
 <div className="grid grid-cols-4 gap-4">
 <Field id="costPrice" label="Cost Price (per UoM)">
 <Input id="costPrice" type="number" step="0.01" min="0" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
 </Field>
 <Field id="currency" label="Currency">
 <Select id="currency" options={CURRENCIES} value={form.currency} onChange={(e: any) => setForm({ ...form, currency: e.target.value })} />
 </Field>
 <Field id="unitPrice" label="Unit Price (Sell)">
 <Input id="unitPrice" type="number" step="0.01" min="0" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
 </Field>
 <Field id="vatStatus" label="VAT Status">
 <Select id="vatStatus" options={VAT_OPTIONS} value={form.vatStatus} onChange={(e: any) => setForm({ ...form, vatStatus: e.target.value })} />
 </Field>
 </div>
 {marginPct && (
 <div className="flex items-center gap-2 text-xs text-muted-foreground bg-surface rounded-lg px-3 py-2">
 Margin: {marginPct}%
 </div>
 )}
 <div className="grid grid-cols-3 gap-4">
 <Field id="supplierId" label="Supplier">
 <Select id="supplierId" options={suppliers.map(s => ({ value: s.id, label: s.name }))} placeholder="Select supplier" value={form.supplierId} onChange={(e: any) => setForm({ ...form, supplierId: e.target.value })} />
 </Field>
 <Field id="categoryId" label="Category">
 <Select id="categoryId" options={categories.map(c => ({ value: c.id, label: c.name }))} placeholder="Select category" value={form.categoryId} onChange={(e: any) => setForm({ ...form, categoryId: e.target.value })} />
 </Field>
 <Field id="status" label="Status">
 <Select id="status" options={STATUS_OPTIONS} value={form.status} onChange={(e: any) => setForm({ ...form, status: e.target.value })} />
 </Field>
 </div>
 </CardContent>
 )}
 </Card>

 {/* Location & Dimensions */}
 <Card>
 <CardHeader className="pb-3"><SectionHeader title="Location & Physical Attributes" section="location" /></CardHeader>
 {!collapsed.location && (
 <CardContent className="space-y-4 pt-0">
 <div className="grid grid-cols-4 gap-4">
 <Field id="warehouseId" label="Warehouse">
 <Select id="warehouseId" options={warehouses.map(w => ({ value: w.id, label: w.name }))} placeholder="Select warehouse" value={form.warehouseId} onChange={(e: any) => setForm({ ...form, warehouseId: e.target.value })} />
 </Field>
 <Field id="location" label="Aisle / Bin">
 <Input id="location" placeholder="Aisle-Bin" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
 </Field>
 <Field id="weight" label={<span className="flex items-center gap-1">Weight (kg) <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-muted text-[9px] font-semibold text-muted-foreground cursor-help" title="For warehouse space utilization">?</span></span>}>
 <Input id="weight" type="number" step="0.001" min="0" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="0.000" className="h-9" />
 </Field>
 <Field id="dimensions" label={<span className="flex items-center gap-1">Dimensions <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-muted text-[9px] font-semibold text-muted-foreground cursor-help" title="Width x Length x Height (cm)">?</span></span>}>
 <Input id="dimensions" value={form.dimensions} onChange={(e) => setForm({ ...form, dimensions: e.target.value })} placeholder="e.g. 30x20x10 cm" className="h-9" />
 </Field>
 </div>
 </CardContent>
 )}
 </Card>

 {/* Tags */}
 <Card>
 <CardHeader className="pb-3"><SectionHeader title="Tags & Labels" section="tags" /></CardHeader>
 {!collapsed.tags && (
 <CardContent className="space-y-3 pt-0">
 <Field id="tags" label="Add Tags">
 <div className="flex items-center gap-2">
 <Input id="tags" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="Type a tag and press Enter..." className="h-9" />
 <Button type="button" variant="secondary" size="sm" onClick={() => addTag(tagInput)} disabled={!tagInput.trim()} className="h-9 text-xs">Add</Button>
 </div>
 <p className="text-xs text-muted-foreground">Press Enter to add, Backspace to remove last</p>
 </Field>
 {tags.length > 0 && (
 <div className="flex flex-wrap gap-1.5">
 {tags.map((tag) => (
 <Badge key={tag} variant="secondary" className="gap-1 pl-2 pr-1 py-1 text-xs font-normal">
 {tag}
 <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive transition-colors"></button>
 </Badge>
 ))}
 </div>
 )}
 <div>
 <p className="text-xs text-muted-foreground mb-2">Suggested tags:</p>
 <div className="flex flex-wrap gap-1.5">
 {PRESET_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
 <button key={tag} type="button" onClick={() => addTag(tag)}
 className="px-2 py-1 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
 >+ {tag}</button>
 ))}
 </div>
 </div>
 </CardContent>
 )}
 </Card>
 </form>

 {/* Sticky Footer */}
 <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm ml-60">
 <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
 <div className="text-xs text-muted-foreground">
 <span className="hidden sm:inline"><kbd className="px-1.5 py-0.5 rounded border border-border bg-surface text-[10px] font-mono">⌘S</kbd> to save</span>
 </div>
 <div className="flex items-center gap-3">
 <Button type="button" variant="ghost" onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground">Cancel</Button>
 <Button loading={loading} onClick={() => formRef.current?.requestSubmit()} className="px-6">Create Product</Button>
 </div>
 </div>
 </div>
 </div>
 )
}
