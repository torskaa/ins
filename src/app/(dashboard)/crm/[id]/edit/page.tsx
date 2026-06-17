"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { SkeletonForm } from "@/components/ui/skeleton"

export default function EditCustomerPage() {
 const router = useRouter()
 const params = useParams()
 const [loading, setLoading] = useState(false)
 const [fetching, setFetching] = useState(true)
 const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", address: "", taxId: "", creditLimit: "", notes: "" })

 useEffect(() => {
 fetch(`/api/customers/${params.id}`).then(r => r.json()).then(d => {
 if (d.error) { toast.error("Customer not found"); router.push("/crm"); return }
 setForm({
 name: d.name || "",
 company: d.company || "",
 email: d.email || "",
 phone: d.phone || "",
 address: d.address || "",
 taxId: d.taxId || "",
 creditLimit: d.creditLimit ? String(d.creditLimit) : "",
 notes: d.notes || "",
 })
 }).finally(() => setFetching(false))
 }, [params.id, router])

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!form.name) { toast.error("Name is required"); return }
 setLoading(true)
 try {
 const res = await fetch(`/api/customers/${params.id}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 ...form,
 creditLimit: form.creditLimit ? parseFloat(form.creditLimit) : null,
 }),
 })
 if (!res.ok) throw new Error()
 toast.success("Customer updated")
 router.push(`/crm/${params.id}`)
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
 <div className="page-header"><h1>Edit Customer</h1><p>Update customer information</p></div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader><CardTitle>Customer Info</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
 <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
 </div>
 <div className="space-y-2">
 <Label htmlFor="company">Company</Label>
 <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="email">Email</Label>
 <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="phone">Phone</Label>
 <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="address">Address</Label>
 <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="taxId">Tax ID</Label>
 <Input id="taxId" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="creditLimit">Credit Limit (฿)</Label>
 <Input id="creditLimit" type="number" min="0" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="notes">Notes</Label>
 <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
 </div>
 </CardContent>
 </Card>
 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
 <Button type="submit" loading={loading}>Update Customer</Button>
 </div>
 </form>
 </div>
 )
}
