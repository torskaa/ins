"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
 ArrowLeft, Building2, User, MapPin, Phone, Mail,
 FileText, Hash, Calendar, MessageSquare,
} from "lucide-react"

const STATUS_OPTIONS = [
 { value: "active", label: "Active" },
 { value: "inactive", label: "Inactive" },
 { value: "suspended", label: "Suspended" },
]

export default function NewDistributorPage() {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [form, setForm] = useState({
 name: "", email: "", phone: "", address: "", taxId: "",
 contactPerson: "", territory: "", route: "",
 contractStart: "", contractEnd: "", status: "active", notes: "",
 })

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!form.name) { toast.error("Distributor name is required"); return }
 setLoading(true)
 try {
 const res = await fetch("/api/distributors", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(form),
 })
 if (!res.ok) throw new Error()
 toast.success("Distributor created")
 router.push("/distributors")
 router.refresh()
 } catch {
 toast.error("Failed to create distributor")
 } finally {
 setLoading(false)
 }
 }

 return (
 <div className="animate-fade-in max-w-3xl pb-28">
 <button
 onClick={() => router.back()}
 className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
 >
 Back
 </button>

 <div className="page-header">
 <h1>New Distributor</h1>
 <p>Add a new distributor to your network</p>
 </div>

 <form onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader className="pb-3"><h3 className="text-sm font-semibold">Basic Info</h3></CardHeader>
 <CardContent className="space-y-4 pt-0">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
 <div className="relative">
 <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bangkok Distribution" className="pl-9" required />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="status">Status</Label>
 <Select id="status" options={STATUS_OPTIONS} value={form.status} onChange={(e: any) => setForm({ ...form, status: e.target.value })} />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="territory">Territory</Label>
 <div className="relative">
 <Input id="territory" value={form.territory} onChange={(e) => setForm({ ...form, territory: e.target.value })} placeholder="e.g. Bangkok" className="pl-9" />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="route">Route</Label>
 <div className="relative">
 <Input id="route" value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} placeholder="e.g. BKK-01" className="pl-9" />
 </div>
 </div>
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-3"><h3 className="text-sm font-semibold">Contact Details</h3></CardHeader>
 <CardContent className="space-y-4 pt-0">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="contactPerson">Contact Person</Label>
 <div className="relative">
 <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input id="contactPerson" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="Full name" className="pl-9" />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="taxId">Tax ID</Label>
 <div className="relative">
 <Input id="taxId" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} placeholder="Tax ID" className="pl-9" />
 </div>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="email">Email</Label>
 <div className="relative">
 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@distributor.com" className="pl-9" />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="phone">Phone</Label>
 <div className="relative">
 <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+66 81 234 5678" className="pl-9" />
 </div>
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="address">Address</Label>
 <div className="relative">
 <Textarea id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, district, city, postal code" rows={3} className="pl-9" />
 </div>
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-3"><h3 className="text-sm font-semibold">Contract & Notes</h3></CardHeader>
 <CardContent className="space-y-4 pt-0">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="contractStart">Contract Start</Label>
 <div className="relative">
 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input id="contractStart" type="date" value={form.contractStart} onChange={(e) => setForm({ ...form, contractStart: e.target.value })} className="pl-9" />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="contractEnd">Contract End</Label>
 <div className="relative">
 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input id="contractEnd" type="date" value={form.contractEnd} onChange={(e) => setForm({ ...form, contractEnd: e.target.value })} className="pl-9" />
 </div>
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="notes">Notes</Label>
 <div className="relative">
 <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
 <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes..." rows={4} className="pl-9" />
 </div>
 </div>
 </CardContent>
 </Card>

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
 <Button type="submit" loading={loading}>Create Distributor</Button>
 </div>
 </form>
 </div>
 )
}
