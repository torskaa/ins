"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, FileText, FileSpreadsheet, FileImage, FileArchive, File as FileIcon, Download, Trash2, Calendar, User, Tag, Link as LinkIcon, Clock, HardDrive } from "lucide-react"
import { formatDate, formatDateTime } from "@/lib/utils"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { SkeletonDetail } from "@/components/ui/skeleton"

type Document = {
 id: string
 name: string
 type: "PO" | "Invoice" | "Delivery Note" | "Report" | "Other"
 fileType: "pdf" | "spreadsheet" | "image" | "archive" | "doc"
 size: string
 filePath?: string
 uploadedBy: string
 uploadedAt: string
 relatedTo?: string
}

const fileIcons: Record<string, any> = {
 pdf: FileText,
 spreadsheet: FileSpreadsheet,
 image: FileImage,
 archive: FileArchive,
 doc: FileIcon,
}

const typeColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
 PO: "default",
 Invoice: "destructive",
 "Delivery Note": "secondary",
 Report: "outline",
 Other: "outline",
}

const fileTypeLabels: Record<string, string> = {
 pdf: "PDF Document",
 spreadsheet: "Spreadsheet",
 image: "Image",
 archive: "Archive",
 doc: "Document",
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = use(params)
 const router = useRouter()
 const [doc, setDoc] = useState<Document | null>(null)
 const [loading, setLoading] = useState(true)
 const [deleteOpen, setDeleteOpen] = useState(false)

 useEffect(() => {
 setLoading(true)
 fetch(`/api/knowledge/documents/${id}`)
 .then((r) => r.json())
 .then((data) => { setDoc(data); setLoading(false) })
 .catch(() => setLoading(false))
 }, [id])

 if (loading) return <SkeletonDetail cards={4} hasChart={false} />
 if (!doc) return (
 <div className="animate-fade-in">
 <Button variant="ghost" size="sm" className="gap-1.5 mb-4" onClick={() => router.push("/knowledge/documents")}>
 Back to Documents
 </Button>
 <Card><CardContent className="p-8 text-center text-muted-foreground">Document not found</CardContent></Card>
 </div>
 )

 const current = doc
 const Icon = fileIcons[current.fileType] || FileIcon

 async function handleDelete() {
 try {
 const res = await fetch(`/api/knowledge/documents/${current.id}`, { method: "DELETE" })
 if (!res.ok) throw new Error()
 toast.success("Document deleted")
 router.push("/knowledge/documents")
 } catch {
 toast.error("Failed to delete document")
 }
 }

 return (
 <div className="animate-fade-in">
 <Button variant="ghost" size="sm" className="gap-1.5 mb-4" onClick={() => router.push("/knowledge/documents")}>
 Back to Documents
 </Button>

 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-4">
 <div className="w-14 h-14 rounded-xl bg-primary/5 flex items-center justify-center">
 <Icon className="w-7 h-7 text-primary" />
 </div>
 <div>
 <h1 className="text-2xl font-semibold">{current.name}</h1>
 <div className="flex items-center gap-2 mt-1">
 <Badge variant={typeColors[current.type] || "outline"}>{current.type}</Badge>
 <span className="text-xs text-muted-foreground">{fileTypeLabels[current.fileType] || current.fileType}</span>
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {current.filePath ? (
 <a href={current.filePath} download>
 <Button variant="outline" className="gap-1.5">Download</Button>
 </a>
 ) : (
 <Button variant="outline" className="gap-1.5" disabled>
 No File
 </Button>
 )}
 <Button variant="destructive" size="icon" onClick={() => setDeleteOpen(true)}>
 </Button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
 <Card>
 <CardContent className="p-4">
 <div className="flex items-center gap-2 text-muted-foreground mb-1">
 <Tag className="w-3.5 h-3.5" />
 <p className="text-xs font-medium">Document Type</p>
 </div>
 <Badge variant={typeColors[current.type] || "outline"} className="mt-1">{current.type}</Badge>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="p-4">
 <div className="flex items-center gap-2 text-muted-foreground mb-1">
 <HardDrive className="w-3.5 h-3.5" />
 <p className="text-xs font-medium">File Size</p>
 </div>
 <p className="text-sm font-medium mt-1">{current.size}</p>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="p-4">
 <div className="flex items-center gap-2 text-muted-foreground mb-1">
 <User className="w-3.5 h-3.5" />
 <p className="text-xs font-medium">Uploaded By</p>
 </div>
 <p className="text-sm font-medium mt-1">{current.uploadedBy}</p>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="p-4">
 <div className="flex items-center gap-2 text-muted-foreground mb-1">
 <Calendar className="w-3.5 h-3.5" />
 <p className="text-xs font-medium">Upload Date</p>
 </div>
 <p className="text-sm font-medium mt-1">{formatDate(new Date(current.uploadedAt))}</p>
 </CardContent>
 </Card>
 </div>

 {current.relatedTo && (
 <Card className="mb-6">
 <CardContent className="p-4 flex items-center gap-3">
 <LinkIcon className="w-4 h-4 text-muted-foreground" />
 <div>
 <p className="text-xs text-muted-foreground">Related To</p>
 <p className="text-sm font-medium">{current.relatedTo}</p>
 </div>
 </CardContent>
 </Card>
 )}

 <Card>
 <CardHeader>
 <CardTitle className="text-sm font-medium">File Preview</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="flex flex-col items-center justify-center py-12 bg-surface/30 rounded-xl border border-dashed border-border">
 <Icon className="w-16 h-16 text-muted-foreground/30 mb-4" />
 <p className="text-sm text-muted-foreground mb-1">Preview not available for this file type</p>
 <p className="text-xs text-muted-foreground/60 mb-4">{current.name} ({current.size})</p>
 {current.filePath ? (
 <a href={current.filePath} download>
 <Button variant="outline" size="sm" className="gap-1.5">
 Download to view
 </Button>
 </a>
 ) : (
 <Button variant="outline" size="sm" className="gap-1.5" disabled>
 No file available
 </Button>
 )}
 </div>
 </CardContent>
 </Card>

 <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Document" description={`Are you sure you want to delete "${current.name}"?`} onConfirm={handleDelete} />
 </div>
 )
}
