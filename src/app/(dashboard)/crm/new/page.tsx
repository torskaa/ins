"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { User, XCircle } from "lucide-react"

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

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
    <div className="animate-fade-in pb-28">
      <div className="page-header mb-5">
        <h1>Add Customer</h1>
        <p>Create a new customer record</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-semibold">Customer Information</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field id="name" label="Name" required>
                    <Input id="name" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
                  </Field>
                  <Field id="company" label="Company">
                    <Input id="company" value={form.company} onChange={(e) => setForm({...form, company: e.target.value})} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field id="email" label="Email">
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
                  </Field>
                  <Field id="phone" label="Phone">
                    <Input id="phone" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
                  </Field>
                </div>
                <Field id="address" label="Address">
                  <Textarea id="address" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} />
                </Field>
                <Field id="taxId" label="Tax ID">
                  <Input id="taxId" value={form.taxId} onChange={(e) => setForm({...form, taxId: e.target.value})} />
                </Field>
                <Field id="notes" label="Notes">
                  <Textarea id="notes" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
                </Field>
              </CardContent>
            </Card>
            <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
              <Button type="submit" loading={loading}>Create Customer</Button>
              <Button type="button" variant="secondary" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
            </div>
          </div>
          <div className="col-span-4 flex flex-col gap-4" />
        </div>
      </form>
    </div>
  )
}
