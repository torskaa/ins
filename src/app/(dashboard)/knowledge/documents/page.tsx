"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"

import { Search, Plus, Upload, FileText, FileSpreadsheet, FileImage, FileArchive, Download, Eye, MoreHorizontal, FolderOpen, Trash2, File as FileIcon } from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"

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

const typeColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
 PO: "default",
 Invoice: "destructive",
 "Delivery Note": "secondary",
 Report: "outline",
 Other: "outline",
}

const fileIcons: Record<string, any> = {
 pdf: FileText,
 spreadsheet: FileSpreadsheet,
 image: FileImage,
 archive: FileArchive,
 doc: FileIcon,
}

export default function DocumentsPage() {
 const router = useRouter()
 const [documents, setDocuments] = useState<Document[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("")
 const [typeFilter, setTypeFilter] = useState<string | null>(null)
const [filters, setFilters] = useState<Record<string, string | null>>({})
 const handleUpload = useCallback(() => router.push("/knowledge/documents/new"), [router])
 useHotkey("u", handleUpload)

 useEffect(() => {
 fetch("/api/knowledge/documents")
 .then((r) => r.json())
 .then((data) => { setDocuments(data); setLoading(false) })
 .catch(() => setLoading(false))
 }, [])

const filterColumns: FilterColumn[] = [
  { key: "type", label: "Type", getValue: (p: Document) => p.type },
  { key: "uploadedBy", label: "Uploaded By", getValue: (p: Document) => p.uploadedBy },
  { key: "relatedTo", label: "Related To", getValue: (p: Document) => p.relatedTo || "" },
]

const filtered = documents.filter((d) => {
  const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase())
  const matchesType = !typeFilter || d.type === typeFilter
  const matchesFilters = Object.entries(filters).every(([key, value]) => {
    if (!value) return true
    const col = filterColumns.find((c) => c.key === key)
    return col ? col.getValue(d) === value : true
  })
  return matchesSearch && matchesType && matchesFilters
})

const columns = [
  { key: "name", label: "Name", render: (item) => {
  const Icon = fileIcons[item.fileType]
  return (
  <div className="flex items-center gap-3">
  <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center shrink-0">
  {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
  </div>
  <div>
  <p className="text-sm font-medium">{item.name}</p>
  <p className="text-xs text-muted-foreground">{item.size}</p>
  </div>
  </div>
  )
  }},
  { key: "type", label: "Type", render: (item) => (
  <Badge variant={typeColors[item.type] || "outline"} className="text-[10px] px-1.5 py-0 font-normal">
  {item.type}
  </Badge>
  )},
  { key: "relatedTo", label: "Related To", render: (item) => <span className="text-sm text-muted-foreground">{item.relatedTo || "—"}</span> },
  { key: "uploadedBy", label: "Uploaded By", render: (item) => <span className="text-sm">{item.uploadedBy}</span> },
  { key: "uploadedAt", label: "Uploaded", render: (item) => <span className="text-sm text-muted-foreground">{formatDate(new Date(item.uploadedAt))}</span> },
  { key: "actions", label: "", render: (item) => (
  <div className="flex items-center gap-1">
  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={(e) => { e.stopPropagation(); router.push(`/knowledge/documents/${item.id}`) }}>
  </Button>
  {item.filePath ? (
  <a href={item.filePath} download onClick={(e) => e.stopPropagation()}>
  <Button variant="ghost" size="icon" className="w-7 h-7">
  </Button>
  </a>
  ) : (
  <Button variant="ghost" size="icon" className="w-7 h-7 opacity-30" disabled>
  </Button>
  )}
  <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive">
  </Button>
  </div>
  )},
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Document Center</h1>
          <p>Uploaded files — PO, invoices, delivery notes, and more</p>
        </div>
        <Button className="gap-1.5" onClick={handleUpload}>Upload Document <ShortcutBadge shortcut="⌘U" /></Button>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={documents} />
        <div className="flex gap-1.5">
          {["PO", "Invoice", "Delivery Note", "Report", "Other"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? null : t)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === t ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={6} columns={columns.length} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icons={[<FileText className="w-5 h-5" />, <FileSpreadsheet className="w-5 h-5" />, <FileImage className="w-5 h-5" />]}
          title="No documents found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div data-slot="frame">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.className}>{col.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/knowledge/documents/${item.id}`)}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.cellClassName}>
                      {col.render ? col.render(item) : String((item as any)[col.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
