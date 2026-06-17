"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { FileIcon, Upload, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function NewDocumentPage() {
 const router = useRouter()
 const fileInputRef = useRef<HTMLInputElement>(null)
 const formRef = useRef<HTMLFormElement>(null)
 const handleUpload = useCallback(() => formRef.current?.requestSubmit(), [])
 useHotkey("u", handleUpload)
 const [loading, setLoading] = useState(false)
 const [dragOver, setDragOver] = useState(false)
 const [form, setForm] = useState({ name: "", type: "Other", notes: "" })
 const [file, setFile] = useState<File | null>(null)

 function handleFileDrop(e: React.DragEvent) {
 e.preventDefault()
 setDragOver(false)
 const f = e.dataTransfer.files[0]
 if (f) {
 setFile(f)
 if (!form.name) setForm({ ...form, name: f.name.replace(/\.[^/.]+$/, "") })
 }
 }

 function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
 const f = e.target.files?.[0]
 if (f) {
 setFile(f)
 if (!form.name) setForm({ ...form, name: f.name.replace(/\.[^/.]+$/, "") })
 }
 }

 const fileTypeLabels: Record<string, string> = {
 pdf: "PDF", xlsx: "Excel", xls: "Excel", csv: "CSV",
 doc: "Word", docx: "Word", png: "Image", jpg: "Image",
 jpeg: "Image", zip: "Archive",
 }

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!file) { toast.error("Please select a file"); return }
 setLoading(true)
 try {
 const formData = new FormData()
 formData.append("file", file)
 formData.append("name", form.name || file.name)
 formData.append("type", form.type)
 formData.append("notes", form.notes)

 const res = await fetch("/api/knowledge/documents", {
 method: "POST",
 body: formData,
 })
 if (!res.ok) throw new Error()
 toast.success("Document uploaded")
 router.push("/knowledge/documents")
 router.refresh()
 } catch { toast.error("Failed to upload") }
 finally { setLoading(false) }
 }

 return (
 <div className="animate-fade-in max-w-2xl">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
 Back
 </button>
 <div className="page-header"><h1>Upload Document</h1><p>Add a file to Document Center</p></div>
 <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader><CardTitle className="flex items-center gap-2">Document Info</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label>File <span className="text-destructive">*</span></Label>
 <div
 onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
 onDragLeave={() => setDragOver(false)}
 onDrop={handleFileDrop}
 onClick={() => fileInputRef.current?.click()}
 className={cn(
 "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
 "hover:border-primary hover:bg-primary/5",
 dragOver && "border-primary bg-primary/10 scale-[1.02]",
 file && "border-success bg-success/5"
 )}
 >
 {file ? (
 <div className="flex items-center justify-center gap-3">
 <FileIcon className="w-8 h-8 text-primary" />
 <div className="text-left">
 <p className="text-sm font-medium">{file.name}</p>
 <p className="text-xs text-muted-foreground">
 {(file.size / 1024).toFixed(1)} KB &middot; {fileTypeLabels[file.name.split(".").pop()?.toLowerCase() || ""] || "Unknown"}
 </p>
 </div>
 <button
 type="button"
 onClick={(e) => { e.stopPropagation(); setFile(null) }}
 className="p-1 rounded-full hover:bg-surface transition-colors"
 >
 </button>
 </div>
 ) : (
 <div>
 <p className="text-sm font-medium">Drop a file here or click to browse</p>
 <p className="text-xs text-muted-foreground mt-1">PDF, Excel, Word, Images, Archives</p>
 </div>
 )}
 <input
 ref={fileInputRef}
 type="file"
 className="hidden"
 onChange={handleFileSelect}
 accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.png,.jpg,.jpeg,.zip,.rar,.7z"
 />
 </div>
 </div>

 <div className="space-y-2">
 <Label htmlFor="name">Document Name</Label>
 <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Invoice_2025_001" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="type">Type</Label>
 <select id="type" className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
 <option value="PO">Purchase Order</option>
 <option value="Invoice">Invoice</option>
 <option value="Delivery Note">Delivery Note</option>
 <option value="Report">Report</option>
 <option value="Other">Other</option>
 </select>
 </div>
 <div className="space-y-2">
 <Label htmlFor="notes">Notes</Label>
 <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
 </div>
 </CardContent>
 </Card>
 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
 <Button type="submit" disabled={!file} loading={loading} className="gap-1.5">Upload Document <ShortcutBadge shortcut="⌘U" /></Button>
 </div>
 </form>
 </div>
 )
}
