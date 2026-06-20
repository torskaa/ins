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
import { z } from "zod"
import { useFormValidation } from "@/hooks/use-form-validation"

const paymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  method: z.string().min(1, "Method is required"),
  reference: z.string().optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
  invoiceId: z.string().optional(),
  orderId: z.string().optional(),
})

const Field = ({ id, label, required, children, error, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; error?: string; className?: string }) => (
  <div className={cn("space-y-1", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
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
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useFormValidation(paymentSchema, {
    defaultValues: { date: new Date().toISOString().split("T")[0], method: "bank_transfer" },
  })
  const [loading, setLoading] = useState(false)
  const [invoices, setInvoices] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      fetch("/api/invoices").then(r => r.json()),
      fetch("/api/orders").then(r => r.json()),
    ]).then(([inv, ord]) => {
      if (Array.isArray(inv)) setInvoices(inv)
      if (Array.isArray(ord)) setOrders(ord)
    })
  }, [])

  async function onSubmit(data: any) {
    setLoading(true)
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: data.amount,
          method: data.method,
          reference: data.reference || null,
          date: data.date || undefined,
          notes: data.notes || null,
          invoiceId: data.invoiceId || null,
          orderId: data.orderId || null,
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Banknote className="w-4 h-4 text-primary" />
                  Payment Details
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Amount" required error={errors.amount?.message}>
                    <Input type="number" min="0" step="0.01" {...register("amount")} />
                  </Field>
                  <Field label="Method" error={errors.method?.message}>
                    <Select options={METHOD_OPTIONS} value={watch("method")} onChange={(e: any) => setValue("method", e.target.value, { shouldValidate: true })} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Reference" error={errors.reference?.message}>
                    <Input {...register("reference")} placeholder="e.g. TRANS-001" />
                  </Field>
                  <Field label="Date" error={errors.date?.message}>
                    <Input type="date" {...register("date")} />
                  </Field>
                </div>
                <Field label="Notes" error={errors.notes?.message}>
                  <Input {...register("notes")} />
                </Field>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-4 flex flex-col gap-4">
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShoppingCart className="w-4 h-4 text-primary" />
                  Related Documents
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Field label="Invoice (optional)" error={errors.invoiceId?.message}>
                  <Select options={invoices.map(i => ({ value: i.id, label: `${i.number} - ${i.customer?.name}` }))} placeholder="Select invoice" value={watch("invoiceId")} onChange={(e: any) => setValue("invoiceId", e.target.value)} />
                </Field>
                <Field label="Order (optional)" error={errors.orderId?.message}>
                  <Select options={orders.map(o => ({ value: o.id, label: `${o.number} - ${o.customer?.name || o.supplier?.name}` }))} placeholder="Select order" value={watch("orderId")} onChange={(e: any) => setValue("orderId", e.target.value)} />
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
