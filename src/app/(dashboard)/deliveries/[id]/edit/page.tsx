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
import { Truck, MapPin, FileText, Building2, Calendar, Save, Warehouse, XCircle } from "lucide-react"
import { SkeletonForm } from "@/components/ui/skeleton"

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "packing", label: "Packing" },
  { value: "shipped", label: "Shipped" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
]

type SelectOption = { id: string; name: string }

export default function EditDeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [distributors, setDistributors] = useState<SelectOption[]>([])
  const [warehouses, setWarehouses] = useState<SelectOption[]>([])

  const [form, setForm] = useState({
    number: "", status: "draft", carrier: "", trackingNumber: "",
    estimatedDate: "", notes: "", origin: "", destination: "",
    distributorId: "", warehouseId: "",
  })

  useEffect(() => {
    Promise.all([
      fetch("/api/deliveries/" + id).then(r => r.json()),
      fetch("/api/distributors").then(r => r.json()),
      fetch("/api/warehouses").then(r => r.json()),
    ]).then(([del, dists, whs]) => {
      setDistributors(Array.isArray(dists) ? dists : [])
      setWarehouses(Array.isArray(whs) ? whs : [])
      setForm({
        number: del.number || "",
        status: del.status || "draft",
        carrier: del.carrier || "",
        trackingNumber: del.trackingNumber || "",
        estimatedDate: del.estimatedDate ? del.estimatedDate.split("T")[0] : "",
        notes: del.notes || "",
        origin: del.origin || "",
        destination: del.destination || "",
        distributorId: del.distributorId || "",
        warehouseId: del.warehouseId || "",
      })
    }).finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.distributorId) { toast.error("Distributor is required"); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/deliveries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success("Delivery updated")
      router.push(`/deliveries/${id}`)
      router.refresh()
    } catch {
      toast.error("Failed to update delivery")
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
        <h1>Edit Delivery</h1>
        <p>Update delivery information</p>
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
                    <Input id="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="font-mono" />
                  </Field>
                  <Field id="status" label="Status">
                    <Select id="status" options={STATUS_OPTIONS} value={form.status} onChange={(e: any) => setForm({ ...form, status: e.target.value })} />
                  </Field>
                  <Field id="carrier" label="Carrier">
                    <Input id="carrier" value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} />
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
                    <Input id="origin" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} />
                  </Field>
                  <Field id="destination" label="Destination">
                    <Input id="destination" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field id="trackingNumber" label="Tracking Number">
                    <Input id="trackingNumber" value={form.trackingNumber} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} />
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
