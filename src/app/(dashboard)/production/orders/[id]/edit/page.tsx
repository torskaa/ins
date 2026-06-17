"use client"

import { useState, useEffect, type ReactNode } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { toast } from "sonner"
import { SkeletonForm } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { XCircle, ClipboardList } from "lucide-react"

export default function EditProductionOrderPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [form, setForm] = useState({ number: "", productId: "", bomId: "", quantity: "1", startDate: "", dueDate: "", notes: "", warehouseId: "", status: "" })

  useEffect(() => {
    Promise.all([
      fetch(`/api/production-orders/${params.id}`).then(r => r.json()),
    ]).then(([order]) => {
      if (order.error) { toast.error("Order not found"); router.push("/production/orders"); return }
      setForm({
        number: order.number || "",
        productId: order.productId || "",
        bomId: order.bomId || "",
        quantity: String(order.quantity || 1),
        startDate: order.startDate ? order.startDate.split("T")[0] : "",
        dueDate: order.dueDate ? order.dueDate.split("T")[0] : "",
        notes: order.notes || "",
        warehouseId: order.warehouse?.id || "",
        status: order.status || "draft",
      })
    }).finally(() => setInitialLoading(false))
  }, [params.id, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.number || !form.productId) { toast.error("Order number and product are required"); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/production-orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: parseInt(form.quantity) || 1,
          startDate: form.startDate || null,
          dueDate: form.dueDate || null,
          warehouseId: form.warehouseId || null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Production order updated")
      router.push(`/production/orders/${params.id}`)
      router.refresh()
    } catch { toast.error("Failed to update") }
    finally { setLoading(false) }
  }

  if (initialLoading) return <SkeletonForm fields={5} />

  const Field = ({ id, label, required, children, className }: { id?: string; label: ReactNode; required?: boolean; children: ReactNode; className?: string }) => (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      {children}
    </div>
  )

  return (
    <div className="animate-fade-in pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        Back
      </button>
      <div className="mb-5">
        <div className="page-header"><h1>Edit Production Order</h1><p>Update order details</p></div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  <span className="text-sm font-semibold">Order Info</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field id="number" label="Order Number" required>
                    <Input id="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="pl-9" required />
                  </Field>
                  <Field label="Product">
                    <Input value={form.productId} disabled className="bg-muted" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field id="quantity" label="Quantity">
                    <Input id="quantity" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
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
          <div className="col-span-4 space-y-4" />
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" loading={loading}>Update Order</Button>
        </div>
      </form>
    </div>
  )
}
