"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SemanticBadge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Settings2, Shield, Users, Search } from "lucide-react"
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

type Role = {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  permissions: string
}

const PROPERTY_OPTIONS = [
  { key: "description", label: "Description" },
  { key: "isSystem", label: "System" },
  { key: "permissions", label: "Permissions" },
]

const DEFAULT_PROPS = ["description", "isSystem"]
const PAGE_SIZE = 10

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [page, setPage] = useState(1)
  const router = useRouter()
  const handleNew = useCallback(() => router.push("/settings/roles/new"), [router])
  useHotkey("c", handleNew)

  useEffect(() => {
    fetch("/api/roles")
      .then((res) => res.json())
      .then((json) => { if (json?.success && Array.isArray(json.data)) setRoles(json.data); else if (!json?.success) throw new Error(json?.error || "Failed to load") })
      .catch((err) => { setError(err.message); setLoading(false) })
      .finally(() => setLoading(false))
  }, [])

  const filterColumns: FilterColumn[] = [
    { key: "name", label: "Name", getValue: (r: Role) => r.name },
    { key: "isSystem", label: "System", getValue: (r: Role) => r.isSystem ? "System" : "Custom" },
  ]

  const filtered = roles.filter((r) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const col = filterColumns.find((c) => c.key === key)
      if (col && col.getValue(r) !== value) return false
    }
    if (!search) return true
    return [r.name, r.description].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
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
      label: "Role",
      className: undefined,
      cellClassName: undefined,
      render: (r: Role) => (
        <div>
          <p className="font-medium">{r.name}</p>
          {r.description && <p className="text-xs text-foreground">{r.description}</p>}
        </div>
      ),
    },
    {
      key: "isSystem",
      label: "System",
      className: "w-[120px]",
      cellClassName: undefined,
      render: (r: Role) =>
        r.isSystem
          ? <SemanticBadge semantic="system" category="role">System</SemanticBadge>
          : <SemanticBadge semantic="custom" category="role">Custom</SemanticBadge>,
    },
    {
      key: "description",
      label: "Description",
      className: undefined,
      cellClassName: undefined,
      render: (r: Role) => <span className="text-sm text-foreground">{r.description || "—"}</span>,
    },
    {
      key: "permissions",
      label: "Permissions",
      className: undefined,
      cellClassName: undefined,
      render: (r: Role) => <span className="text-sm text-foreground">{r.permissions}</span>,
    },
  ]

  const columns = allColumns.filter((c) => c.key === "name" || props.includes(c.key))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
          <p className="text-sm text-foreground mt-1">Manage access control roles and permissions</p>
        </div>
        <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>
          Create Role <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘C</kbd>
        </Button>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 [&_.text-muted-foreground]:text-foreground">
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={roles} />
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
              <Input placeholder="Search roles..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
          <MoreMenu actions={[
            { label: "New Role", icon: ActionIcons.AddNew, onClick: handleNew },
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
          icons={[<Shield className="w-5 h-5" />, <Users className="w-5 h-5" />, <Settings2 className="w-5 h-5" />]}
          title="No roles yet"
          description="Create your first role to define access permissions."
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
                  onClick={() => router.push(`/settings/roles/${item.id}`)}
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
