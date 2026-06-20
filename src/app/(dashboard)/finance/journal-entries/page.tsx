"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SemanticBadge } from "@/components/ui/badge"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { AlertTriangle, BookOpen, FileText, Receipt, Search } from "lucide-react"
import { useHotkey } from "@/hooks/use-hotkey"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"

type JournalEntry = { id: string; number: string; date: string; description: string; totalDebit: number; totalCredit: number; status: string; referenceType: string; lines: { account: { name: string } }[] }

const PROPERTY_OPTIONS = [
  { key: "date", label: "Date" },
  { key: "description", label: "Description" },
  { key: "referenceType", label: "Reference" },
  { key: "totalDebit", label: "Debit" },
  { key: "totalCredit", label: "Credit" },
  { key: "status", label: "Status" },
]

const DEFAULT_PROPS = ["date", "description", "referenceType", "totalDebit", "totalCredit", "status"]
const PAGE_SIZE = 10

export default function JournalEntriesPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [page, setPage] = useState(1)
  const handleNew = useCallback(() => router.push("/finance/journal-entries/new"), [router])
  useHotkey("c", handleNew)

  useEffect(() => {
    fetch("/api/finance/journal-entries").then(r => r.json()).then(json => { if (json?.success && json.data?.entries) setEntries(json.data.entries); else if (!json?.success) throw new Error(json?.error || "Failed to load") }).catch((err) => { setError(err.message); setLoading(false) }).finally(() => setLoading(false))
  }, [])

  const filterColumns: FilterColumn[] = [
    { key: "status", label: "Status", getValue: (e: any) => e.status },
    { key: "type", label: "Type", getValue: (e: any) => e.referenceType },
  ]

  const filtered = entries.filter((item) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const col = filterColumns.find((c) => c.key === key)
      if (col && col.getValue(item) !== value) return false
    }
    if (!search) return true
    return [item.number, item.description, item.referenceType].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
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
      className: "w-[140px]",
      render: (e: JournalEntry) => <span className="font-mono text-xs font-medium">{e.number}</span>,
    },
    {
      key: "date",
      label: "Date",
      className: "w-[120px]",
      render: (e: JournalEntry) => <span className="text-sm">{formatDate(new Date(e.date))}</span>,
    },
    {
      key: "description",
      label: "Description",
      render: (e: JournalEntry) => <span className="text-sm truncate max-w-[200px] block">{e.description || "—"}</span>,
    },
    {
      key: "referenceType",
      label: "Reference",
      className: "w-[120px]",
      render: (e: JournalEntry) => e.referenceType ? <SemanticBadge semantic={e.referenceType || "reference"} category="type" className="text-xs">{e.referenceType}</SemanticBadge> : <span className="text-muted-foreground">—</span>,
    },
    {
      key: "totalDebit",
      label: "Debit",
      className: "text-right",
      cellClassName: "text-right",
      render: (e: JournalEntry) => <span className="font-mono text-sm">{formatCurrency(e.totalDebit)}</span>,
    },
    {
      key: "totalCredit",
      label: "Credit",
      className: "text-right",
      cellClassName: "text-right",
      render: (e: JournalEntry) => <span className="font-mono text-sm">{formatCurrency(e.totalCredit)}</span>,
    },
    {
      key: "status",
      label: "Status",
      className: "w-[120px]",
      render: (e: JournalEntry) => <SemanticBadge semantic={e.status} category="status" className="">{e.status}</SemanticBadge>,
    },
  ]

  const columns = allColumns.filter((c) => c.key === "number" || props.includes(c.key))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Journal Entries</h1>
          <p className="text-sm text-foreground mt-1">Record and manage general ledger entries</p>
        </div>
        <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>New Entry <ShortcutBadge shortcut="⌘C" /></Button>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 [&_.text-muted-foreground]:text-foreground">
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={entries} />
          )}
          {filtered.length > 0 && (
            <>
              <ViewToggle view={view} onChange={setView} />
              <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground" />
              <Input placeholder="Search entries..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div className="animate-fade-in pb-8 space-y-4">
          <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
        </div>
      ) : loading ? (
        <SkeletonTable rows={6} columns={columns.length} />
      ) : filtered.length === 0 ? (
        <EmptyState icons={[<BookOpen className="w-5 h-5" />, <FileText className="w-5 h-5" />, <Receipt className="w-5 h-5" />]} title="No journal entries yet" description="Create your first journal entry." />
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
                <TableRow key={item.id} onClick={() => router.push(`/finance/journal-entries/${item.id}`)} className="cursor-pointer">
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
