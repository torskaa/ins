"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useFormValidation } from "@/hooks/use-form-validation"
import { supplierSchema, z } from "@/lib/validation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { XCircle, Upload, X, Building2, Globe, MapPin, Mail, Phone, User, Tag, MessageSquare, BadgePercent, DollarSign } from "lucide-react"

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "preferred", label: "Preferred" },
  { value: "blacklisted", label: "Blacklisted" },
]

const CURRENCY_OPTIONS = [
  { value: "THB", label: "THB (฿)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "JPY", label: "JPY (¥)" },
  { value: "CNY", label: "CNY (¥)" },
  { value: "SGD", label: "SGD (S$)" },
  { value: "MYR", label: "MYR (RM)" },
]

const PAYMENT_TERMS_OPTIONS = [
  { value: "cod", label: "Cash on Delivery (COD)" },
  { value: "net7", label: "Net 7 Days" },
  { value: "net15", label: "Net 15 Days" },
  { value: "net30", label: "Net 30 Days" },
  { value: "net45", label: "Net 45 Days" },
  { value: "net60", label: "Net 60 Days" },
  { value: "advance_50", label: "Advance 50%" },
  { value: "advance_100", label: "Advance 100%" },
  { value: "deposit", label: "Deposit + Balance" },
  { value: "custom", label: "Custom Terms" },
]

const CHANNEL_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "line", label: "Line" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "wechat", label: "WeChat" },
]

type UploadedDoc = { id: string; name: string; size: string; dataUrl: string }

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

