"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Plus, Projector, FolderKanban, Calendar, Search } from "lucide-react"
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
 const handleNew = useCallback(() => router.push("/projects/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/projects").then(r => r.json()).then(d => { if (Array.isArray(d)) setProjects(d) }).finally(() => setLoading(false))
 }, [])

 const filtered = projects.filter((p) =>
 !search || [p.name, p.status, p.priority]
 .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
 )

 const allColumns: Column<Project>[] = [
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
 <div className="flex items-center justify-between flex-wrap gap-4">
 <div>
 <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
 <p className="text-sm text-muted-foreground mt-1">Manage projects and track tasks</p>
 </div>
 <div className="flex items-center gap-3">
 {filtered.length > 0 && (
 <>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
<Input placeholder="Search projects..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
 </div>
 <ViewToggle view={view} onChange={setView} />
 <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
 </>
 )}
 <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}><Plus className="w-4 h-4" /> New Project <ShortcutBadge shortcut="⌘C" /></Button>
 </div>
 </div>
 <DataTable columns={columns} data={filtered} loading={loading}
 onRowClick={(item) => router.push(`/projects/${item.id}`)}
 empty={{ icons: [<FolderKanban className="w-5 h-5" />, <Projector className="w-5 h-5" />, <Calendar className="w-5 h-5" />], title: "No projects yet", description: "Create your first project to start managing tasks." }}
 />
 </div>
 )
}
