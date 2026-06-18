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
import { cn } from "@/lib/utils"
import { ArrowLeft, Building2, Calendar, FileText, Hash, Mail, MapPin, MessageSquare, Phone, User, XCircle } from "lucide-react"

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

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
    <div className="animate-fade-in pb-28">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
      >
        Back
      </button>

      <div className="page-header mb-5">
        <h1>New Distributor</h1>
        <p>Add a new distributor to your network</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm font-semibold">Basic Info</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field id="name" label="Name" required>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bangkok Distribution" className="pl-9" required />
                    </div>
                  </Field>
                  <Field id="status" label="Status">
                    <Select id="status" options={STATUS_OPTIONS} value={form.status} onChange={(e: any) => setForm({ ...form, status: e.target.value })} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field id="territory" label="Territory">
                    <Input id="territory" value={form.territory} onChange={(e) => setForm({ ...form, territory: e.target.value })} placeholder="e.g. Bangkok" className="pl-9" />
                  </Field>
                  <Field id="route" label="Route">
                    <Input id="route" value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} placeholder="e.g. BKK-01" className="pl-9" />
                  </Field>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-semibold">Contact Details</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field id="contactPerson" label="Contact Person">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="contactPerson" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="Full name" className="pl-9" />
                    </div>
                  </Field>
                  <Field id="taxId" label="Tax ID">
                    <Input id="taxId" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} placeholder="Tax ID" className="pl-9" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field id="email" label="Email">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@distributor.com" className="pl-9" />
                    </div>
                  </Field>
                  <Field id="phone" label="Phone">
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+66 81 234 5678" className="pl-9" />
                    </div>
                  </Field>
                </div>
                <Field id="address" label="Address">
                  <div className="relative">
                    <Textarea id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, district, city, postal code" rows={3} className="pl-9" />
                  </div>
                </Field>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
              <Button type="submit" loading={loading}>Create Distributor</Button>
            </div>
          </div>

          <div className="col-span-4 flex flex-col gap-4">
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-semibold">Contract & Notes</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <Field id="contractStart" label="Contract Start">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="contractStart" type="date" value={form.contractStart} onChange={(e) => setForm({ ...form, contractStart: e.target.value })} className="pl-9" />
                    </div>
                  </Field>
                  <Field id="contractEnd" label="Contract End">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="contractEnd" type="date" value={form.contractEnd} onChange={(e) => setForm({ ...form, contractEnd: e.target.value })} className="pl-9" />
                    </div>
                  </Field>
                </div>
                <Field id="notes" label="Notes">
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes..." rows={4} className="pl-9" />
                  </div>
                </Field>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
