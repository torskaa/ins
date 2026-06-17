"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"
import { SkeletonForm } from "@/components/ui/skeleton"
import { XCircle } from "lucide-react"

export default function EditInvoicePage() {
 const router = useRouter()
 const params = useParams()
 const [loading, setLoading] = useState(false)
 const [fetching, setFetching] = useState(true)
 const [form, setForm] = useState({ status: "", issueDate: "", dueDate: "", notes: "" })

 useEffect(() => {
 fetch(`/api/invoices/${params.id}`)
 .then(r => r.json())
 .then(d => {
 if (d.error) { toast.error("Invoice not found"); router.push("/invoices"); return }
 setForm({
 status: d.status || "draft",
 issueDate: d.issueDate ? d.issueDate.split("T")[0] : "",
 dueDate: d.dueDate ? d.dueDate.split("T")[0] : "",
 notes: d.notes || "",
 })
 })
 .finally(() => setFetching(false))
 }, [params.id, router])

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 setLoading(true)
 try {
 const res = await fetch(`/api/invoices/${params.id}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(form),
 })
 if (!res.ok) throw new Error()
 toast.success("Invoice updated")
 router.push(`/invoices/${params.id}`)
 router.refresh()
 } catch { toast.error("Failed to update") }
 finally { setLoading(false) }
 }

 if (fetching) return <SkeletonForm fields={5} />

 return (
 <div className="animate-fade-in max-w-2xl">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
 Back
 </button>
 <div className="page-header"><h1>Edit Invoice</h1><p>Update invoice details</p></div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader><CardTitle>Invoice Info</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="issueDate">Issue Date</Label>
 <Input id="issueDate" type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="dueDate">Due Date</Label>
 <Input id="dueDate" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
 </div>
 </div>
 <div className="space-y-2">
 <Label>Status</Label>
 <select className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
 <option value="draft">Draft</option>
 <option value="sent">Sent</option>
 <option value="paid">Paid</option>
 <option value="cancelled">Cancelled</option>
 </select>
 </div>
 <div className="space-y-2">
 <Label htmlFor="notes">Notes</Label>
 <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
 </div>
 </CardContent>
 </Card>
 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
 <Button type="submit" loading={loading}>Update Invoice</Button>
 </div>
 </form>
 </div>
 )
}
