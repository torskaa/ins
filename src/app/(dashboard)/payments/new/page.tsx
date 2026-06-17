"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Banknote, XCircle, FileText, ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

const METHOD_OPTIONS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "cheque", label: "Cheque" },
]

export default function NewPaymentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [invoices, setInvoices] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [form, setForm] = useState({ amount: "", method: "bank_transfer", reference: "", date: new Date().toISOString().split("T")[0], notes: "", invoiceId: "", orderId: "" })

  useEffect(() => {
    Promise.all([
      fetch("/api/invoices").then(r => r.json()),
      fetch("/api/orders").then(r => r.json()),
    ]).then(([inv, ord]) => {
      if (Array.isArray(inv)) setInvoices(inv)
      if (Array.isArray(ord)) setOrders(ord)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error("Valid amount is required"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          method: form.method,
          reference: form.reference || null,
          date: form.date || undefined,
          notes: form.notes || null,
          invoiceId: form.invoiceId || null,
          orderId: form.orderId || null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Payment recorded")
      router.push("/payments")
      router.refresh()
    } catch { toast.error("Failed to record payment") }
    finally { setLoading(false) }
  }

  return (
    <div className="animate-fade-in pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">Back</button>
      <div className="page-header mb-5"><h1>Record Payment</h1></div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Banknote className="w-4 h-4 text-primary" />
                  Payment Details
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Amount" required>
                    <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                  </Field>
                  <Field label="Method">
                    <Select options={METHOD_OPTIONS} value={form.method} onChange={(e: any) => setForm({ ...form, method: e.target.value })} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Reference">
                    <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="e.g. TRANS-001" />
                  </Field>
                  <Field label="Date">
                    <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </Field>
                </div>
                <Field label="Notes">
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </Field>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-4 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShoppingCart className="w-4 h-4 text-primary" />
                  Related Documents
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Field label="Invoice (optional)">
                  <Select options={invoices.map(i => ({ value: i.id, label: `${i.number} - ${i.customer?.name}` }))} placeholder="Select invoice" value={form.invoiceId} onChange={(e: any) => setForm({ ...form, invoiceId: e.target.value })} />
                </Field>
                <Field label="Order (optional)">
                  <Select options={orders.map(o => ({ value: o.id, label: `${o.number} - ${o.customer?.name || o.supplier?.name}` }))} placeholder="Select order" value={form.orderId} onChange={(e: any) => setForm({ ...form, orderId: e.target.value })} />
                </Field>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" loading={loading}>Record Payment</Button>
        </div>
      </form>
    </div>
  )
}
