"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { SemanticBadge } from "@/components/ui/badge"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { AlertTriangle, BookOpen, Building2, DollarSign, Search } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"

type Account = { id: string; code: string; name: string; type: string; currentBalance: number; isActive: boolean; group: { name: string } }

const PROPERTY_OPTIONS = [
  { key: "code", label: "Code" },
  { key: "type", label: "Type" },
  { key: "group", label: "Group" },
  { key: "currentBalance", label: "Balance" },
  { key: "isActive", label: "Status" },
]

const DEFAULT_PROPS = ["code", "type", "group", "currentBalance", "isActive"]
const PAGE_SIZE = 10

export default function ChartOfAccountsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [page, setPage] = useState(1)
  const handleNew = useCallback(() => router.push("/finance/accounts/new"), [router])
  useHotkey("c", handleNew)

  useEffect(() => {
    fetch("/api/finance/accounts").then(r => r.json()).then(json => { if (json?.success && json.data?.accounts) setAccounts(json.data.accounts); else if (!json?.success) throw new Error(json?.error || "Failed to load") }).catch((err) => { setError(err.message); setLoading(false) }).finally(() => setLoading(false))
  }, [])

  const filterColumns: FilterColumn[] = [
    { key: "type", label: "Type", getValue: (p: Account) => p.type },
    { key: "isActive", label: "Status", getValue: (p: Account) => p.isActive ? "Active" : "Inactive" },
  ]

  const filtered = accounts.filter((a) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const col = filterColumns.find((c) => c.key === key)
      if (col && col.getValue(a) !== value) return false
    }
    if (!search) return true
    return [a.code, a.name, a.type, a.group?.name]
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
      className: "w-[120px]",
      render: (a: Account) => <span className="font-mono text-xs font-medium">{a.code}</span>,
    },
    {
      key: "name",
      label: "Name",
      render: (a: Account) => (
        <div>
          <p className="font-medium">{a.name}</p>
          {a.group && <p className="text-xs text-foreground">{a.group.name}</p>}
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      className: "w-[120px]",
      render: (a: Account) => <SemanticBadge semantic={a.type} category="type" className="">{a.type.replace("_", " ")}</SemanticBadge>,
    },
    {
      key: "group",
      label: "Group",
      className: "w-[160px]",
      render: (a: Account) => <span className="text-sm text-foreground">{a.group?.name || "—"}</span>,
    },
    {
      key: "currentBalance",
      label: "Balance",
      className: "text-right",
      cellClassName: "text-right",
      render: (a: Account) => (
        <span className={`font-mono text-sm ${a.currentBalance >= 0 ? "text-success" : "text-destructive"}`}>
          {formatCurrency(a.currentBalance)}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      className: "w-[120px]",
      render: (a: Account) => <SemanticBadge semantic={a.isActive ? "active" : "inactive"} category="status" className="">{a.isActive ? "Active" : "Inactive"}</SemanticBadge>,
    },
  ]

  const columns = allColumns.filter((c) => c.key === "name" || props.includes(c.key))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Chart of Accounts</h1>
          <p className="text-sm text-foreground mt-1">Manage your GL accounts and groups</p>
        </div>
        <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>New Account <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘C</kbd></Button>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 [&_.text-muted-foreground]:text-foreground">
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={accounts} />
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
              <Input placeholder="Search accounts..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
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
        <EmptyState
          icons={[<BookOpen className="w-5 h-5" />, <Building2 className="w-5 h-5" />, <DollarSign className="w-5 h-5" />]}
          title="No accounts yet"
          description="Add your first GL account to start tracking finances."
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
                <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/finance/accounts/${item.id}`)}>
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
