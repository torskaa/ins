"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function NewCustomerPage() {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [form, setForm] = useState({
 name: "", email: "", phone: "", company: "", address: "", taxId: "", notes: "",
 })

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 setLoading(true)
 try {
 const res = await fetch("/api/customers", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(form),
 })
 if (!res.ok) throw new Error()
 toast.success("Customer created")
 router.push("/crm")
 router.refresh()
 } catch {
 toast.error("Failed to create customer")
 } finally {
 setLoading(false)
 }
 }

 return (
 <div className="animate-fade-in max-w-2xl">
 <div className="page-header">
 <h1>Add Customer</h1>
 <p>Create a new customer record</p>
 </div>
 <form onSubmit={handleSubmit}>
 <Card>
 <CardHeader><CardTitle>Customer Information</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="name">Name *</Label>
 <Input id="name" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="company">Company</Label>
 <Input id="company" value={form.company} onChange={(e) => setForm({...form, company: e.target.value})} />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="email">Email</Label>
 <Input id="email" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="phone">Phone</Label>
 <Input id="phone" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="address">Address</Label>
 <Textarea id="address" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="taxId">Tax ID</Label>
 <Input id="taxId" value={form.taxId} onChange={(e) => setForm({...form, taxId: e.target.value})} />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="notes">Notes</Label>
 <Textarea id="notes" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
 </div>
 <div className="flex items-center gap-3 pt-4">
 <Button type="submit" loading={loading}>Create Customer</Button>
 <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
 </div>
 </CardContent>
 </Card>
 </form>
 </div>
 )
}
