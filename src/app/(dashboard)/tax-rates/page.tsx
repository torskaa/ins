"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SemanticBadge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BadgePercent, Percent, Receipt, Search } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"

type TaxRate = { id: string; name: string; rate: number; type: string; isDefault: boolean; isActive: boolean }

const PROPERTY_OPTIONS = [
  { key: "rate", label: "Rate" },
  { key: "type", label: "Type" },
  { key: "isDefault", label: "Default" },
  { key: "isActive", label: "Status" },
]

const DEFAULT_PROPS = ["rate", "type", "isDefault", "isActive"]
const PAGE_SIZE = 10

export default function TaxRatesPage() {
  const router = useRouter()
  const [rates, setRates] = useState<TaxRate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [page, setPage] = useState(1)
  const handleNew = useCallback(() => router.push("/tax-rates/new"), [router])
  useHotkey("c", handleNew)

  useEffect(() => {
    fetch("/api/tax-rates").then(r => r.json()).then(json => { if (json?.success && Array.isArray(json.data)) setRates(json.data); else if (!json?.success) throw new Error(json?.error || "Failed to load") }).catch((err) => { setError(err.message); setLoading(false) }).finally(() => setLoading(false))
  }, [])

  const filterColumns: FilterColumn[] = [
    { key: "name", label: "Name", getValue: (r: TaxRate) => r.name },
    { key: "type", label: "Type", getValue: (r: TaxRate) => r.type },
    { key: "isActive", label: "Status", getValue: (r: TaxRate) => r.isActive ? "Active" : "Inactive" },
  ]

  const filtered = rates.filter((item) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const col = filterColumns.find((c) => c.key === key)
      if (col && col.getValue(item) !== value) return false
    }
    if (!search) return true
    return [item.name, item.type].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
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
      label: "Tax Rate",
      render: (r: TaxRate) => (
        <div>
          <p className="font-medium">{r.name}</p>
          <p className="text-xs text-foreground">{r.type === "vat" ? "VAT" : r.type === "withholding" ? "Withholding" : r.type}</p>
        </div>
      ),
    },
    {
      key: "rate",
      label: "Rate",
      className: "text-right",
      cellClassName: "text-right",
      render: (r: TaxRate) => <span className="font-mono text-sm font-semibold">{r.rate}%</span>,
    },
    {
      key: "isDefault",
      label: "Default",
      render: (r: TaxRate) => r.isDefault ? <SemanticBadge semantic="default" category="status">Default</SemanticBadge> : null,
    },
    {
      key: "isActive",
      label: "Status",
      className: "w-[120px]",
      render: (r: TaxRate) => <SemanticBadge semantic={r.isActive ? "active" : "inactive"} category="status">{r.isActive ? "Active" : "Inactive"}</SemanticBadge>,
    },
    {
      key: "type",
      label: "Type",
      render: (r: TaxRate) => <SemanticBadge semantic={r.type} category="type">{r.type === "vat" ? "VAT" : r.type === "withholding" ? "Withholding" : r.type}</SemanticBadge>,
    },
  ]

  const columns = allColumns.filter((c) => c.key === "name" || props.includes(c.key))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tax Rates</h1>
          <p className="text-sm text-foreground mt-1">Manage VAT, withholding tax, and other tax rates</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => router.push("/tax-rates/reports")} className="gap-1.5">Tax Reports</Button>
          <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>
            New Tax Rate <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘C</kbd>
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 [&_.text-muted-foreground]:text-foreground">
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={rates} />
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
              <Input placeholder="Search tax rates..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
          <MoreMenu actions={[
            { label: "New Tax Rate", icon: ActionIcons.AddNew, onClick: handleNew },
            { label: "Tax Reports", icon: ActionIcons.ViewAll, onClick: () => router.push("/tax-rates/reports") },
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
        <EmptyState
          icons={[<Percent className="w-5 h-5" />, <BadgePercent className="w-5 h-5" />, <Receipt className="w-5 h-5" />]}
          title="No tax rates"
          description="Add VAT and withholding tax rates."
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
                  onClick={() => router.push(`/tax-rates/${item.id}/edit`)}
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
