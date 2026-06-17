"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
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
import {
 Truck, Mail, Phone, User, MapPin, FileText, Globe,
 Upload, X, Building2, BadgePercent, CalendarDays,
 Tag, MessageSquare, ChevronRight,
} from "lucide-react"

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

type Tab = "basic" | "contact" | "finance"

type UploadedDoc = { id: string; name: string; size: string; dataUrl: string }

export default function NewSupplierPage() {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [activeTab, setActiveTab] = useState<Tab>("basic")
 const formRef = useRef<HTMLFormElement>(null)
 const fileInputRef = useRef<HTMLInputElement>(null)
 const handleUpload = useCallback(() => fileInputRef.current?.click(), [])
 useHotkey("u", handleUpload)
 const [documents, setDocuments] = useState<UploadedDoc[]>([])

 const [form, setForm] = useState({
 name: "", email: "", phone: "",
 contactPerson: "", contactPersonRole: "",
 preferredChannel: "", website: "",
 taxId: "", paymentTerms: "", currency: "THB",
 rating: "active", defaultLeadTime: "0",
 address: "", notes: "",
 })

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

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!form.name) { toast.error("Supplier name is required"); return }
 setLoading(true)
 try {
 const res = await fetch("/api/suppliers", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 ...form,
 defaultLeadTime: form.defaultLeadTime || "0",
 documents: documents.length > 0 ? JSON.stringify(documents.map((d) => ({ name: d.name, size: d.size, dataUrl: d.dataUrl }))) : undefined,
 }),
 })
 if (!res.ok) throw new Error("Failed to create")
 const created = await res.json()
 toast.success("Supplier created successfully", {
 description: form.name,
 duration: 5000,
 })
 router.push("/suppliers")
 router.refresh()
 } catch {
 toast.error("Failed to create supplier")
 } finally {
 setLoading(false)
 }
 }

 const tabs: { key: Tab; label: string; icon: any }[] = [
 { key: "basic", label: "Company Info", icon: Building2 },
 { key: "contact", label: "Contact Info", icon: User },
 { key: "finance", label: "Finances & Ops", icon: BadgePercent },
 ]

 return (
 <div className="animate-fade-in max-w-3xl pb-28">
 <div className="page-header">
 <h1>Add New Supplier</h1>
 <p>Register a new supplier or vendor in your network</p>
 </div>

 {/* Tabs Navigation */}
 <div className="flex items-center gap-1 mb-6 p-1 rounded-xl bg-surface border border-border w-fit">
 {tabs.map((tab, i) => (
 <button
 key={tab.key}
 type="button"
 onClick={() => setActiveTab(tab.key)}
 className={cn(
 "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
 activeTab === tab.key
 ? "bg-background text-foreground shadow-sm border border-border"
 : "text-muted-foreground hover:text-foreground"
 )}
 >
 <tab.icon className="w-4 h-4" />
 {tab.label}
 </button>
 ))}
 </div>

 <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
 {/* Tab: Basic Info */}
 {activeTab === "basic" && (
 <>
 <Card>
 <CardHeader className="pb-3"><h3 className="text-sm font-semibold">Company Details</h3></CardHeader>
 <CardContent className="space-y-4 pt-0">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="name">Supplier Name <span className="text-destructive">*</span></Label>
 <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
 placeholder="e.g. ABC Supplies Co., Ltd." required className="text-base" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="taxId">Tax ID</Label>
 <div className="relative">
 <Input id="taxId" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })}
 placeholder="e.g. 1234567890" className="pl-9" />
 </div>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="website">Website</Label>
 <div className="relative">
 <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input id="website" type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
 placeholder="https://www.supplier.com" className="pl-9" />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="rating">Status / Rating</Label>
 <Select id="rating" options={STATUS_OPTIONS} value={form.rating}
 onChange={(e: any) => setForm({ ...form, rating: e.target.value })} />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="address">Business Address</Label>
 <div className="relative">
 <Textarea id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
 placeholder="Street, district, city, postal code" rows={3} className="pl-9" />
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Document Upload */}
 <Card>
 <CardHeader className="pb-3"><h3 className="text-sm font-semibold">Documents & Attachments</h3></CardHeader>
 <CardContent className="space-y-3 pt-0">
 <p className="text-xs text-muted-foreground">Upload contracts, quotations, or business registration documents.</p>
 <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.png,.doc,.docx,.xls,.xlsx" onChange={handleFileUpload} className="hidden" />
 <Button type="button" variant="outline" size="sm" onClick={handleUpload} className="gap-1.5 h-8 text-xs"><Upload className="w-4 h-4" /> Upload Document <ShortcutBadge shortcut="⌘U" /></Button>
 {documents.length > 0 && (
 <div className="space-y-1.5">
 {documents.map((doc) => (
 <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-surface/50">
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium truncate">{doc.name}</p>
 <p className="text-xs text-muted-foreground">{doc.size}</p>
 </div>
 <button type="button" onClick={() => removeDoc(doc.id)}
 className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors">
 </button>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 </>
 )}

 {/* Tab: Contact Info */}
 {activeTab === "contact" && (
 <Card>
 <CardHeader className="pb-3"><h3 className="text-sm font-semibold">Contact Details</h3></CardHeader>
 <CardContent className="space-y-4 pt-0">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="contactPerson">Contact Person</Label>
 <div className="relative">
 <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input id="contactPerson" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
 placeholder="Full name" className="pl-9" />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="contactPersonRole">Role / Department</Label>
 <div className="relative">
 <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input id="contactPersonRole" value={form.contactPersonRole} onChange={(e) => setForm({ ...form, contactPersonRole: e.target.value })}
 placeholder="e.g. Sales Manager, Accounting" className="pl-9" />
 </div>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="email">Email</Label>
 <div className="relative">
 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
 placeholder="contact@supplier.com" className="pl-9" />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="phone">Phone</Label>
 <div className="relative">
 <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
 placeholder="+66 81 234 5678" className="pl-9" />
 </div>
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="preferredChannel">Preferred Communication Channel</Label>
 <div className="relative">
 <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
 <Select id="preferredChannel" options={CHANNEL_OPTIONS} placeholder="Select channel"
 value={form.preferredChannel}
 onChange={(e: any) => setForm({ ...form, preferredChannel: e.target.value })} />
 </div>
 </div>
 </CardContent>
 </Card>
 )}

 {/* Tab: Finances & Ops */}
 {activeTab === "finance" && (
 <Card>
 <CardHeader className="pb-3"><h3 className="text-sm font-semibold">Financial & Operational Settings</h3></CardHeader>
 <CardContent className="space-y-4 pt-0">
 <div className="grid grid-cols-3 gap-4">
 <div className="space-y-2">
 <Label htmlFor="paymentTerms">Payment Terms</Label>
 <Select id="paymentTerms" options={PAYMENT_TERMS_OPTIONS} placeholder="Select terms"
 value={form.paymentTerms}
 onChange={(e: any) => setForm({ ...form, paymentTerms: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="currency">Currency</Label>
 <Select id="currency" options={CURRENCY_OPTIONS} value={form.currency}
 onChange={(e: any) => setForm({ ...form, currency: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="defaultLeadTime" className="flex items-center gap-1">
 Default Lead Time (Days) <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-muted text-[9px] font-semibold text-muted-foreground cursor-help" title="Average time from order to delivery">?</span>
 </Label>
 <Input id="defaultLeadTime" type="number" min="0" value={form.defaultLeadTime}
 onChange={(e) => setForm({ ...form, defaultLeadTime: e.target.value })} />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="notes">Notes</Label>
 <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
 placeholder="Payment notes, preferred shipping method, internal remarks..." rows={4} />
 </div>
 </CardContent>
 </Card>
 )}
 </form>

 {/* Sticky Footer */}
 <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm ml-60">
 <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <span className="text-xs text-muted-foreground hidden sm:inline">
 <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface text-[10px] font-mono">⌘S</kbd> to save
 </span>
 </div>
 <div className="flex items-center gap-3">
 <Button type="button" variant="ghost" onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground">
 Cancel
 </Button>
 <Button loading={loading} onClick={() => formRef.current?.requestSubmit()} className="px-6">
 Create Supplier
 </Button>
 </div>
 </div>
 </div>
 </div>
 )
}
