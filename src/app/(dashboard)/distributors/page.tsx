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
import { Search, Building2, Globe, Phone, Users } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { SemanticBadge } from "@/components/ui/badge"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
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

type Distributor = {
  id: string
  name: string
  email: string | null
  phone: string | null
  territory: string | null
  status: string
  contactPerson: string | null
  _count: { deliveries: number }
}

const PROPERTY_OPTIONS = [
  { key: "contactPerson", label: "Contact" },
  { key: "phone", label: "Phone" },
  { key: "territory", label: "Territory" },
  { key: "status", label: "Status" },
  { key: "deliveries", label: "Deliveries" },
]

const DEFAULT_PROPS = ["contactPerson", "phone", "territory", "status", "deliveries"]
const PAGE_SIZE = 10

export default function DistributorsPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [page, setPage] = useState(1)
  const router = useRouter()
  const handleNew = useCallback(() => router.push("/distributors/new"), [router])
  useHotkey("c", handleNew)

  useEffect(() => {
    fetch("/api/distributors")
      .then((r) => r.json())
      .then((json) => { if (json?.success && Array.isArray(json.data)) setDistributors(json.data); else if (!json?.success) throw new Error(json?.error || "Failed to load") })
      .catch((err) => { setError(err.message); setLoading(false) })
      .finally(() => setLoading(false))
  }, [])

  const filterColumns: FilterColumn[] = [
    { key: "name", label: "Name", getValue: (p: Distributor) => p.name },
    { key: "territory", label: "Territory", getValue: (p: Distributor) => p.territory || "" },
    { key: "status", label: "Status", getValue: (p: Distributor) => p.status },
  ]

  const filtered = distributors.filter((d) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const col = filterColumns.find((c) => c.key === key)
      if (col && col.getValue(d) !== value) return false
    }
    if (!search) return true
    return [d.name, d.contactPerson, d.email, d.phone, d.territory, d.status]
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
      key: "name",
      label: "Name",
      render: (d: Distributor) => <span className="font-medium">{d.name}</span>,
    },
    {
      key: "contactPerson",
      label: "Contact",
      render: (d: Distributor) => (
        <div>
          {d.contactPerson && <p className="font-medium">{d.contactPerson}</p>}
          {d.email && <p className="text-xs text-foreground">{d.email}</p>}
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (d: Distributor) => <span className="font-mono text-sm text-foreground">{d.phone || "—"}</span>,
    },
    {
      key: "territory",
      label: "Territory",
      render: (d: Distributor) => <span className="text-sm text-foreground">{d.territory || "—"}</span>,
    },
    {
      key: "status",
      label: "Status",
      className: "w-[120px]",
      render: (d: Distributor) => (
        <SemanticBadge semantic={d.status} category="status" className="">
          {d.status}
        </SemanticBadge>
      ),
    },
    {
      key: "deliveries",
      label: "Deliveries",
      className: "text-right",
      cellClassName: "text-right",
      render: (d: Distributor) => <span className="font-mono text-sm">{d._count?.deliveries || 0}</span>,
    },
  ]

  const columns = allColumns.filter((c) => c.key === "name" || props.includes(c.key))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Distributors</h1>
          <p className="text-sm text-foreground mt-1">Manage your distribution network</p>
        </div>
        <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>
          New Distributor <ShortcutBadge shortcut="⌘C" />
        </Button>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 [&_.text-muted-foreground]:text-foreground">
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={distributors} />
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
              <Input placeholder="Search distributors..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
          <MoreMenu actions={[
            { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Name", "Contact", "Phone", "Territory", "Status", "Deliveries"], distributors.map(d => [d.name, d.contactPerson || "", d.phone || "", d.territory || "", d.status, d._count?.deliveries]), "distributors.csv") },
            { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Distributors", []) },
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
          icons={[<Building2 className="w-5 h-5" />, <Users className="w-5 h-5" />, <Globe className="w-5 h-5" />]}
          title="No distributors yet"
          description="Add your first distributor to start managing distribution."
          actions={[{ label: "New Distributor", onClick: () => router.push("/distributors/new") }]}
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
                <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/distributors/${item.id}`)}>
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
