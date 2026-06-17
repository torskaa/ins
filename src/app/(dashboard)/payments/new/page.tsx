"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Banknote, XCircle } from "lucide-react"
import { toast } from "sonner"

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
 <div className="animate-fade-in max-w-2xl">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
 Back
 </button>
 <div className="page-header"><h1>Record Payment</h1></div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader><CardTitle className="flex items-center gap-2"><Banknote className="w-4 h-4" /> Payment Details</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="amount">Amount <span className="text-destructive">*</span></Label>
 <Input id="amount" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
 </div>
 <div className="space-y-2">
 <Label htmlFor="method">Method</Label>
 <Select id="method" options={[
 { value: "bank_transfer", label: "Bank Transfer" },
 { value: "cash", label: "Cash" },
 { value: "credit_card", label: "Credit Card" },
 { value: "cheque", label: "Cheque" },
 ]} value={form.method} onChange={(e: any) => setForm({ ...form, method: e.target.value })} />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="reference">Reference</Label>
 <Input id="reference" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="e.g. TRANS-001" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="date">Date</Label>
 <Input id="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="invoiceId">Link to Invoice (optional)</Label>
 <Select id="invoiceId" options={invoices.map(i => ({ value: i.id, label: `${i.number} - ${i.customer?.name}` }))} placeholder="Select invoice" value={form.invoiceId} onChange={(e: any) => setForm({ ...form, invoiceId: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="orderId">Link to Order (optional)</Label>
 <Select id="orderId" options={orders.map(o => ({ value: o.id, label: `${o.number} - ${o.customer?.name || o.supplier?.name}` }))} placeholder="Select order" value={form.orderId} onChange={(e: any) => setForm({ ...form, orderId: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="notes">Notes</Label>
 <Input id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
 </div>
 </CardContent>
 </Card>
 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
 <Button type="submit" loading={loading}>Record Payment</Button>
 </div>
 </form>
 </div>
 )
}
