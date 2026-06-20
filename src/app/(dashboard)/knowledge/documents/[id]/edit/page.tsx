"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { SkeletonForm } from "@/components/ui/skeleton"
import { AlertTriangle, FileText, XCircle } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"

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

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

export default function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", type: "Other", fileType: "pdf", size: "", notes: "" })

  useEffect(() => {
    fetch(`/api/knowledge/documents/${id}`)
      .then(r => r.json())
      .then((json) => {
        if (!json?.success) { toast.error(json?.error || "Document not found"); router.push("/knowledge/documents"); return }
        const d = json.data
        setForm({ name: d.name || "", type: d.type || "Other", fileType: d.fileType || "pdf", size: d.size || "", notes: d.notes || "" })
      })
      .catch((err) => { setError(err.message); setFetching(false) })
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

  if (error) return (
    <div className="animate-fade-in pb-8 space-y-4">
      <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
    </div>
  )
  if (fetching) return <div className="animate-fade-in pb-28"><SkeletonForm fields={4} /></div>

  return (
    <div className="animate-fade-in pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        Back
      </button>
      <div className="page-header mb-5"><h1>Edit Document</h1><p>Update document details</p></div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Document Info</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Field id="name" label="Name" required>
                  <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Document name" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field id="type" label="Type">
                    <Select id="type" options={TYPE_OPTIONS} value={form.type} onChange={(e: any) => setForm({ ...form, type: e.target.value })} />
                  </Field>
                  <Field id="fileType" label="File Type">
                    <Select id="fileType" options={FILE_TYPE_OPTIONS} value={form.fileType} onChange={(e: any) => setForm({ ...form, fileType: e.target.value })} />
                  </Field>
                </div>
                <Field id="size" label="Size">
                  <Input id="size" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="e.g. 245 KB" />
                </Field>
                <Field id="notes" label="Notes">
                  <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Additional notes..." />
                </Field>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-4 flex flex-col gap-4" />
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" loading={saving}>Update Document</Button>
        </div>
      </form>
    </div>
  )
}
