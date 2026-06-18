"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { SkeletonForm } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Percent, XCircle } from "lucide-react"

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

export default function EditTaxRatePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [form, setForm] = useState({ name: "", rate: "0", type: "vat", isDefault: false })

  useEffect(() => {
    fetch(`/api/tax-rates/${id}`).then(r => r.json()).then(d => {
      if (d.error) { toast.error("Not found"); router.push("/tax-rates"); return }
      setForm({ name: d.name || "", rate: String(d.rate || 0), type: d.type || "vat", isDefault: d.isDefault || false })
    }).finally(() => setFetching(false))
  }, [id, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { toast.error("Name is required"); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/tax-rates/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, rate: parseFloat(form.rate) }) })
      if (!res.ok) throw new Error()
      toast.success("Tax rate updated"); router.push("/tax-rates"); router.refresh()
    } catch { toast.error("Failed to update") } finally { setSaving(false) }
  }

  if (fetching) return <SkeletonForm fields={4} />

  return (
    <div className="animate-fade-in pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">Back</button>
      <div className="page-header mb-5"><h1>Edit Tax Rate</h1><p>{form.name}</p></div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  <h3 className="text-sm font-semibold">Tax Details</h3>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field id="name" label="Name" required>
                    <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </Field>
                  <Field id="rate" label="Rate (%)">
                    <Input id="rate" type="number" min="0" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
                  </Field>
                </div>
                <Field id="type" label="Type">
                  <Select id="type" options={[{ value: "vat", label: "VAT" }, { value: "withholding", label: "Withholding Tax" }, { value: "other", label: "Other" }]} value={form.type} onChange={(e: any) => setForm({ ...form, type: e.target.value })} />
                </Field>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="rounded border-border" />
                  <span className="text-sm">Default</span>
                </label>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-4 flex flex-col gap-4">
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" loading={saving}>Update Tax Rate</Button>
        </div>
      </form>
    </div>
  )
}
