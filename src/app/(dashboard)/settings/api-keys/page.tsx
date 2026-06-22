"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { SemanticBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { toast } from "sonner"
import { AlertTriangle, Key, Settings2, ShieldAlert, Search } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { formatDate } from "@/lib/utils"
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

type ApiKey = {
  id: string
  name: string
  keyPrefix: string
  lastUsedAt: string | null
  expiresAt: string | null
  active: boolean
}

const PROPERTY_OPTIONS = [
  { key: "keyPrefix", label: "Prefix" },
  { key: "lastUsedAt", label: "Last Used" },
  { key: "expiresAt", label: "Expires" },
  { key: "active", label: "Status" },
]

const DEFAULT_PROPS = ["keyPrefix", "lastUsedAt", "expiresAt", "active"]
const PAGE_SIZE = 10

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [page, setPage] = useState(1)
  const router = useRouter()
  const handleNew = useCallback(() => router.push("/settings/api-keys/new"), [router])
  useHotkey("c", handleNew)

  useEffect(() => {
    fetch("/api/api-keys")
      .then((res) => res.json())
      .then((json) => { if (json?.success && Array.isArray(json.data)) setKeys(json.data); else if (!json?.success) throw new Error(json?.error || "Failed to load") })
      .catch((err) => { setError(err.message); setLoading(false) })
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(key: ApiKey) {
    if (!confirm(`Delete API key "${key.name}"?`)) return
    try {
      const res = await fetch(`/api/api-keys/${key.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setKeys((prev) => prev.filter((k) => k.id !== key.id))
      toast.success("API key deleted")
    } catch { toast.error("Failed to delete API key") }
  }

  const filterColumns: FilterColumn[] = [
    { key: "name", label: "Name", getValue: (k: ApiKey) => k.name },
    { key: "active", label: "Status", getValue: (k: ApiKey) => k.active ? "Active" : "Inactive" },
  ]

  const filtered = keys.filter((item) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const col = filterColumns.find((c) => c.key === key)
      if (col && col.getValue(item) !== value) return false
    }
    if (!search) return true
    return [item.name, item.keyPrefix].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
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
      render: (k: ApiKey) => (
        <div>
          <p className="font-medium">{k.name}</p>
          {k.keyPrefix && <p className="text-xs text-foreground">{k.keyPrefix}...</p>}
        </div>
      ),
    },
    {
      key: "keyPrefix",
      label: "Prefix",
      className: undefined,
      cellClassName: undefined,
      render: (k: ApiKey) => <span className="font-mono text-xs">{k.keyPrefix}...</span>,
    },
    {
      key: "lastUsedAt",
      label: "Last Used",
      className: undefined,
      cellClassName: undefined,
      render: (k: ApiKey) => k.lastUsedAt
        ? <span className="text-sm text-foreground">{formatDate(new Date(k.lastUsedAt))}</span>
        : <span className="text-sm text-foreground">Never</span>,
    },
    {
      key: "expiresAt",
      label: "Expires",
      className: undefined,
      cellClassName: undefined,
      render: (k: ApiKey) => k.expiresAt
        ? <span className="text-sm text-foreground">{formatDate(new Date(k.expiresAt))}</span>
        : <span className="text-sm text-foreground">Never</span>,
    },
    {
      key: "active",
      label: "Status",
      className: "w-[120px]",
      cellClassName: undefined,
      render: (k: ApiKey) => k.active
        ? <SemanticBadge semantic="active" category="status" className="">Active</SemanticBadge>
        : <SemanticBadge semantic="inactive" category="status" className="">Inactive</SemanticBadge>,
    },
  ]

  const columns = allColumns.filter((c) => c.key === "name" || props.includes(c.key))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
          <p className="text-sm text-foreground mt-1">Manage API keys for programmatic access</p>
        </div>
        <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>
          Create API Key <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘C</kbd>
        </Button>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 [&_.text-muted-foreground]:text-foreground">
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={keys} />
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
              <Input placeholder="Search API keys..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
          <MoreMenu actions={[
            { label: "New API Key", icon: ActionIcons.AddNew, onClick: handleNew },
            "separator",
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
          icons={[<Key className="w-5 h-5" />, <ShieldAlert className="w-5 h-5" />, <Settings2 className="w-5 h-5" />]}
          title="No API keys yet"
          description="Create an API key to enable programmatic access."
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
                  onClick={() => router.push(`/settings/api-keys/${item.id}`)}
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
