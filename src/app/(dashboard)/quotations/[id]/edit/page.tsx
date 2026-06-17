"use client"

import { useState, useEffect, type ReactNode } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { SkeletonForm } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { XCircle, FileText } from "lucide-react"

export default function EditQuotationPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [form, setForm] = useState({ status: "draft", validUntil: "", notes: "" })

  useEffect(() => {
    fetch(`/api/quotations/${params.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { toast.error("Quotation not found"); router.push("/quotations"); return }
        setForm({
          status: d.status || "draft",
          validUntil: d.validUntil ? d.validUntil.split("T")[0] : "",
          notes: d.notes || "",
        })
      })
      .finally(() => setFetching(false))
  }, [params.id, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/quotations/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success("Quotation updated")
      router.push(`/quotations/${params.id}`)
      router.refresh()
    } catch { toast.error("Failed to update") }
    finally { setLoading(false) }
  }

  if (fetching) return <SkeletonForm fields={5} />

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
        <div className="page-header"><h1>Edit Quotation</h1><p>Update quotation details</p></div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-semibold">Quotation Info</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Field label="Status">
                  <select className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </Field>
                <Field id="validUntil" label="Valid Until">
                  <Input id="validUntil" type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
                </Field>
                <Field id="notes" label="Notes">
                  <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
                </Field>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-4 space-y-4" />
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" loading={loading}>Update Quotation</Button>
        </div>
      </form>
    </div>
  )
}
