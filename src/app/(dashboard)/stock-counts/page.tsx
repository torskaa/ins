"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { SemanticBadge } from "@/components/ui/badge"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Calculator, ClipboardList, Search, Warehouse } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { downloadCSV, downloadPDF } from "@/lib/export"
import { format } from "date-fns"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"

type StockCount = {
 id: string
 number: string
 status: string
 countDate: string
 totalItems: number
 matchedItems: number
 discrepancyItems: number
 warehouse: { id: string; name: string; location: string | null }
 _count: { items: number }
}

const PROPERTY_OPTIONS = [
 { key: "warehouse", label: "Warehouse" },
 { key: "countDate", label: "Count Date" },
 { key: "totalItems", label: "Items" },
 { key: "discrepancyItems", label: "Discrepancies" },
]

const DEFAULT_PROPS = ["warehouse", "countDate", "totalItems", "discrepancyItems"]
const PAGE_SIZE = 10

export default function StockCountsPage() {
 const [stockCounts, setStockCounts] = useState<StockCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
 const [search, setSearch] = useState("")
 const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
   const [filters, setFilters] = useState<Record<string, string | null>>({})
   const [page, setPage] = useState(1)
   const router = useRouter()
 const handleNew = useCallback(() => router.push("/stock-counts/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/stock-counts")
 .then(r => r.json())
  .then((json) => { if (json?.success && Array.isArray(json.data)) setStockCounts(json.data); else if (!json?.success) throw new Error(json?.error || "Failed to load") })
  .catch((err) => { setError(err.message); setLoading(false) })
  .finally(() => setLoading(false))
 }, [])

  const filterColumns: FilterColumn[] = [
   { key: "status", label: "Status", getValue: (s: StockCount) => s.status },
   { key: "warehouse", label: "Warehouse", getValue: (s: StockCount) => s.warehouse.name },
  ]

  const filtered = stockCounts.filter((s) => {
   for (const [key, value] of Object.entries(filters)) {
    if (!value) continue
    const col = filterColumns.find((c) => c.key === key)
    if (col && col.getValue(s) !== value) return false
   }
   if (!search) return true
   return [s.number, s.status, s.warehouse.name].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
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
  render: (s: StockCount) => (
  <span className="font-mono text-xs font-medium">{s.number}</span>
  ),
  },
  {
  key: "status",
  label: "Status",
  render: (s: StockCount) => <SemanticBadge semantic={s.status} category="status" className="">{s.status.replace(/_/g, " ")}</SemanticBadge>,
  },
  {
  key: "warehouse",
  label: "Warehouse",
  render: (s: StockCount) => (
  <div className="text-sm">
  <span className="font-medium">{s.warehouse.name}</span>
   {s.warehouse.location && <span className="block text-xs text-foreground">{s.warehouse.location}</span>}
  </div>
  ),
  },
   {
   key: "countDate",
   label: "Count Date",
   render: (s: StockCount) => <span className="text-sm text-foreground">{format(new Date(s.countDate), "dd/MM/yy")}</span>,
   },
   {
   key: "totalItems",
   label: "Items",
   className: "text-right",
   cellClassName: "text-right font-mono text-sm",
   render: (s: StockCount) => <span>{s.totalItems}</span>,
   },
   {
   key: "discrepancyItems",
   label: "Discrepancies",
   className: "text-right",
   cellClassName: "text-right",
   render: (s: StockCount) => (
   <span className={`font-mono text-sm ${s.discrepancyItems > 0 ? "text-destructive font-semibold" : "text-foreground"}`}>
   {s.discrepancyItems}
   </span>
   ),
   },
 ]

 const columns = allColumns.filter((c) => c.key === "number" || props.includes(c.key))

 return (
 <div className="space-y-6 animate-fade-in">
  <div className="flex items-center justify-between">
  <div>
  <h1 className="text-2xl font-semibold tracking-tight">Stock Counts</h1>
  <p className="text-sm text-foreground mt-1">Inventory counting sessions and discrepancy reports</p>
  </div>
  <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>
   New Stock Count <ShortcutBadge shortcut="⌘C" />
  </Button>
  </div>
  <div className="flex items-center justify-between flex-wrap gap-3 [&_.text-muted-foreground]:text-foreground">
    <div className="flex items-center gap-3">
     {filtered.length > 0 && (
      <>
       <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={stockCounts} />
       <ViewToggle view={view} onChange={setView} />
       <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
      </>
     )}
    </div>
    <div className="flex items-center gap-3">
     {filtered.length > 0 && (
      <div className="relative">
       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground" />
       <Input placeholder="Search stock counts..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
     )}
     <MoreMenu actions={[
      { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Number", "Status", "Warehouse", "Count Date", "Items", "Matched", "Discrepancies"], stockCounts.map(s => [s.number, s.status, s.warehouse.name, s.countDate, s.totalItems, s.matchedItems, s.discrepancyItems]), "stock-counts.csv") },
      { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Stock Counts", []) },
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
     icons={[<ClipboardList className="w-5 h-5" />, <Warehouse className="w-5 h-5" />, <Calculator className="w-5 h-5" />]}
     title="No stock counts yet"
     description="Start your first inventory count session."
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
         {paginated.map((s) => (
         <TableRow key={s.id} className="cursor-pointer" onClick={() => router.push(`/stock-counts/${s.id}`)}>
         {columns.map((col) => (
          <TableCell key={col.key} className={col.cellClassName}>
           {col.render ? col.render(s) : String((s as any)[col.key] ?? "")}
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
