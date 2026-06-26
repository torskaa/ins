"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge, BadgeDot, SemanticBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { AlertTriangle, Clock, Download, File as FileIcon, FileArchive, FileImage, FileSpreadsheet, FileText, Hash, Pencil, Tag, Trash2, XCircle, Building2 } from "lucide-react"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { formatDate, cn } from "@/lib/utils"
import { toast } from "sonner"
import { SkeletonDetail } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { MoreMenu } from "@/components/ui/more-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"

const fileIcons: Record<string, any> = {
  pdf: FileText,
  spreadsheet: FileSpreadsheet,
  image: FileImage,
  archive: FileArchive,
  doc: FileIcon,
}

const fileTypeLabels: Record<string, string> = {
  pdf: "PDF Document",
  spreadsheet: "Spreadsheet",
  image: "Image",
  archive: "Archive",
  doc: "Document",
}

function FieldDisplay({ label, value, mono, badge }: { label: string; value: string; mono?: boolean; badge?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground font-medium mb-0.5 truncate">{label}</p>
      {badge ? (
        <SemanticBadge semantic={value} category="status">{value}</SemanticBadge>
      ) : (
        <p className={cn("text-sm truncate", mono ? "font-mono" : "font-medium")}>{value || "—"}</p>
      )}
    </div>
  )
}

function FieldGroup({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="min-w-0 space-y-1">
      <Label className="text-[11px] text-muted-foreground font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [doc, setDoc] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [tab, setTab] = useState("info")
  const [id, setId] = useState<string>("")

  useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/knowledge/documents/${id}`)
      .then((r) => r.json())
      .then((json) => { if (json?.success) setDoc(json.data); else throw new Error(json?.error || "Failed to load") })
      .catch((err) => { setError(err.message); setLoading(false) })
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/knowledge/documents/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Document deleted")
      router.push("/knowledge/documents")
      router.refresh()
    } catch {
      toast.error("Failed to delete document")
      setDeleting(false)
    }
  }

  if (error) return (
    <div className="animate-fade-in pb-8 space-y-4">
      <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
    </div>
  )

  if (loading) return <SkeletonDetail cards={4} hasChart={false} />

  if (!doc) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Document not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The document you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/knowledge/documents")}>Back to Documents</Button>
      </div>
    )
  }

  const Icon = fileIcons[doc.fileType] || FileIcon

  const columns = [
    { key: "name", label: "Name", render: (item: any) => <span className="font-medium">{item.name}</span> },
    { key: "type", label: "Type", render: (item: any) => <SemanticBadge semantic={item.type} category="type" className="" /> },
    { key: "fileType", label: "File Type", render: (item: any) => <span className="text-muted-foreground">{fileTypeLabels[item.fileType] || item.fileType}</span> },
    { key: "size", label: "Size", render: (item: any) => <span className="font-mono text-xs">{item.size}</span> },
    { key: "uploadedAt", label: "Uploaded", render: (item: any) => <span className="text-muted-foreground text-sm">{formatDate(new Date(item.uploadedAt))}</span> },
  ]

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button onClick={() => router.push("/knowledge/documents")}>
                  <FileText className="size-4" />
                  Documents
                </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{doc.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 border border-border/60 rounded-lg bg-card p-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex gap-3 min-w-0 flex-1">
              <div className="w-14 self-stretch rounded-lg bg-surface/30 border border-border/60 flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{doc.name}</h1>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <SemanticBadge semantic={doc.fileType} category="type" className="font-mono text-[11px]">{fileTypeLabels[doc.fileType] || doc.fileType}</SemanticBadge>
                  <SemanticBadge semantic={doc.type} category="type" className="text-[11px]" />
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Uploaded by {doc.uploadedBy}</span>
                  <span className="text-muted-foreground/30">·</span>
                  <span>{formatDate(new Date(doc.uploadedAt))}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {doc.filePath ? (
                  <a href={doc.filePath} download>
                    <Button size="sm" className="gap-1.5"><Download className="w-4 h-4" /> Download</Button>
                  </a>
                ) : (
                  <Button variant="outline" size="sm" className="gap-1.5" disabled>
                    No File
                  </Button>
                )}
                <MoreMenu actions={[
                  { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDelete(true) },
                ]} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="w-4 h-4 text-primary" />
                File Preview
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-col items-center justify-center py-12 bg-surface/30 rounded-xl border border-dashed border-border">
                <Icon className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-sm text-muted-foreground mb-1">Preview not available for this file type</p>
                <p className="text-xs text-muted-foreground/60 mb-4">{doc.name} ({doc.size})</p>
                {doc.filePath ? (
                  <a href={doc.filePath} download>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Download className="w-4 h-4" /> Download to view
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
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Tag className="w-4 h-4 text-primary" />
                Overview
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <FieldDisplay label="Document Type" value={doc.type} />
              <FieldDisplay label="File Type" value={fileTypeLabels[doc.fileType] || doc.fileType} />
              <FieldDisplay label="File Size" value={doc.size} mono />
              <FieldDisplay label="Uploaded By" value={doc.uploadedBy} />
              <FieldDisplay label="Upload Date" value={formatDate(new Date(doc.uploadedAt))} />
              {doc.relatedTo && <FieldDisplay label="Related To" value={doc.relatedTo} />}
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="w-4 h-4 text-primary" />
                Metadata
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Uploaded" value={formatDate(new Date(doc.uploadedAt))} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full overflow-x-auto px-4">
            <TabsTrigger value="info" className="gap-1.5"><FileText className="w-4 h-4" /> File Info</TabsTrigger>
            <TabsTrigger value="related" className="gap-1.5"><Building2 className="w-4 h-4" /> Related</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="p-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <FileText className="w-4 h-4 text-primary" />
              File Information
            </div>
            <div data-slot="frame">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.slice(0, 3).map((col) => (
                      <TableHead key={col.key}>{col.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    {columns.slice(0, 3).map((col) => (
                      <TableCell key={col.key}>
                        {col.render ? col.render(doc) : String(doc[col.key] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="related" className="p-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Building2 className="w-4 h-4 text-primary" />
              Related Documents
            </div>
            <EmptyState
              icons={[<Building2 key="rd1" className="w-6 h-6" />, <FileText key="rd2" className="w-6 h-6" />]}
              title="No related documents"
              description="Other documents related to this record will appear here"
              size="sm"
            />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{doc.name}</strong>? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}><XCircle className="w-4 h-4" /> Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}><Trash2 className="w-4 h-4" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
