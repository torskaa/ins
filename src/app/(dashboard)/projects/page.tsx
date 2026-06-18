"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { Projector, FolderKanban, Calendar, Search } from "lucide-react"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { formatDate, formatCurrency } from "@/lib/utils"

type Project = { id: string; name: string; status: string; priority: string; startDate: string; dueDate: string; budget: number; _count: { tasks: number } }

const STATUS_COLORS: Record<string, string> = { draft: "bg-slate-100 text-slate-700", active: "bg-blue-100 text-blue-700", paused: "bg-orange-100 text-orange-700", completed: "bg-emerald-100 text-emerald-700", cancelled: "bg-red-100 text-red-700" }
const PRIORITY_COLORS: Record<string, string> = { low: "bg-slate-100 text-slate-600", medium: "bg-blue-100 text-blue-700", high: "bg-orange-100 text-orange-700", urgent: "bg-red-100 text-red-700" }

const PROPERTY_OPTIONS = [
 { key: "status", label: "Status" },
 { key: "priority", label: "Priority" },
 { key: "startDate", label: "Start" },
 { key: "dueDate", label: "Due" },
 { key: "budget", label: "Budget" },
 { key: "_count", label: "Tasks" },
]

const DEFAULT_PROPS = ["status", "priority", "startDate", "dueDate", "budget", "_count"]

export default function ProjectsPage() {
 const router = useRouter()
 const [projects, setProjects] = useState<Project[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("")
 const [view, setView] = useState<"cards" | "rows">("rows")
const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const handleNew = useCallback(() => router.push("/projects/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/projects").then(r => r.json()).then(d => { if (Array.isArray(d)) setProjects(d) }).finally(() => setLoading(false))
 }, [])

  const filterColumns: FilterColumn[] = [
  { key: "status", label: "Status", getValue: (p) => p.status },
  { key: "type", label: "Type", getValue: (p) => p.priority },
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

  const allColumns = [
 { key: "name", label: "Name", render: (p) => <span className="font-medium">{p.name}</span> },
 { key: "status", label: "Status", render: (p) => <Badge className={STATUS_COLORS[p.status] || ""}>{p.status}</Badge> },
 { key: "priority", label: "Priority", render: (p) => <Badge className={PRIORITY_COLORS[p.priority] || ""} variant="outline">{p.priority}</Badge> },
 { key: "startDate", label: "Start", render: (p) => <span className="text-sm text-muted-foreground">{p.startDate ? formatDate(new Date(p.startDate)) : "—"}</span> },
 { key: "dueDate", label: "Due", render: (p) => <span className="text-sm text-muted-foreground">{p.dueDate ? formatDate(new Date(p.dueDate)) : "—"}</span> },
 { key: "budget", label: "Budget", render: (p) => <span className="font-mono text-sm">{formatCurrency(p.budget)}</span> },
 { key: "_count", label: "Tasks", render: (p) => <span className="text-sm">{p._count?.tasks || 0}</span> },
 ]

 const columns = allColumns.filter((c) => props.includes(c.key))

 return (
 <div className="space-y-6 animate-fade-in">
  <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage projects and track tasks</p>
      </div>
      <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>New Project <ShortcutBadge shortcut="⌘C" /></Button>
    </div>
    <div className="flex items-center justify-between flex-wrap gap-3">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        )}
      </div>
    </div>
  {loading ? (
    <SkeletonTable rows={6} columns={columns.length} />
  ) : filtered.length === 0 ? (
    <EmptyState icons={[<FolderKanban className="w-5 h-5" />, <Projector className="w-5 h-5" />, <Calendar className="w-5 h-5" />]} title="No projects yet" description="Create your first project to start managing tasks." />
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
            <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/projects/${item.id}`)}>
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
