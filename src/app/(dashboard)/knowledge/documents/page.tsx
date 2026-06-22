"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { SemanticBadge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"

import { AlertTriangle, Search, Upload, FileText, FileSpreadsheet, FileImage, FileArchive, File as FileIcon } from "lucide-react"
import { formatDate } from "@/lib/utils"

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

const typeColors: Record<string, "primary" | "secondary" | "outline" | "destructive"> = {
  PO: "primary",
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

const PROPERTY_OPTIONS = [
  { key: "type", label: "Type" },
  { key: "relatedTo", label: "Related To" },
  { key: "uploadedBy", label: "Uploaded By" },
  { key: "uploadedAt", label: "Uploaded" },
]

const DEFAULT_PROPS = ["type", "relatedTo", "uploadedBy", "uploadedAt"]
const PAGE_SIZE = 10

export default function DocumentsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const handleUpload = useCallback(() => router.push("/knowledge/documents/new"), [router])
  useHotkey("u", handleUpload)

  useEffect(() => {
    fetch("/api/knowledge/documents")
      .then((r) => r.json())
      .then((json) => { if (json?.success) setDocuments(json.data); else throw new Error(json?.error || "Failed to load"); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [])

  const filterColumns: FilterColumn[] = [
    { key: "type", label: "Type", getValue: (p: Document) => p.type },
    { key: "uploadedBy", label: "Uploaded By", getValue: (p: Document) => p.uploadedBy },
    { key: "relatedTo", label: "Related To", getValue: (p: Document) => p.relatedTo || "" },
  ]

  const filtered = documents.filter((d) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const col = filterColumns.find((c) => c.key === key)
      if (col && col.getValue(d) !== value) return false
    }
    const matchesSearch = !search || d.name.toLowerCase().includes(search.toLowerCase())
    const matchesType = !typeFilter || d.type === typeFilter
    return matchesSearch && matchesType
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const safePage = Math.min(page, Math.max(totalPages, 1))
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, filters, typeFilter])

  const allColumns = [
    {
      key: "name",
      label: "Name",
      className: undefined,
      cellClassName: undefined,
      render: (item: Document) => {
        const Icon = fileIcons[item.fileType]
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center shrink-0">
              {Icon && <Icon className="w-4 h-4 text-foreground" />}
            </div>
            <div>
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-foreground">{item.size}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: "type",
      label: "Type",
      className: undefined,
      cellClassName: undefined,
      render: (item: Document) => (
        <SemanticBadge semantic={item.type} category="type" className="text-[10px] px-1.5 py-0">
          {item.type}
        </SemanticBadge>
      ),
    },
    {
      key: "relatedTo",
      label: "Related To",
      className: undefined,
      cellClassName: undefined,
      render: (item: Document) => <span className="text-sm text-foreground">{item.relatedTo || "—"}</span>,
    },
    {
      key: "uploadedBy",
      label: "Uploaded By",
      className: undefined,
      cellClassName: undefined,
      render: (item: Document) => <span className="text-sm text-foreground">{item.uploadedBy}</span>,
    },
    {
      key: "uploadedAt",
      label: "Uploaded",
      className: "w-[140px]",
      cellClassName: undefined,
      render: (item: Document) => <span className="text-sm text-foreground">{formatDate(new Date(item.uploadedAt))}</span>,
    },
  ]

  const columns = allColumns.filter((c) => c.key === "name" || props.includes(c.key))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Document Center</h1>
          <p className="text-sm text-foreground mt-1">Uploaded files — PO, invoices, delivery notes, and more</p>
        </div>
        <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleUpload}>
          Upload Document <kbd className="text-[9px] px-1 py-0.5 rounded bg-muted/20 text-primary-foreground font-mono ml-0.5">⌘U</kbd>
        </Button>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 [&_.text-muted-foreground]:text-foreground">
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <>
              <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={documents} />
              <ViewToggle view={view} onChange={setView} />
              <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground" />
              <Input placeholder="Search documents..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
          <MoreMenu actions={[
            { label: "Upload Document", icon: ActionIcons.AddNew, onClick: handleUpload },
            "separator",
            { label: "Refresh", icon: ActionIcons.Refresh },
          ]} />
        </div>
      </div>

      <div className="flex gap-1.5">
        {["PO", "Invoice", "Delivery Note", "Report", "Other"].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(typeFilter === t ? null : t)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              typeFilter === t ? "bg-primary text-primary-foreground" : "bg-surface text-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error ? (
        <div className="animate-fade-in pb-8 space-y-4">
          <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
        </div>
      ) : loading ? (
        <SkeletonTable rows={6} columns={columns.length} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icons={[<FileText className="w-5 h-5" />, <FileSpreadsheet className="w-5 h-5" />, <FileImage className="w-5 h-5" />]}
          title="No documents found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div data-slot="frame">
          <Table className="[&_th]:px-4 [&_td]:px-4 [&_th]:py-3 [&_td]:py-3">
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.className}>{col.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/knowledge/documents/${item.id}`)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.cellClassName}>
                      {col.render(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={(e) => { e.preventDefault(); setPage(safePage - 1) }}
                    className={safePage <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === safePage}
                      onClick={(e) => { e.preventDefault(); setPage(p) }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={(e) => { e.preventDefault(); setPage(safePage + 1) }}
                    className={safePage >= totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  )
}
