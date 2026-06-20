"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { SemanticBadge } from "@/components/ui/badge"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { AlertTriangle, Search, Wrench, Activity, Settings2 } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { useHotkey } from "@/hooks/use-hotkey"
import { downloadCSV, downloadPDF } from "@/lib/export"
import { formatCurrency } from "@/lib/utils"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"

type WorkCenter = {
  id: string
  code: string
  name: string
  costPerHour: number
  capacity: number
  location: string | null
  isActive: boolean
}

const PROPERTY_OPTIONS = [
  { key: "code", label: "Code" },
  { key: "costPerHour", label: "Cost/hr" },
  { key: "capacity", label: "Capacity" },
  { key: "location", label: "Location" },
  { key: "isActive", label: "Status" },
]

const DEFAULT_PROPS = ["code", "costPerHour", "capacity", "location", "isActive"]
const PAGE_SIZE = 10

export default function WorkCentersPage() {
  const [data, setData] = useState<WorkCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [page, setPage] = useState(1)
  const router = useRouter()
  const handleNew = useCallback(() => router.push("/production/work-centers/new"), [router])
  useHotkey("c", handleNew)

  useEffect(() => {
    fetch("/api/work-centers")
      .then((r) => r.json())
      .then((json) => { if (json?.success && Array.isArray(json.data)) setData(json.data); else if (!json?.success) throw new Error(json?.error || "Failed to load") })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [])

  const filterColumns: FilterColumn[] = [
    { key: "isActive", label: "Status", getValue: (p: WorkCenter) => p.isActive ? "Active" : "Inactive" },
    { key: "location", label: "Location", getValue: (p: WorkCenter) => p.location || "" },
  ]

  const filtered = data.filter((w) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const col = filterColumns.find((c) => c.key === key)
      if (col && col.getValue(w) !== value) return false
    }
    if (!search) return true
    return [w.code, w.name, w.location]
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
      key: "code",
      label: "Code",
      render: (w: WorkCenter) => <span className="font-mono text-xs font-medium">{w.code}</span>,
    },
    {
      key: "name",
      label: "Name",
      render: (w: WorkCenter) => (
        <div>
          <p className="font-medium">{w.name}</p>
          {w.location && <p className="text-xs text-foreground">{w.location}</p>}
        </div>
      ),
    },
    {
      key: "costPerHour",
      label: "Cost/hr",
      className: "text-right",
      cellClassName: "text-right",
      render: (w: WorkCenter) => <span className="font-mono text-sm">{formatCurrency(w.costPerHour)}</span>,
    },
    {
      key: "capacity",
      label: "Capacity",
      className: "text-right",
      cellClassName: "text-right",
      render: (w: WorkCenter) => <span className="font-mono text-sm">{w.capacity}</span>,
    },
    {
      key: "isActive",
      label: "Status",
      className: "w-[120px]",
      render: (w: WorkCenter) => (
        <SemanticBadge semantic={w.isActive ? "active" : "inactive"} category="status" className="">
          {w.isActive ? "Active" : "Inactive"}
        </SemanticBadge>
      ),
    },
  ]

  const columns = allColumns.filter((c) => c.key === "name" || props.includes(c.key))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Work Centers</h1>
          <p className="text-sm text-foreground mt-1">Manage production work centers and cost rates</p>
        </div>
        <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>
          New Work Center <ShortcutBadge shortcut="⌘C" />
        </Button>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 [&_.text-muted-foreground]:text-foreground">
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={data} />
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
              <Input placeholder="Search work centers..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
          <MoreMenu actions={[
            { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Code", "Name", "Cost/hr", "Capacity", "Location", "Status"], data.map(w => [w.code, w.name, w.costPerHour, w.capacity, w.location || "", w.isActive ? "Active" : "Inactive"]), "work-centers.csv") },
            { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Work Centers", []) },
          ]} />
        </div>
      </div>

      {error ? (
        <div className="animate-fade-in pb-8 space-y-4">
          <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
        </div>
      ) : loading ? (
        <SkeletonTable rows={6} columns={columns.length} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icons={[<Wrench className="w-5 h-5" />, <Activity className="w-5 h-5" />, <Settings2 className="w-5 h-5" />]}
          title="No work centers yet"
          description="Add your first work center to start production planning."
          actions={[{ label: "New Work Center", onClick: () => router.push("/production/work-centers/new") }]}
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
                <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/production/work-centers/${item.id}`)}>
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
