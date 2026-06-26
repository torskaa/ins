"use client"

import { useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Select } from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AlertTriangle, XCircle, ClipboardList, Package, Cog, Beaker, Play } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

type Product = { id: string; name: string; sku: string }
type BOM = { id: string; finishedGoodId: string; version: string; status: string }
type Warehouse = { id: string; name: string }
type WorkCenter = { id: string; name: string; code: string }

export default function NewProductionOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [boms, setBoms] = useState<BOM[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([])

  const [form, setForm] = useState({ number: "", productId: "", bomId: "", quantity: "1", startDate: "", dueDate: "", notes: "", warehouseId: "" })
  const [materials, setMaterials] = useState<Array<{ productId: string; quantityNeeded: string }>>([])
  const [operations, setOperations] = useState<Array<{ name: string; workCenterId: string; setupTime: string; runTime: string }>>([])

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then(r => r.json()).catch((err) => { setError(err.message); setLoading(false); return [] }),
      fetch("/api/bill-of-materials").then(r => r.json()).catch((err) => { setError(err.message); setLoading(false); return [] }),
      fetch("/api/warehouses").then(r => r.json()).catch((err) => { setError(err.message); setLoading(false); return [] }),
      fetch("/api/work-centers").then(r => r.json()).catch((err) => { setError(err.message); setLoading(false); return [] }),
    ]).then(([p, b, w, wc]) => {
      setProducts(Array.isArray(p) ? p : [])
      setBoms(Array.isArray(b) ? b : [])
      setWarehouses(Array.isArray(w) ? w : [])
      setWorkCenters(Array.isArray(wc) ? wc : [])
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.number || !form.productId) { toast.error("Order number and product are required"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/production-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: parseInt(form.quantity) || 1,
          startDate: form.startDate || null,
          dueDate: form.dueDate || null,
          warehouseId: form.warehouseId || null,
          materials: materials.filter(m => m.productId).map(m => ({ productId: m.productId, quantityNeeded: parseInt(m.quantityNeeded) || 1 })),
          operations: operations.filter(o => o.name).map((o, i) => ({ ...o, sequence: i + 1, setupTime: parseInt(o.setupTime) || 0, runTime: parseInt(o.runTime) || 0 })),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Production order created")
      router.push("/production/orders")
      router.refresh()
    } catch { toast.error("Failed to create") }
    finally { setLoading(false) }
  }

  function addMaterial() { setMaterials([...materials, { productId: "", quantityNeeded: "1" }]) }
  function addOperation() { setOperations([...operations, { name: "", workCenterId: "", setupTime: "0", runTime: "0" }]) }

  const Field = ({ id, label, required, children, className }: { id?: string; label: ReactNode; required?: boolean; children: ReactNode; className?: string }) => (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      {children}
    </div>
  )

  if (error) return (
    <div className="animate-fade-in pb-8 space-y-4">
      <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
    </div>
  )
  return (
    <div className="animate-fade-in pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        Back
      </button>
      <div className="mb-5">
        <div className="page-header"><h1>New Production Order</h1><p>Create a manufacturing order</p></div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  <span className="text-sm font-semibold">Order Info</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field id="number" label="Order Number" required>
                    <Input id="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="e.g. MO-2401-001" className="pl-9" required />
                  </Field>
                  <Field id="productId" label="Product" required>
                    <Select id="productId" options={products.map(p => ({ value: p.id, label: `${p.name} (${p.sku})` }))} placeholder="Select product" value={form.productId} onChange={(e: any) => setForm({ ...form, productId: e.target.value })} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field id="bomId" label="BOM (optional)">
                    <Select id="bomId" options={boms.map(b => ({ value: b.id, label: `v${b.version} ${b.status}` }))} placeholder="Select BOM" value={form.bomId} onChange={(e: any) => setForm({ ...form, bomId: e.target.value })} />
                  </Field>
                  <Field id="quantity" label="Quantity">
                    <Input id="quantity" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field id="warehouseId" label="Warehouse">
                    <Select id="warehouseId" options={warehouses.map(w => ({ value: w.id, label: w.name }))} placeholder="Select warehouse" value={form.warehouseId} onChange={(e: any) => setForm({ ...form, warehouseId: e.target.value })} />
                  </Field>
                  <Field id="startDate" label="Start Date">
                    <Input id="startDate" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                  </Field>
                </div>
                <Field id="dueDate" label="Due Date">
                  <Input id="dueDate" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </Field>
                <Field id="notes" label="Notes">
                  <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
                </Field>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-4 flex flex-col gap-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span className="text-sm font-semibold">Materials</span>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addMaterial} className="gap-1">Add</Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {materials.length === 0 && <EmptyState icons={[<Package key="nm1" className="w-6 h-6" />, <Beaker key="nm2" className="w-6 h-6" />, <ClipboardList key="nm3" className="w-6 h-6" />]} title="No materials added yet" description="Add materials required for this production order" size="sm" />}
                {materials.map((m, i) => (
                  <div key={i} className="flex items-end gap-3">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Product</Label>
                      <Select options={products.map(p => ({ value: p.id, label: `${p.name} (${p.sku})` }))} placeholder="Select product" value={m.productId} onChange={(e: any) => { const a = [...materials]; a[i].productId = e.target.value; setMaterials(a) }} />
                    </div>
                    <div className="w-28 space-y-1">
                      <Label className="text-xs">Qty Needed</Label>
                      <Input type="number" min="1" value={m.quantityNeeded} onChange={(e) => { const a = [...materials]; a[i].quantityNeeded = e.target.value; setMaterials(a) }} />
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="mb-0.5" onClick={() => setMaterials(materials.filter((_, j) => j !== i))}></Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs flex-col items-start gap-1 px-3 py-2 text-left" side="bottom">
                        <p className="text-sm font-medium">Remove material</p>
                        <p className="text-background/70 text-xs leading-snug">
                          Remove this material from the production order
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cog className="w-4 h-4" />
                    <span className="text-sm font-semibold">Operations</span>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addOperation} className="gap-1">Add</Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {operations.length === 0 && <EmptyState icons={[<Cog key="no1" className="w-6 h-6" />, <Play key="no2" className="w-6 h-6" />, <ClipboardList key="no3" className="w-6 h-6" />]} title="No operations added yet" description="Add operations for this production order" size="sm" />}
                {operations.map((o, i) => (
                  <div key={i} className="flex items-end gap-3">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Operation</Label>
                      <Input value={o.name} onChange={(e) => { const a = [...operations]; a[i].name = e.target.value; setOperations(a) }} placeholder="e.g. Cut" />
                    </div>
                    <div className="w-44 space-y-1">
                      <Label className="text-xs">Work Center</Label>
                      <Select options={workCenters.map(w => ({ value: w.id, label: `${w.code} - ${w.name}` }))} placeholder="Select" value={o.workCenterId} onChange={(e: any) => { const a = [...operations]; a[i].workCenterId = e.target.value; setOperations(a) }} />
                    </div>
                    <div className="w-24 space-y-1">
                      <Label className="text-xs">Setup (min)</Label>
                      <Input type="number" min="0" value={o.setupTime} onChange={(e) => { const a = [...operations]; a[i].setupTime = e.target.value; setOperations(a) }} />
                    </div>
                    <div className="w-24 space-y-1">
                      <Label className="text-xs">Run (min)</Label>
                      <Input type="number" min="0" value={o.runTime} onChange={(e) => { const a = [...operations]; a[i].runTime = e.target.value; setOperations(a) }} />
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="mb-0.5" onClick={() => setOperations(operations.filter((_, j) => j !== i))}></Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs flex-col items-start gap-1 px-3 py-2 text-left" side="bottom">
                        <p className="text-sm font-medium">Remove operation</p>
                        <p className="text-background/70 text-xs leading-snug">
                          Remove this operation from the production order
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" loading={loading}>Create Production Order</Button>
        </div>
      </form>
    </div>
  )
}
