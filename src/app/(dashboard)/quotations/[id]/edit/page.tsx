"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { SkeletonForm } from "@/components/ui/skeleton"
import { XCircle } from "lucide-react"

export default function EditQuotationPage() {
 const router = useRouter()
 const params = useParams()
 const [loading, setLoading] = useState(false)
 const [fetching, setFetching] = useState(true)
 const [form, setForm] = useState({ status: "draft", validUntil: "", notes: "" })

 useEffect(() => {
 fetch(`/api/quotations/${params.id}`)
 .then(r => r.json())
 .then(d => {
 if (d.error) { toast.error("Quotation not found"); router.push("/quotations"); return }
 setForm({
 status: d.status || "draft",
 validUntil: d.validUntil ? d.validUntil.split("T")[0] : "",
 notes: d.notes || "",
 })
 })
 .finally(() => setFetching(false))
 }, [params.id, router])

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 setLoading(true)
 try {
 const res = await fetch(`/api/quotations/${params.id}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(form),
 })
 if (!res.ok) throw new Error()
 toast.success("Quotation updated")
 router.push(`/quotations/${params.id}`)
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
 <div className="page-header"><h1>Edit Quotation</h1><p>Update quotation details</p></div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader><CardTitle>Quotation Info</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label>Status</Label>
 <select className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
 <option value="draft">Draft</option>
 <option value="sent">Sent</option>
 <option value="confirmed">Confirmed</option>
 <option value="expired">Expired</option>
 <option value="cancelled">Cancelled</option>
 </select>
 </div>
 <div className="space-y-2">
 <Label htmlFor="validUntil">Valid Until</Label>
 <Input id="validUntil" type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="notes">Notes</Label>
 <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
 </div>
 </CardContent>
 </Card>
 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
 <Button type="submit" loading={loading}>Update Quotation</Button>
 </div>
 </form>
 </div>
 )
}
