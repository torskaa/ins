"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { ArrowLeft, Calendar, Clock, Download, File as FileIcon, FileArchive, FileImage, FileSpreadsheet, FileText, HardDrive, Link as LinkIcon, MoreHorizontal, Tag, Trash2, User } from "lucide-react"
import { formatDate, formatDateTime } from "@/lib/utils"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { SkeletonDetail } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

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
  <Breadcrumb className="mb-4">
  <BreadcrumbList>
  <BreadcrumbItem>
  <BreadcrumbLink asChild>
  <button onClick={() => router.push("/knowledge/documents")}>Documents</button>
  </BreadcrumbLink>
  </BreadcrumbItem>
  <BreadcrumbSeparator />
  <BreadcrumbItem>
  <BreadcrumbPage>{current.name}</BreadcrumbPage>
  </BreadcrumbItem>
  </BreadcrumbList>
  </Breadcrumb>

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
  <Button className="gap-1.5"><Download className="w-4 h-4" /> Download</Button>
  </a>
  ) : (
  <Button variant="outline" className="gap-1.5" disabled>
  No File
  </Button>
  )}
  <DropdownMenu>
  <DropdownMenuTrigger asChild>
  <Button variant="ghost" size="sm" className="h-9 w-9 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
  <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
  </DropdownMenuContent>
  </DropdownMenu>
</div>
 </div>

  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
  <Tag className="w-5 h-5 text-muted-foreground" />
  <p className="text-[11px] text-muted-foreground font-medium">Document Type</p>
  <Badge variant={typeColors[current.type] || "outline"}>{current.type}</Badge>
  </div>
  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
  <HardDrive className="w-5 h-5 text-muted-foreground" />
  <p className="text-[11px] text-muted-foreground font-medium">File Size</p>
  <p className="text-sm font-medium">{current.size}</p>
  </div>
  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
  <User className="w-5 h-5 text-muted-foreground" />
  <p className="text-[11px] text-muted-foreground font-medium">Uploaded By</p>
  <p className="text-sm font-medium">{current.uploadedBy}</p>
  </div>
  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
  <Calendar className="w-5 h-5 text-muted-foreground" />
  <p className="text-[11px] text-muted-foreground font-medium">Upload Date</p>
  <p className="text-sm font-medium">{formatDate(new Date(current.uploadedAt))}</p>
  </div>
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
