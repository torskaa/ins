"use client"

import { useState, useEffect, useCallback } from "react"
import { SemanticBadge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { File, FileSignature, FileText, Search } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { downloadCSV, downloadPDF } from "@/lib/export"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"

type Quotation = {
  id: string
  number: string
  status: string
  total: number
  validUntil: string
  customer: { name: string }
}

const PROPERTY_OPTIONS = [
  { key: "customer", label: "Customer" },
  { key: "total", label: "Total" },
  { key: "status", label: "Status" },
  { key: "validUntil", label: "Valid Until" },
]

const DEFAULT_PROPS = ["customer", "total", "status", "validUntil"]
const PAGE_SIZE = 10

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [page, setPage] = useState(1)
  const router = useRouter()
  const handleNew = useCallback(() => router.push("/quotations/new"), [router])
  useHotkey("c", handleNew)

  useEffect(() => {
    fetch("/api/quotations")
      .then(r => r.json())
      .then((json) => { if (json?.success && Array.isArray(json.data)) setQuotations(json.data); else if (!json?.success) throw new Error(json?.error || "Failed to load") })
      .catch((err) => { setError(err.message); setLoading(false) })
      .finally(() => setLoading(false))
  }, [])

  const filterColumns: FilterColumn[] = [
    { key: "status", label: "Status", getValue: (q: Quotation) => q.status },
    { key: "customer", label: "Customer", getValue: (q: Quotation) => q.customer?.name ?? "" },
  ]

  const filtered = quotations.filter((item) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const col = filterColumns.find((c) => c.key === key)
      if (col && col.getValue(item) !== value) return false
    }
    if (!search) return true
    return [item.number, item.status, item.customer?.name].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
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
      label: "Quotation #",
      className: "w-[140px]",
      render: (q: Quotation) => <span className="font-mono text-xs font-medium">{q.number}</span>,
    },
    {
      key: "customer",
      label: "Customer",
      className: "w-[180px]",
      render: (q: Quotation) => <span className="font-medium">{q.customer?.name}</span>,
    },
    {
      key: "total",
      label: "Total",
      className: "text-right",
      cellClassName: "text-right",
      render: (q: Quotation) => <span className="font-mono text-sm font-medium">{formatCurrency(q.total)}</span>,
    },
    {
      key: "status",
      label: "Status",
      className: "w-[120px]",
      render: (q: Quotation) => (
        <SemanticBadge semantic={q.status} category="status" className="">
          {q.status}
        </SemanticBadge>
      ),
    },
    {
      key: "validUntil",
      label: "Valid Until",
      render: (q: Quotation) => <span className="text-sm text-foreground">{formatDate(new Date(q.validUntil))}</span>,
    },
  ]

  const columns = allColumns.filter((c) => c.key === "number" || props.includes(c.key))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quotations</h1>
          <p className="text-sm text-foreground mt-1">Create and manage customer quotations</p>
        </div>
        <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>
          New Quotation <ShortcutBadge shortcut="⌘C" />
        </Button>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 [&_.text-muted-foreground]:text-foreground">
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <>
              <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={quotations} />
              <ViewToggle view={view} onChange={setView} />
              <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground" />
              <Input placeholder="Search..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
          <MoreMenu actions={[
            { label: "Import", icon: ActionIcons.AddNew },
            "separator",
            { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Quotation #", "Customer", "Status", "Total", "Valid Until"], quotations.map(q => [q.number, q.customer?.name, q.status, q.total, q.validUntil]), "quotations.csv") },
            { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Quotations", []) },
            "separator",
            { label: "Refresh", icon: ActionIcons.Refresh },
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
        <EmptyState icons={[<FileSignature className="w-5 h-5" />, <FileText className="w-5 h-5" />, <File className="w-5 h-5" />]} title="No quotations yet" description="Create your first quotation from product catalog data." actions={[{ label: "Create Quotation", onClick: () => router.push("/quotations/new") }]} />
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
                <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/quotations/${item.id}`)}>
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
    </div>
  )
}
