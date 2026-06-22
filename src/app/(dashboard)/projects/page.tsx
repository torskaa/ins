"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { SemanticBadge } from "@/components/ui/badge"
import { Projector, FolderKanban, Calendar, Search } from "lucide-react"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { formatDate, formatCurrency } from "@/lib/utils"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"

type Project = { id: string; name: string; status: string; priority: string; startDate: string; dueDate: string; budget: number; _count: { tasks: number } }

const PROPERTY_OPTIONS = [
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "startDate", label: "Start" },
  { key: "dueDate", label: "Due" },
  { key: "budget", label: "Budget" },
  { key: "_count", label: "Tasks" },
]

const DEFAULT_PROPS = ["status", "priority", "startDate", "dueDate", "budget", "_count"]
const PAGE_SIZE = 10

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [page, setPage] = useState(1)
  const handleNew = useCallback(() => router.push("/projects/new"), [router])
  useHotkey("c", handleNew)

  useEffect(() => {
    fetch("/api/projects").then(r => r.json()).then(json => { if (json?.success && Array.isArray(json.data)) setProjects(json.data); else if (!json?.success) throw new Error(json?.error || "Failed to load") }).catch((err) => { setError(err.message); setLoading(false) }).finally(() => setLoading(false))
  }, [])

  const filterColumns: FilterColumn[] = [
    { key: "status", label: "Status", getValue: (p: Project) => p.status },
    { key: "type", label: "Type", getValue: (p: Project) => p.priority },
  ]

  const filtered = projects.filter((item) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const col = filterColumns.find((c) => c.key === key)
      if (col && col.getValue(item) !== value) return false
    }
    if (!search) return true
    return [item.name, item.status, item.priority].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
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
      render: (p: Project) => (
        <div>
          <p className="font-medium">{p.name}</p>
          <p className="text-xs text-foreground">{p._count?.tasks || 0} tasks</p>
        </div>
      ),
    },
    { key: "status", label: "Status", className: undefined, cellClassName: undefined, render: (p: Project) => <SemanticBadge semantic={p.status} category="status" className="">{p.status}</SemanticBadge> },
    { key: "priority", label: "Priority", className: undefined, cellClassName: undefined, render: (p: Project) => <SemanticBadge semantic={p.priority} category="priority" className="">{p.priority}</SemanticBadge> },
    { key: "startDate", label: "Start", className: undefined, cellClassName: undefined, render: (p: Project) => <span className="text-sm text-foreground">{p.startDate ? formatDate(new Date(p.startDate)) : "—"}</span> },
    { key: "dueDate", label: "Due", className: undefined, cellClassName: undefined, render: (p: Project) => <span className="text-sm text-foreground">{p.dueDate ? formatDate(new Date(p.dueDate)) : "—"}</span> },
    { key: "budget", label: "Budget", className: undefined, cellClassName: undefined, render: (p: Project) => <span className="font-mono text-sm">{formatCurrency(p.budget)}</span> },
    { key: "_count", label: "Tasks", className: undefined, cellClassName: undefined, render: (p: Project) => <span className="text-sm text-foreground">{p._count?.tasks || 0}</span> },
  ]

  const columns = allColumns.filter((c) => c.key === "name" || props.includes(c.key))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-foreground mt-1">Manage projects and track tasks</p>
        </div>
        <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>New Project <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘C</kbd></Button>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 [&_.text-muted-foreground]:text-foreground">
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <>
              <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={projects} />
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
        <EmptyState icons={[<FolderKanban className="w-5 h-5" />, <Projector className="w-5 h-5" />, <Calendar className="w-5 h-5" />]} title="No projects yet" description="Create your first project to start managing tasks." />
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
                <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/projects/${item.id}`)}>
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
