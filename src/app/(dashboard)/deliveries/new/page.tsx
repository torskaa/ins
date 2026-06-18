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
import { Truck, MapPin, Package, FileText, Building2, Calendar, Warehouse, Plus, Trash2, XCircle, ClipboardList } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "packing", label: "Packing" },
  { value: "shipped", label: "Shipped" },
  { value: "in_transit", label: "In Transit" },
]

type SelectOption = { id: string; name: string }
type LineItem = { productId: string; productName: string; sku: string; quantity: number; unitPrice: number }

export default function NewDeliveryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [distributors, setDistributors] = useState<SelectOption[]>([])
  const [warehouses, setWarehouses] = useState<SelectOption[]>([])
  const [products, setProducts] = useState<SelectOption[]>([])
  const [items, setItems] = useState<LineItem[]>([])

  const [form, setForm] = useState({
    number: "", status: "draft", carrier: "", trackingNumber: "",
    estimatedDate: "", notes: "", origin: "", destination: "",
    distributorId: "", warehouseId: "",
  })

  useEffect(() => {
    Promise.all([
      fetch("/api/distributors").then(r => r.json()),
      fetch("/api/warehouses").then(r => r.json()),
      fetch("/api/products").then(r => r.json()),
    ]).then(([dists, whs, prods]) => {
      setDistributors(Array.isArray(dists) ? dists : [])
      setWarehouses(Array.isArray(whs) ? whs : [])
      setProducts(Array.isArray(prods) ? prods : [])
    })
  }, [])

  function addItem() {
    setItems([...items, { productId: "", productName: "", sku: "", quantity: 1, unitPrice: 0 }])
  }

  function updateItem(index: number, field: keyof LineItem, value: any) {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      const updated = { ...item, [field]: value }
      if (field === "productId") {
        const prod = products.find(p => p.id === value)
        if (prod) {
          updated.productName = prod.name
          const fullProd = (prod as any).unitPrice
          if (fullProd) updated.unitPrice = fullProd
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
    if (!form.distributorId) { toast.error("Distributor is required"); return }
    if (items.length === 0) { toast.error("Add at least one item"); return }
    setLoading(true)
    try {
      const body = {
        ...form,
        totalItems: items.length,
        totalValue: items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.quantity * i.unitPrice,
        })),
      }
      const res = await fetch("/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed") }
      const created = await res.json()
      toast.success("Delivery created")
      router.push(`/deliveries/${created.id}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to create delivery")
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
        <h1>New Delivery</h1>
        <p>Create a delivery to a distributor</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  <h3 className="text-sm font-semibold">Delivery Info</h3>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <Field id="number" label="Delivery Number">
                    <Input id="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="e.g. DEL-2025-016" className="font-mono" />
                  </Field>
                  <Field id="status" label="Status">
                    <Select id="status" options={STATUS_OPTIONS} value={form.status} onChange={(e: any) => setForm({ ...form, status: e.target.value })} />
                  </Field>
                  <Field id="carrier" label="Carrier">
                    <Input id="carrier" value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} placeholder="e.g. DHL" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field id="distributorId" label="Distributor" required>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                      <Select id="distributorId" options={distributors.map(d => ({ value: d.id, label: d.name }))} placeholder="Select distributor" value={form.distributorId} onChange={(e: any) => setForm({ ...form, distributorId: e.target.value })} />
                    </div>
                  </Field>
                  <Field id="warehouseId" label="Warehouse">
                    <div className="relative">
                      <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                      <Select id="warehouseId" options={warehouses.map(w => ({ value: w.id, label: w.name }))} placeholder="Select warehouse" value={form.warehouseId} onChange={(e: any) => setForm({ ...form, warehouseId: e.target.value })} />
                    </div>
                  </Field>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <h3 className="text-sm font-semibold">Routing</h3>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field id="origin" label="Origin">
                    <Input id="origin" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="Origin city/warehouse" />
                  </Field>
                  <Field id="destination" label="Destination">
                    <Input id="destination" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Destination city/address" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field id="trackingNumber" label="Tracking Number">
                    <Input id="trackingNumber" value={form.trackingNumber} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} placeholder="Carrier tracking ID" />
                  </Field>
                  <Field id="estimatedDate" label="Estimated Date">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="estimatedDate" type="date" value={form.estimatedDate} onChange={(e) => setForm({ ...form, estimatedDate: e.target.value })} className="pl-9" />
                    </div>
                  </Field>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <h3 className="text-sm font-semibold">Items</h3>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1.5"><Plus className="w-4 h-4" /> Add Item</Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {items.length === 0 && (
                  <EmptyState
                    icons={[<Package key="d1" className="w-6 h-6" />, <ClipboardList key="d2" className="w-6 h-6" />, <FileText key="d3" className="w-6 h-6" />]}
                    title="No items yet"
                    description='Click "Add Item" to add products to this delivery'
                    size="sm"
                  />
                )}
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-end gap-3 p-3 rounded-lg border border-border bg-surface/50">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[11px]">Product</Label>
                      <Select
                        options={products.map(p => ({ value: p.id, label: `${p.name} (${(p as any).sku || ""})` }))}
                        placeholder="Select product"
                        value={item.productId}
                        onChange={(e: any) => updateItem(idx, "productId", e.target.value)}
                      />
                    </div>
                    <div className="w-20 space-y-1">
                      <Label className="text-[11px]">Qty</Label>
                      <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)} className="text-center" />
                    </div>
                    <div className="w-28 space-y-1">
                      <Label className="text-[11px]">Unit Price</Label>
                      <Input type="number" min="0" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)} className="text-right font-mono" />
                    </div>
                    <div className="w-24 space-y-1">
                      <Label className="text-[11px]">Total</Label>
                      <div className="h-9 flex items-center justify-end text-sm font-mono font-medium px-2 rounded border border-transparent bg-background">
                        ฿{(item.quantity * item.unitPrice).toLocaleString()}
                      </div>
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
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Delivery notes, special instructions..." rows={3} />
              </CardContent>
            </Card>
          </div>
          <div className="col-span-4 flex flex-col gap-4">
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" loading={loading}>Create Delivery</Button>
        </div>
      </form>
    </div>
  )
}