export default function NewSupplierPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleUpload = useCallback(() => fileInputRef.current?.click(), [])
  useHotkey("u", handleUpload)
  const [documents, setDocuments] = useState<UploadedDoc[]>([])

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useFormValidation(supplierSchema, {
    defaultValues: {
      name: "", email: "", phone: "",
      contactPerson: "", contactPersonRole: "",
      preferredChannel: "", website: "",
      taxId: "", paymentTerms: "", currency: "THB",
      rating: "active", defaultLeadTime: 0,
      address: "", notes: "",
    } })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); formRef.current?.requestSubmit() }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setDocuments([...documents, {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`,
        dataUrl: ev.target?.result as string,
      }])
    }
    reader.readAsDataURL(file)
  }

  const removeDoc = (id: string) => setDocuments(documents.filter((d) => d.id !== id))

  async function onSubmit(data: z.infer<typeof supplierSchema>) {
    setLoading(true)
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          defaultLeadTime: data.defaultLeadTime || 0,
          documents: documents.length > 0 ? JSON.stringify(documents.map((d) => ({ name: d.name, size: d.size, dataUrl: d.dataUrl }))) : undefined,
        }),
      })
      if (!res.ok) throw new Error("Failed to create")
      const created = await res.json()
      toast.success("Supplier created successfully", { description: data.name, duration: 5000 })
      router.push("/suppliers")
      router.refresh()
    } catch {
      toast.error("Failed to create supplier")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">Back</button>
      <div className="page-header mb-5">
        <h1>Add New Supplier</h1>
        <p>Register a new supplier or vendor in your network</p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="w-4 h-4 text-primary" />
                  Company Details
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Supplier Name" required>
                    <Input {...register("name")} placeholder="e.g. ABC Supplies Co., Ltd." className="text-base" />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </Field>
                  <Field label="Tax ID">
                    <Input {...register("taxId")} placeholder="e.g. 1234567890" />
                    {errors.taxId && <p className="text-xs text-destructive">{errors.taxId.message}</p>}
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Website">
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="url" {...register("website")} placeholder="https://www.supplier.com" className="pl-9" />
                    </div>
                    {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
                  </Field>
                  <Field label="Business Address">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Textarea {...register("address")} placeholder="Street, district, city, postal code" rows={3} className="pl-9" />
                    </div>
                    {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                  </Field>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <User className="w-4 h-4 text-primary" />
                  Contact Details
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Contact Person">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input {...register("contactPerson")} placeholder="Full name" className="pl-9" />
                    </div>
                    {errors.contactPerson && <p className="text-xs text-destructive">{errors.contactPerson.message}</p>}
                  </Field>
                  <Field label="Role / Department">
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input {...register("contactPersonRole")} placeholder="e.g. Sales Manager" className="pl-9" />
                    </div>
                    {errors.contactPersonRole && <p className="text-xs text-destructive">{errors.contactPersonRole.message}</p>}
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Email">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="email" {...register("email")} placeholder="contact@supplier.com" className="pl-9" />
                    </div>
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </Field>
                  <Field label="Phone">
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="tel" {...register("phone")} placeholder="+66 81 234 5678" className="pl-9" />
                    </div>
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </Field>
                </div>
                <Field label="Preferred Communication Channel">
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                    <Select options={CHANNEL_OPTIONS} placeholder="Select channel" value={watch("preferredChannel")} onChange={(e: any) => setValue("preferredChannel", e.target.value)} />
                  </div>
                  {errors.preferredChannel && <p className="text-xs text-destructive">{errors.preferredChannel.message}</p>}
                </Field>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <BadgePercent className="w-4 h-4 text-primary" />
                  Financial & Operational Settings
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Payment Terms">
                    <Select options={PAYMENT_TERMS_OPTIONS} placeholder="Select terms" value={watch("paymentTerms")} onChange={(e: any) => setValue("paymentTerms", e.target.value)} />
                    {errors.paymentTerms && <p className="text-xs text-destructive">{errors.paymentTerms.message}</p>}
                  </Field>
                  <Field label="Currency">
                    <Select options={CURRENCY_OPTIONS} value={watch("currency")} onChange={(e: any) => setValue("currency", e.target.value)} />
                    {errors.currency && <p className="text-xs text-destructive">{errors.currency.message}</p>}
                  </Field>
                  <Field label={<span className="flex items-center gap-1">Default Lead Time (Days) <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-muted text-[9px] font-semibold text-muted-foreground cursor-help" title="Average time from order to delivery">?</span></span>}>
                    <Input type="number" min="0" {...register("defaultLeadTime")} />
                    {errors.defaultLeadTime && <p className="text-xs text-destructive">{errors.defaultLeadTime.message}</p>}
                  </Field>
                </div>
                <Field label="Notes">
                  <Textarea {...register("notes")} placeholder="Payment notes, preferred shipping method, internal remarks..." rows={4} />
                  {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
                </Field>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-4 flex flex-col gap-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Status & Rating
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Field label="Status / Rating">
                  <Select options={STATUS_OPTIONS} value={watch("rating")} onChange={(e: any) => setValue("rating", e.target.value)} />
                  {errors.rating && <p className="text-xs text-destructive">{errors.rating.message}</p>}
                </Field>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Upload className="w-4 h-4 text-primary" />
                  Documents
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground">Upload contracts, quotations, or business registration documents.</p>
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.png,.doc,.docx,.xls,.xlsx" onChange={handleFileUpload} className="hidden" />
                <Button type="button" variant="outline" size="sm" onClick={handleUpload} className="gap-1.5 h-8 text-xs w-full">Upload Document <kbd className="text-[9px] px-1 py-0.5 rounded bg-muted/20 text-primary-foreground font-mono ml-0.5">⌘U</kbd></Button>
                {documents.length > 0 && (
                  <div className="space-y-1">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-surface/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.size}</p>
                        </div>
                        <button type="button" onClick={() => removeDoc(doc.id)} className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm shadow-lg shadow-black/5 ml-60">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface text-[10px] font-mono">⌘S</kbd> to save
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground"><XCircle className="w-4 h-4" /> Cancel</Button>
            <Button loading={loading} onClick={() => formRef.current?.requestSubmit()} className="px-6">Create Supplier</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
