"use client"

import { useState, useEffect, useCallback } from "react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, FileText, Receipt, Search } from "lucide-react"
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

const invoiceStatusColors: Record<string, "primary" | "secondary" | "success" | "destructive" | "warning"> = {
  draft: "secondary",
  sent: "primary",
  paid: "success",
  overdue: "destructive",
  cancelled: "warning",
}

type Invoice = {
  id: string
  number: string
  status: string
  total: number
  paidAmount: number
  issueDate: string
  dueDate: string
  customer: { name: string }
}

const PROPERTY_OPTIONS = [
  { key: "customer", label: "Customer" },
  { key: "total", label: "Total" },
  { key: "paidAmount", label: "Paid" },
  { key: "status", label: "Status" },
  { key: "dueDate", label: "Due Date" },
]

const DEFAULT_PROPS = ["customer", "total", "paidAmount", "status", "dueDate"]
const PAGE_SIZE = 10

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [page, setPage] = useState(1)
  const router = useRouter()
  const handleCreate = useCallback(() => router.push("/invoices/new"), [router])
  useHotkey("c", handleCreate)

  useEffect(() => {
    fetch("/api/invoices").then(r => r.json()).then((data) => { if (Array.isArray(data)) setInvoices(data) }).finally(() => setLoading(false))
  }, [])

  const filterColumns: FilterColumn[] = [
    { key: "status", label: "Status", getValue: (inv: Invoice) => inv.status },
    { key: "customer", label: "Customer", getValue: (inv: Invoice) => inv.customer?.name ?? "" },
  ]

  const filtered = invoices.filter((inv) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const col = filterColumns.find((c) => c.key === key)
      if (col && col.getValue(inv) !== value) return false
    }
    if (!search) return true
    return [inv.number, inv.status, inv.customer?.name].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
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
      label: "Invoice #",
      className: "w-[140px]",
      render: (inv: Invoice) => <span className="font-mono text-xs font-medium">{inv.number}</span>,
    },
    {
      key: "customer",
      label: "Customer",
      className: "w-[180px]",
      render: (inv: Invoice) => <span className="font-medium">{inv.customer?.name}</span>,
    },
    {
      key: "total",
      label: "Total",
      className: "text-right",
      cellClassName: "text-right",
      render: (inv: Invoice) => <span className="font-mono text-sm font-medium">{formatCurrency(inv.total)}</span>,
    },
    {
      key: "paidAmount",
      label: "Paid",
      className: "text-right",
      cellClassName: "text-right",
      render: (inv: Invoice) => <span className="font-mono text-sm text-foreground">{formatCurrency(inv.paidAmount)}</span>,
    },
    {
      key: "status",
      label: "Status",
      className: "w-[120px]",
      render: (inv: Invoice) => (
        <Badge variant={invoiceStatusColors[inv.status] || "secondary"}>
          {inv.status}
        </Badge>
      ),
    },
    {
      key: "dueDate",
      label: "Due Date",
      render: (inv: Invoice) => <span className="text-sm text-foreground">{formatDate(new Date(inv.dueDate))}</span>,
    },
  ]

  const columns = allColumns.filter((c) => c.key === "number" || props.includes(c.key))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-foreground mt-1">Manage your customer invoices</p>
        </div>
        <Button size="sm" className="h-9 gap-1.5" onClick={handleCreate}>
          Create Invoice <ShortcutBadge shortcut="⌘C" />
        </Button>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 [&_.text-muted-foreground]:text-foreground">
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <>
              <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={invoices} />
              <ViewToggle view={view} onChange={setView} />
              <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground" />
              <Input placeholder="Search invoices..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
          <MoreMenu actions={[
            { label: "Import", icon: ActionIcons.AddNew },
            "separator",
            { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Invoice #", "Customer", "Status", "Total", "Date"], invoices.map(i => [i.number, i.customer?.name, i.status, i.total, i.issueDate]), "invoices.csv") },
            { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Invoices", []) },
            "separator",
            { label: "Record Payment", href: "/payments", icon: ActionIcons.AddNew },
          ]} />
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={6} columns={columns.length} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icons={[<FileText className="w-5 h-5" />, <Receipt className="w-5 h-5" />, <Calendar className="w-5 h-5" />]}
          title="No invoices yet"
          description="Create your first invoice to start tracking payments."
          actions={[{ label: "Create Invoice", onClick: () => router.push("/invoices/new") }]}
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
              {paginated.map((inv) => (
                <TableRow key={inv.id} className="cursor-pointer" onClick={() => router.push(`/invoices/${inv.id}`)}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.cellClassName}>
                      {col.render ? col.render(inv) : String((inv as any)[col.key] ?? "")}
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
