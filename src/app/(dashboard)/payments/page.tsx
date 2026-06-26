"use client"

import { useState, useEffect, useCallback } from "react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Banknote, DollarSign, Landmark, Receipt, Search, Wallet, XCircle } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { UploadFileMain } from "@/components/upload/upload-file-main"
import { useUploadImport } from "@/hooks/use-upload-import"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { toast } from "sonner"
import { downloadCSV, downloadPDF } from "@/lib/export"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"

type Payment = {
  id: string
  amount: number
  date: string
  method: string
  reference: string
  invoice?: { number: string }
  order?: { number: string }
}

const methodIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  bank_transfer: { icon: <Landmark className="w-3.5 h-3.5" />, color: "bg-info/15 text-info" },
  cash: { icon: <Banknote className="w-3.5 h-3.5" />, color: "bg-success/15 text-success" },
  credit_card: { icon: <Wallet className="w-3.5 h-3.5" />, color: "bg-primary/15 text-primary" },
  cheque: { icon: <Receipt className="w-3.5 h-3.5" />, color: "bg-warning/15 text-warning" },
}

const PROPERTY_OPTIONS = [
  { key: "reference", label: "Reference" },
  { key: "source", label: "Source" },
  { key: "date", label: "Date" },
  { key: "method", label: "Method" },
]

const DEFAULT_PROPS = ["reference", "source", "date", "method"]
const PAGE_SIZE = 10

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const handleCreate = useCallback(() => setShowCreate(true), [])
  useHotkey("c", handleCreate)
  const [uploadOpen, setUploadOpen] = useState(false)
  const { files, addFiles, removeFile } = useUploadImport("payments")
  useHotkey("u", () => setUploadOpen(true))

  useEffect(() => {
    fetch("/api/payments").then(r => r.json()).then((json) => { if (json?.success && Array.isArray(json.data)) setPayments(json.data); else if (!json?.success) throw new Error(json?.error || "Failed to load") }).catch((err) => { setError(err.message); setLoading(false) }).finally(() => setLoading(false))
  }, [])

  const filterColumns: FilterColumn[] = [
    { key: "status", label: "Status", getValue: (p: Payment) => "completed" },
    { key: "method", label: "Method", getValue: (p: Payment) => p.method },
  ]

  const filtered = payments.filter((item) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const col = filterColumns.find((c) => c.key === key)
      if (col && col.getValue(item) !== value) return false
    }
    if (!search) return true
    return [item.method, item.reference, item.invoice?.number, item.order?.number].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const safePage = Math.min(page, Math.max(totalPages, 1))
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, filters])

  const allColumns = [
    {
      key: "reference",
      label: "Reference",
      render: (p: Payment) => <span className="text-sm text-foreground">{p.reference || "—"}</span>,
    },
    {
      key: "amount",
      label: "Amount",
      className: "text-right",
      cellClassName: "text-right",
      render: (p: Payment) => <span className="font-mono text-sm font-medium">{formatCurrency(p.amount)}</span>,
    },
    {
      key: "source",
      label: "Source",
      render: (p: Payment) => <span className="text-sm text-foreground">{p.invoice?.number || p.order?.number || "—"}</span>,
    },
    {
      key: "date",
      label: "Date",
      render: (p: Payment) => <span className="text-sm text-foreground">{formatDateTime(new Date(p.date))}</span>,
    },
    {
      key: "method",
      label: "Method",
      render: (p: Payment) => {
        const mi = methodIcons[p.method]
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${mi?.color || "bg-muted text-foreground"}`}>
            {mi?.icon || null}
            {p.method.replace(/_/g, " ")}
          </span>
        )
      },
    },
  ]

  const columns = allColumns.filter((c) => c.key === "amount" || props.includes(c.key))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
          <p className="text-sm text-foreground mt-1">Track all incoming and outgoing payments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setUploadOpen(true)}>
            Upload file <kbd className="text-[9px] px-1 py-0.5 rounded bg-muted/20 text-primary-foreground font-mono ml-0.5">⌘U</kbd>
          </Button>
          <Button size="sm" className="h-9 gap-1.5" onClick={handleCreate}>
            Record Payment <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘C</kbd>
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 [&_.text-muted-foreground]:text-foreground">
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <>
              <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={payments} />
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
            { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Date", "Source", "Amount", "Method", "Reference"], payments.map(p => [p.date, p.invoice?.number || p.order?.number || "", p.amount, p.method, p.reference]), "payments.csv") },
            { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Payments", []) },
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
        <EmptyState icons={[<DollarSign className="w-5 h-5" />, <Banknote className="w-5 h-5" />, <Receipt className="w-5 h-5" />]} title="No payments recorded" description="Record your first payment to start tracking transactions." actions={[{ label: "Record Payment", onClick: () => setShowCreate(true) }]} />
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
                <TableRow key={item.id}>
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

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle><DialogDescription>Enter payment details</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1"><Label>Amount</Label><Input type="number" step="0.01" /></div>
            <div className="space-y-1">
<Label>Method</Label>
              <Select options={[
                { value: "bank_transfer", label: "Bank Transfer" },
                { value: "cash", label: "Cash" },
                { value: "credit_card", label: "Credit Card" },
                { value: "cheque", label: "Cheque" },
              ]} />
            </div>
            <div className="space-y-1"><Label>Reference</Label><Input placeholder="Transaction ID" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCreate(false)}><XCircle className="w-4 h-4" /> Cancel</Button><Button>Record</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent hideCloseButton className="sm:max-w-lg p-0 gap-0 overflow-hidden">
          <UploadFileMain
            files={files}
            onFilesChange={addFiles}
            onFileRemove={removeFile}
            onClose={() => setUploadOpen(false)}
            moduleLabel="payments files"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
