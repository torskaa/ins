"use client"

import { useState, useEffect, useCallback } from "react"
import { statusBadge } from "@/components/ui/data-table"
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
import { formatCurrency, formatDate } from "@/lib/utils"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { useRouter } from "next/navigation"
import { downloadCSV, downloadPDF } from "@/lib/export"

const quotationStatusColors: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
 draft: "secondary",
 sent: "default",
 confirmed: "success",
 expired: "destructive",
 cancelled: "warning",
}

type Quotation = {
 id: string
 number: string
 status: string
 total: number
 validUntil: string
 customer: { name: string }
}

const PROPERTY_OPTIONS = [
 { key: "total", label: "Total" },
 { key: "status", label: "Status" },
 { key: "validUntil", label: "Valid Until" },
]

const DEFAULT_PROPS = ["total", "status", "validUntil"]

export default function QuotationsPage() {
 const [quotations, setQuotations] = useState<Quotation[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("")
 const [view, setView] = useState<"cards" | "rows">("rows")
const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const router = useRouter()
 const handleNew = useCallback(() => router.push("/quotations/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/quotations")
 .then(r => r.json())
 .then((data) => { if (Array.isArray(data)) setQuotations(data) })
 .finally(() => setLoading(false))
 }, [])

  const filterColumns: FilterColumn[] = [
  { key: "status", label: "Status", getValue: (q) => q.status },
  { key: "customer", label: "Customer", getValue: (q) => q.customer?.name ?? "" },
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

  const allColumns = [
 {
 key: "number",
 label: "Quotation #",
 render: (q) => <span className="font-mono text-xs font-medium">{q.number}</span>,
 },
 {
 key: "customer",
 label: "Customer",
 render: (q) => <span className="font-medium">{q.customer?.name}</span>,
 },
 {
 key: "total",
 label: "Total",
 render: (q) => <span className="font-mono text-sm font-medium">{formatCurrency(q.total)}</span>,
 },
 {
 key: "status",
 label: "Status",
 render: (q) => (
 <span className={statusBadge({ variant: quotationStatusColors[q.status] || "default" })}>
 {q.status}
 </span>
 ),
 },
 {
 key: "validUntil",
 label: "Valid Until",
 render: (q) => <span className="text-sm text-muted-foreground">{formatDate(new Date(q.validUntil))}</span>,
 },
 ]

 const columns = allColumns.filter((c) => props.includes(c.key))

 return (
 <div className="space-y-6 animate-fade-in">
  <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Quotations</h1>
        <p className="text-sm text-muted-foreground mt-1">Create and manage customer quotations</p>
      </div>
      <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>New Quotation <ShortcutBadge shortcut="⌘C" />
      </Button>
    </div>
    <div className="flex items-center justify-between flex-wrap gap-3">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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

  {loading ? (
    <SkeletonTable rows={6} columns={columns.length} />
  ) : filtered.length === 0 ? (
    <EmptyState icons={[<FileSignature className="w-5 h-5" />, <FileText className="w-5 h-5" />, <File className="w-5 h-5" />]} title="No quotations yet" description="Create your first quotation from product catalog data." actions={[{ label: "Create Quotation", onClick: () => router.push("/quotations/new") }]} />
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
    </div>
  )}
 </div>
 )
}
