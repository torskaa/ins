"use client"

import { useState, useEffect, useCallback } from "react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { UploadFileMain } from "@/components/upload/upload-file-main"
import { useUploadImport } from "@/hooks/use-upload-import"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Users, Building2, Mail, Phone, Search } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { formatDate } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { downloadCSV, downloadPDF } from "@/lib/export"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"

type Customer = {
  id: string
  name: string
  email: string
  phone: string
  company: string
  _count: { orders: number; invoices: number }
  createdAt: string
}

const PROPERTY_OPTIONS = [
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "orders", label: "Orders" },
  { key: "createdAt", label: "Created" },
]

const DEFAULT_PROPS = ["email", "phone", "orders", "createdAt"]
const PAGE_SIZE = 10

export default function CRMPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [page, setPage] = useState(1)
  const router = useRouter()
  const handleNew = useCallback(() => router.push("/crm/new"), [router])
  useHotkey("c", handleNew)
  const [uploadOpen, setUploadOpen] = useState(false)
  const { files, addFiles, removeFile } = useUploadImport("crm")
  useHotkey("u", () => setUploadOpen(true))

  useEffect(() => {
    fetch("/api/customers")
      .then(r => r.json())
      .then((json) => { if (json?.success && Array.isArray(json.data)) setCustomers(json.data); else if (!json?.success) throw new Error(json?.error || "Failed to load") })
      .catch((err) => { setError(err.message); setLoading(false) })
      .finally(() => setLoading(false))
  }, [])

  const filterColumns: FilterColumn[] = [
    { key: "status", label: "Status", getValue: (c: Customer) => "active" },
    { key: "type", label: "Type", getValue: (c: Customer) => c.company ? "business" : "individual" },
  ]

  const filtered = customers.filter((item) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const col = filterColumns.find((c) => c.key === key)
      if (col && col.getValue(item) !== value) return false
    }
    if (!search) return true
    return [item.name, item.email, item.phone, item.company].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
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
      className: undefined,
      cellClassName: undefined,
      render: (c: Customer) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(c.name)}`} />
            <AvatarFallback>{c.name.split(/\s+/).map(n => n[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium truncate">{c.name}</p>
            {c.company && <p className="text-xs text-foreground truncate">{c.company}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      className: undefined,
      cellClassName: undefined,
      render: (c: Customer) => <span className="text-sm text-foreground">{c.email || "—"}</span>,
    },
    {
      key: "phone",
      label: "Phone",
      className: undefined,
      cellClassName: undefined,
      render: (c: Customer) => <span className="text-sm text-foreground">{c.phone || "—"}</span>,
    },
    {
      key: "orders",
      label: "Orders",
      className: undefined,
      cellClassName: "text-right font-mono text-sm",
      render: (c: Customer) => <span>{c._count?.orders || 0}</span>,
    },
    {
      key: "createdAt",
      label: "Created",
      className: undefined,
      cellClassName: undefined,
      render: (c: Customer) => <span className="text-sm text-foreground">{formatDate(new Date(c.createdAt))}</span>,
    },
  ]

  const columns = allColumns.filter((c) => c.key === "name" || props.includes(c.key))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CRM</h1>
          <p className="text-sm text-foreground mt-1">Manage your customers and relationships</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setUploadOpen(true)}>
            Upload file <kbd className="text-[9px] px-1 py-0.5 rounded bg-muted/20 text-primary-foreground font-mono ml-0.5">⌘U</kbd>
          </Button>
          <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>
            Add Customer <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘C</kbd>
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 [&_.text-muted-foreground]:text-foreground">
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <>
              <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={customers} />
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
            { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Name", "Email", "Phone", "Company", "Total Orders"], customers.map(c => [c.name, c.email || "", c.phone || "", c.company || "", String(c._count?.orders || 0)]), "customers.csv") },
            { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Customers", []) },
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
        <EmptyState icons={[<Users className="w-5 h-5" />, <Building2 className="w-5 h-5" />, <Mail className="w-5 h-5" />]} title="No customers yet" description="Add your first customer to start tracking relationships." actions={[{ label: "Add Customer", onClick: () => router.push("/crm/new") }]} />
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
                <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/crm/${item.id}`)}>
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
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent hideCloseButton className="sm:max-w-lg p-0 gap-0 overflow-hidden">
          <UploadFileMain
            files={files}
            onFilesChange={addFiles}
            onFileRemove={removeFile}
            onClose={() => setUploadOpen(false)}
            moduleLabel="crm files"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
