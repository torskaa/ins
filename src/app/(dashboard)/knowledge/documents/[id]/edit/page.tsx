"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { SkeletonForm } from "@/components/ui/skeleton"
import { XCircle } from "lucide-react"

const TYPE_OPTIONS = [
 { value: "PO", label: "PO" },
 { value: "Invoice", label: "Invoice" },
 { value: "Delivery Note", label: "Delivery Note" },
 { value: "Report", label: "Report" },
 { value: "Other", label: "Other" },
]

const FILE_TYPE_OPTIONS = [
 { value: "pdf", label: "PDF" },
 { value: "spreadsheet", label: "Spreadsheet" },
 { value: "image", label: "Image" },
 { value: "archive", label: "Archive" },
 { value: "doc", label: "Document" },
]

export default function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
 const router = useRouter()
 const { id } = use(params)
 const [saving, setSaving] = useState(false)
 const [fetching, setFetching] = useState(true)
 const [form, setForm] = useState({ name: "", type: "Other", fileType: "pdf", size: "", notes: "" })

 useEffect(() => {
 fetch(`/api/knowledge/documents/${id}`)
 .then(r => r.json())
 .then((d) => {
 if (!d || d.error) { toast.error("Document not found"); router.push("/knowledge/documents"); return }
 setForm({ name: d.name || "", type: d.type || "Other", fileType: d.fileType || "pdf", size: d.size || "", notes: d.notes || "" })
 })
 .finally(() => setFetching(false))
 }, [id, router])

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!form.name) { toast.error("Document name is required"); return }
 setSaving(true)
 try {
 const res = await fetch(`/api/knowledge/documents/${id}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(form),
 })
 if (!res.ok) throw new Error()
 toast.success("Document updated")
 router.push("/knowledge/documents")
 router.refresh()
 } catch { toast.error("Failed to update") }
 finally { setSaving(false) }
 }

 if (fetching) return <SkeletonForm fields={4} />

 return (
 <div className="animate-fade-in max-w-2xl">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
 Back
 </button>
 <div className="page-header"><h1>Edit Document</h1><p>Update document details</p></div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader><CardTitle className="flex items-center gap-2">Document Info</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label>Name <span className="text-destructive">*</span></Label>
 <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Document name" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label>Type</Label>
 <Select options={TYPE_OPTIONS} value={form.type} onChange={(e: any) => setForm({ ...form, type: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label>File Type</Label>
 <Select options={FILE_TYPE_OPTIONS} value={form.fileType} onChange={(e: any) => setForm({ ...form, fileType: e.target.value })} />
 </div>
 </div>
 <div className="space-y-2">
 <Label>Size</Label>
 <Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="e.g. 245 KB" />
 </div>
 <div className="space-y-2">
 <Label>Notes</Label>
 <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Additional notes..." />
 </div>
 </CardContent>
 </Card>

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
 <Button type="submit" loading={saving}>Update Document</Button>
 </div>
 </form>
 </div>
 )
}
