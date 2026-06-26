"use client"

import { useState, useEffect } from "react"
import { SemanticBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { abbreviateName } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Activity, AlertTriangle, FileText, Search, Shield } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { formatDateTime } from "@/lib/utils"
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

type AuditEntry = {
  id: string
  action: string
  entity: string
  entityId: string
  description: string | null
  userName: string
  createdAt: string
}

const PROPERTY_OPTIONS = [
  { key: "action", label: "Action" },
  { key: "entity", label: "Entity" },
  { key: "entityId", label: "ID" },
  { key: "description", label: "Description" },
  { key: "userName", label: "User" },
  { key: "createdAt", label: "Timestamp" },
]

const DEFAULT_PROPS = ["action", "entity", "userName", "createdAt", "description"]
const PAGE_SIZE = 10

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const limit = 50

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value)
    }
    fetch(`/api/audit-entries?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && json.data) {
          if (json.data.entries) setEntries(json.data.entries)
          if (json.data.total !== undefined) setTotal(json.data.total)
        } else if (!json?.success) throw new Error(json?.error || "Failed to load")
      })
      .catch((err) => { setError(err.message); setLoading(false) })
      .finally(() => setLoading(false))
  }, [page, filters])

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, totalPages)

  const filterColumns: FilterColumn[] = [
    { key: "entity", label: "Entity", getValue: (e: AuditEntry) => e.entity },
    { key: "action", label: "Action", getValue: (e: AuditEntry) => e.action },
    { key: "userName", label: "User", getValue: (e: AuditEntry) => e.userName },
  ]

  const filtered = entries.filter((item) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const col = filterColumns.find((c) => c.key === key)
      if (col && col.getValue(item) !== value) return false
    }
    if (!search) return true
    return [item.entity, item.action, item.userName, item.description].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  })

  useEffect(() => {
    setPage(1)
  }, [search, filters])

  const allColumns = [
    {
      key: "action",
      label: "Action",
      className: "w-[120px]",
      cellClassName: undefined,
      render: (e: AuditEntry) => <SemanticBadge semantic={e.action} category="type" className="">{e.action}</SemanticBadge>,
    },
    {
      key: "entity",
      label: "Entity",
      className: undefined,
      cellClassName: undefined,
      render: (e: AuditEntry) => <span className="font-medium capitalize">{e.entity}</span>,
    },
    {
      key: "entityId",
      label: "ID",
      className: undefined,
      cellClassName: undefined,
      render: (e: AuditEntry) => <span className="font-mono text-xs text-foreground">{e.entityId?.slice(0, 12)}</span>,
    },
    {
      key: "description",
      label: "Description",
      className: undefined,
      cellClassName: undefined,
      render: (e: AuditEntry) => <span className="text-sm text-foreground">{e.description || "—"}</span>,
    },
    {
      key: "userName",
      label: "User",
      className: undefined,
      cellClassName: undefined,
      render: (e: AuditEntry) => (
        <div className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(e.userName || "User")}`} />
            <AvatarFallback className="text-[10px]">{(e.userName || "U")[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-foreground">{abbreviateName(e.userName) || e.userName}</span>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Timestamp",
      className: "w-[180px]",
      cellClassName: undefined,
      render: (e: AuditEntry) => <span className="text-sm text-foreground whitespace-nowrap">{formatDateTime(new Date(e.createdAt))}</span>,
    },
  ]

  const columns = allColumns.filter((c) => c.key === "action" || c.key === "entity" || props.includes(c.key))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
          <p className="text-sm text-foreground mt-1">Track all changes and activities across the system</p>
        </div>
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
              <Input placeholder="Search audit..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
          <MoreMenu actions={[
            { label: "Refresh", icon: ActionIcons.Refresh },
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
          icons={[<Shield className="w-5 h-5" />, <Activity className="w-5 h-5" />, <FileText className="w-5 h-5" />]}
          title="No audit entries found"
          description="Activity will appear here as users interact with the system."
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
              {filtered.map((item) => (
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
    </div>
  )
}
