"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Building2, Calendar, DollarSign, Globe, Mail, Phone, Save, Search, Upload, User, XCircle } from "lucide-react"
import { toast } from "sonner"
import { SkeletonForm } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const PAYMENT_TERMS = [
  { value: "net15", label: "Net 15" },
  { value: "net30", label: "Net 30" },
  { value: "net45", label: "Net 45" },
  { value: "net60", label: "Net 60" },
  { value: "cod", label: "Cash on Delivery" },
  { value: "advance", label: "Advance Payment" },
]

const CURRENCIES = [
  { value: "THB", label: "THB (฿)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "JPY", label: "JPY (¥)" },
  { value: "CNY", label: "CNY (¥)" },
  { value: "SGD", label: "SGD (S$)" },
  { value: "MYR", label: "MYR (RM)" },
]

const RATINGS = [
  { value: "active", label: "Active" },
  { value: "preferred", label: "Preferred" },
  { value: "inactive", label: "Inactive" },
  { value: "blacklisted", label: "Blacklisted" },
]

const CHANNELS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "line", label: "Line" },
  { value: "whatsapp", label: "WhatsApp" },
]

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

export default function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  useEffect(() => {
    if (!id) return
    fetch(`/api/suppliers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          taxId: data.taxId || "",
          contactPerson: data.contactPerson || "",
          contactPersonRole: data.contactPersonRole || "",
          preferredChannel: data.preferredChannel || "",
          website: data.website || "",
          paymentTerms: data.paymentTerms || "",
          currency: data.currency || "THB",
          rating: data.rating || "active",
          defaultLeadTime: String(data.defaultLeadTime || ""),
          notes: data.notes || "",
          documents: data.documents || [],
        })
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Supplier updated")
      router.push(`/suppliers/${id}`)
      router.refresh()
    } catch {
      toast.error("Failed to update supplier")
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        handleSubmit(e as any)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [form, id])

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const docs = files.map((f) => ({ name: f.name, size: f.size, type: f.type }))
    setForm({ ...form, documents: [...(form.documents || []), ...docs] })
  }

  function removeDoc(i: number) {
    const docs = [...(form.documents || [])]
    docs.splice(i, 1)
    setForm({ ...form, documents: docs })
  }

  if (loading) return <div className="animate-fade-in pb-28"><SkeletonForm fields={8} /></div>

  return (
    <div className="animate-fade-in pb-28">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        Back
      </button>

      <div className="page-header mb-5">
        <h1>Edit Supplier</h1>
        <p>Update supplier information</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Company Info</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Field id="name" label="Company Name" required>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="name" className="pl-9" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field id="taxId" label="Tax ID">
                    <Input id="taxId" placeholder="0105555123456" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
                  </Field>
                  <Field id="website" label="Website">
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="website" className="pl-9" placeholder="https://example.com" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                    </div>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field id="rating" label="Rating / Status">
                    <Select
                      id="rating"
                      options={RATINGS}
                      value={form.rating}
                      onChange={(e: any) => setForm({ ...form, rating: e.target.value })}
                    />
                  </Field>
                  <Field id="currency" label="Default Currency">
                    <Select
                      id="currency"
                      options={CURRENCIES}
                      value={form.currency}
                      onChange={(e: any) => setForm({ ...form, currency: e.target.value })}
                    />
                  </Field>
                </div>

                <Field id="address" label="Business Address">
                  <Textarea id="address" className="min-h-[80px]" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </Field>

                <Field label="Documents">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="docs-upload" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:bg-surface cursor-pointer">
                      <Upload className="w-4 h-4" /> Upload Files
                    </Label>
                    <input id="docs-upload" type="file" multiple className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" />
                  </div>
                  {(form.documents?.length || 0) > 0 && (
                    <div className="space-y-1 mt-2">
                      {form.documents.map((doc: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-surface/50">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{doc.name}</span>
                          </div>
                          <button type="button" onClick={() => removeDoc(i)} className="text-xs text-destructive hover:underline">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </Field>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Contact Info</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field id="contactPerson" label="Contact Person">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="contactPerson" className="pl-9" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
                    </div>
                  </Field>
                  <Field id="contactPersonRole" label="Role / Department">
                    <Select
                      id="contactPersonRole"
                      options={[
                        { value: "sales_manager", label: "Sales Manager" },
                        { value: "accounting", label: "Accounting" },
                        { value: "procurement", label: "Procurement" },
                        { value: "owner", label: "Owner / Director" },
                        { value: "other", label: "Other" },
                      ]}
                      placeholder="Select role"
                      value={form.contactPersonRole}
                      onChange={(e: any) => setForm({ ...form, contactPersonRole: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field id="email" label="Email">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="email" type="email" className="pl-9" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                  </Field>
                  <Field id="phone" label="Phone">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="phone" type="tel" className="pl-9" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                  </Field>
                </div>

                <Field id="preferredChannel" label="Preferred Contact Channel">
                  <Select
                    id="preferredChannel"
                    options={CHANNELS}
                    placeholder="Select channel"
                    value={form.preferredChannel}
                    onChange={(e: any) => setForm({ ...form, preferredChannel: e.target.value })}
                  />
                </Field>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-4 flex flex-col gap-4">
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Finances &amp; Ops</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Field id="paymentTerms" label="Payment Terms">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Select
                      id="paymentTerms"
                      options={PAYMENT_TERMS}
                      placeholder="Select terms"
                      value={form.paymentTerms}
                      onChange={(e: any) => setForm({ ...form, paymentTerms: e.target.value })}
                    />
                  </div>
                </Field>
                <Field id="defaultLeadTime" label="Default Lead Time (days)">
                  <Input id="defaultLeadTime" type="number" min="0" value={form.defaultLeadTime} onChange={(e) => setForm({ ...form, defaultLeadTime: e.target.value })} />
                </Field>
                <Field id="notes" label="Notes">
                  <Textarea id="notes" placeholder="Additional notes about payments, terms, or operations..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </Field>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="sticky bottom-0 mt-6 -mx-8 -mb-6 px-8 py-4 bg-background border-t border-border flex items-center justify-between shadow-lg shadow-black/5">
          <p className="text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface text-xs font-mono">⌘S</kbd> to save
          </p>
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
            <Button type="submit" loading={saving}><Save className="w-4 h-4" /> Save Changes</Button>
          </div>
        </div>
      </form>
    </div>
  )
}
