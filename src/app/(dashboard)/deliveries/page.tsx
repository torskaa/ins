"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { SemanticBadge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MapPin, Package, Search, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { downloadCSV, downloadPDF } from "@/lib/export"
import { format } from "date-fns"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { UploadFileMain } from "@/components/upload/upload-file-main"
import { useUploadImport } from "@/hooks/use-upload-import"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"

type Delivery = {
 id: string
 number: string
 status: string
 carrier: string | null
 estimatedDate: string | null
 totalItems: number
 totalValue: number
 distributor: { id: string; name: string; territory: string | null }
 _count: { items: number; tracking: number }
}

const PROPERTY_OPTIONS = [
 { key: "distributor", label: "Distributor" },
 { key: "carrier", label: "Carrier" },
 { key: "estimatedDate", label: "Est. Date" },
 { key: "totalItems", label: "Items" },
]

const DEFAULT_PROPS = ["distributor", "carrier", "estimatedDate", "totalItems"]
const PAGE_SIZE = 10

export default function DeliveriesPage() {
 const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
 const [search, setSearch] = useState("")
 const [view, setView] = useState<"cards" | "rows">("rows")
 const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [page, setPage] = useState(1)
  const router = useRouter()
 const handleNew = useCallback(() => router.push("/deliveries/new"), [router])
 useHotkey("c", handleNew)
 const [uploadOpen, setUploadOpen] = useState(false)
 const { files, addFiles, removeFile } = useUploadImport("deliveries")
 useHotkey("u", () => setUploadOpen(true))

 useEffect(() => {
 fetch("/api/deliveries")
 .then(r => r.json())
  .then((json) => { if (json?.success && Array.isArray(json.data)) setDeliveries(json.data); else if (!json?.success) throw new Error(json?.error || "Failed to load") })
  .catch((err) => { setError(err.message); setLoading(false) })
  .finally(() => setLoading(false))
 }, [])

 const filterColumns: FilterColumn[] = [
    { key: "status", label: "Status", getValue: (d: Delivery) => d.status },
    { key: "carrier", label: "Carrier", getValue: (d: Delivery) => d.carrier || "" },
    { key: "distributor", label: "Distributor", getValue: (d: Delivery) => d.distributor.name },
 ]

  const filtered = deliveries.filter((d) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const col = filterColumns.find((c) => c.key === key)
      if (col && col.getValue(d) !== value) return false
    }
    if (!search) return true
    return [d.number, d.status, d.distributor.name, d.carrier]
    .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const safePage = Math.min(page, Math.max(totalPages, 1))
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, filters])

  const allColumns = [
 {
  key: "number",
  label: "Number",
  render: (d: Delivery) => (
  <span className="font-mono text-xs font-medium">{d.number}</span>
  ),
 },
 {
 key: "status",
 label: "Status",
 render: (d: Delivery) => <SemanticBadge semantic={d.status} category="status" className="">{d.status}</SemanticBadge>,
 },
 {
 key: "distributor",
 label: "Distributor",
 render: (d: Delivery) => (
  <div className="text-sm">
  <span className="font-medium">{d.distributor.name}</span>
   {d.distributor.territory && <span className="block text-xs text-foreground">{d.distributor.territory}</span>}
  </div>
  ),
 },
   {
   key: "carrier",
   label: "Carrier",
   render: (d: Delivery) => <span className="text-sm text-foreground">{d.carrier || "—"}</span>,
   },
   {
   key: "estimatedDate",
   label: "Est. Date",
   render: (d: Delivery) => (
   <span className="text-sm text-foreground">
   {d.estimatedDate ? format(new Date(d.estimatedDate), "dd/MM/yy") : "—"}
   </span>
   ),
   },
   {
   key: "totalItems",
   label: "Items",
   className: "text-right",
   cellClassName: "text-right font-mono text-sm",
   render: (d: Delivery) => <span>{d.totalItems}</span>,
   },
 ]

  const columns = allColumns.filter((c) => c.key === "number" || props.includes(c.key))

  return (
 <div className="space-y-6 animate-fade-in">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold tracking-tight">Deliveries</h1>
  <p className="text-sm text-foreground mt-1">Track and manage deliveries to distributors</p>
 </div>
 <div className="flex items-center gap-2">
  <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setUploadOpen(true)}>  Upload file <kbd className="text-[9px] px-1 py-0.5 rounded bg-muted/20 text-primary-foreground font-mono ml-0.5">⌘U</kbd></Button>
   <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>New Delivery <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘C</kbd>
  </Button>
 </div>
 </div>

  <div className="flex items-center justify-between flex-wrap gap-3 [&_.text-muted-foreground]:text-foreground">
  <div className="flex items-center gap-3">
    {filtered.length > 0 && (
      <>
        <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={deliveries} />
        <ViewToggle view={view} onChange={setView} />
        <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
      </>
    )}
  </div>
  <div className="flex items-center gap-3">
    {filtered.length > 0 && (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground" />
        <Input placeholder="Search deliveries..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
    )}
    <MoreMenu actions={[
      { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Number", "Status", "Distributor", "Carrier", "Est.Date", "Items", "Value"], filtered.map(d => [d.number, d.status, d.distributor.name, d.carrier || "", d.estimatedDate, d.totalItems, d.totalValue]), "deliveries.csv") },
      { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Deliveries", []) },
    ]} />
  </div>
  </div>

 {error ? (
  <EmptyState
    variant="error"
    title="Failed to load data"
    description={error}
    actions={[{ label: "Try again", onClick: () => window.location.reload() }]}
  />
  ) : loading ? (
  <SkeletonTable rows={6} columns={columns.length} />
  ) : filtered.length === 0 ? (
  <EmptyState
  icons={[<Truck className="w-5 h-5" />, <Package className="w-5 h-5" />, <MapPin className="w-5 h-5" />]}
  title="No deliveries found"
  description="Create your first delivery."
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
  <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/deliveries/${item.id}`)}>
  {columns.map((col) => (
 <TableCell key={col.key} className={col.cellClassName}>
 {col.render ? col.render(item) : String((item as any)[col.key] ?? "")}
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
  <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
    <DialogContent hideCloseButton className="sm:max-w-lg p-0 gap-0 overflow-hidden">
      <UploadFileMain
        files={files}
        onFilesChange={addFiles}
        onFileRemove={removeFile}
        onClose={() => setUploadOpen(false)}
        moduleLabel="deliveries files"
      />
    </DialogContent>
  </Dialog>
  </div>
  )
}
