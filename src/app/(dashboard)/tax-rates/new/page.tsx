"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function NewTaxRatePage() {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [form, setForm] = useState({ name: "", rate: "7", type: "vat", isDefault: false })

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!form.name) { toast.error("Name is required"); return }
 setLoading(true)
 try {
 const res = await fetch("/api/tax-rates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, rate: parseFloat(form.rate) }) })
 if (!res.ok) throw new Error()
 toast.success("Tax rate created"); router.push("/tax-rates"); router.refresh()
 } catch { toast.error("Failed to create") } finally { setLoading(false) }
 }

 return (
 <div className="animate-fade-in max-w-2xl">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">Back</button>
 <div className="page-header"><h1>New Tax Rate</h1><p>Add a tax rate for VAT or withholding</p></div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card><CardHeader className="pb-3"><h3 className="text-sm font-semibold flex items-center gap-2">Tax Details</h3></CardHeader>
 <CardContent className="space-y-4 pt-0">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2"><Label>Name <span className="text-destructive">*</span></Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VAT 7%" /></div>
 <div className="space-y-2"><Label>Rate (%)</Label><Input type="number" min="0" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} /></div>
 </div>
 <div className="space-y-2"><Label>Type</Label><Select options={[{ value: "vat", label: "VAT" }, { value: "withholding", label: "Withholding Tax" }, { value: "other", label: "Other" }]} value={form.type} onChange={(e: any) => setForm({ ...form, type: e.target.value })} /></div>
 <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="rounded border-border" /><span className="text-sm">Set as default</span></label>
 </CardContent>
 </Card>
 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
 <Button type="submit" loading={loading}>Create Tax Rate</Button>
 </div>
 </form>
 </div>
 )
}
