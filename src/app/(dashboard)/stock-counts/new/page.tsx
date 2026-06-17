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
import { cn } from "@/lib/utils"
import { ClipboardList, Package, FileText, Calendar, Warehouse, Plus, Trash2, XCircle, Barcode } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "in_progress", label: "In Progress" },
]

type SelectOption = { id: string; name: string }
type CountItem = { productId: string; productName: string; sku: string; expectedQty: number }

export default function NewStockCountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [warehouses, setWarehouses] = useState<SelectOption[]>([])
  const [products, setProducts] = useState<SelectOption[]>([])
  const [items, setItems] = useState<CountItem[]>([])

  const [form, setForm] = useState({
    number: "", status: "draft", countDate: new Date().toISOString().split("T")[0],
    notes: "", warehouseId: "",
  })

  useEffect(() => {
    Promise.all([
      fetch("/api/warehouses").then(r => r.json()),
      fetch("/api/products").then(r => r.json()),
    ]).then(([whs, prods]) => {
      setWarehouses(Array.isArray(whs) ? whs : [])
      setProducts(Array.isArray(prods) ? prods : [])
    })
  }, [])

  function addItem() {
    setItems([...items, { productId: "", productName: "", sku: "", expectedQty: 1 }])
  }

  function updateItem(index: number, field: keyof CountItem, value: any) {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      const updated = { ...item, [field]: value }
      if (field === "productId") {
        const prod = products.find(p => p.id === value)
        if (prod) {
          updated.productName = prod.name
          updated.sku = (prod as any).sku || ""
        }
      }
      return updated
    }))
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.warehouseId) { toast.error("Warehouse is required"); return }
    if (items.length === 0) { toast.error("Add at least one item to count"); return }
    setLoading(true)
    try {
      const body = {
        ...form,
        items: items.map(i => ({ productId: i.productId, expectedQty: i.expectedQty })),
      }
      const res = await fetch("/api/stock-counts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      const created = await res.json()
      toast.success("Stock count created")
      router.push(`/stock-counts/${created.id}`)
      router.refresh()
    } catch {
      toast.error("Failed to create stock count")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in pb-28">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        Back
      </button>

      <div className="page-header mb-5">
        <h1>New Stock Count</h1>
        <p>Start a new inventory counting session</p>
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
                    <Input id="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="e.g. SC-2025-006" className="font-mono" />
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

            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <h3 className="text-sm font-semibold">Items to Count</h3>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1.5"><Plus className="w-4 h-4" /> Add Product</Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {items.length === 0 && (
                  <EmptyState
                    icons={[<Package key="s1" className="w-6 h-6" />, <Barcode key="s2" className="w-6 h-6" />, <ClipboardList key="s3" className="w-6 h-6" />]}
                    title="No items yet"
                    description="Add products to include in this stock count"
                    size="sm"
                  />
                )}
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-end gap-3 p-3 rounded-lg border border-border bg-surface/50">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-[11px]">Product</Label>
                      <Select
                        options={products.map(p => ({ value: p.id, label: `${p.name} (${(p as any).sku || ""})` }))}
                        placeholder="Select product"
                        value={item.productId}
                        onChange={(e: any) => updateItem(idx, "productId", e.target.value)}
                      />
                    </div>
                    <div className="w-24 space-y-1.5">
                      <Label className="text-[11px]">Expected Qty</Label>
                      <Input type="number" min="1" value={item.expectedQty} onChange={(e) => updateItem(idx, "expectedQty", parseInt(e.target.value) || 1)} className="text-center font-mono" />
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="text-destructive mb-0.5" onClick={() => removeItem(idx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
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
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes about this counting session..." rows={3} />
              </CardContent>
            </Card>
          </div>
          <div className="col-span-4 flex flex-col gap-4">
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" loading={loading}>Create Stock Count</Button>
        </div>
      </form>
    </div>
  )
}
