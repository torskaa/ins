"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { Search, Layers } from "lucide-react"

type Group = { id: string; name: string; code: string; type: string; description: string; _count: { accounts: number } }

const TYPE_COLORS: Record<string, string> = { asset: "bg-blue-100 text-blue-700", liability: "bg-orange-100 text-orange-700", equity: "bg-purple-100 text-purple-700", revenue: "bg-emerald-100 text-emerald-700", expense: "bg-red-100 text-red-700" }

export default function AccountGroupsPage() {
 const router = useRouter()
 const [groups, setGroups] = useState<Group[]>([])
const [loading, setLoading] = useState(true)
const [search, setSearch] = useState("")
const [filters, setFilters] = useState<Record<string, string | null>>({})
const handleNew = useCallback(() => router.push("/finance/groups/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/finance/groups").then(r => r.json()).then(d => { if (Array.isArray(d)) setGroups(d) }).finally(() => setLoading(false))
 }, [])

 const columns = [
 { key: "code", label: "Code", cellClassName: "font-mono text-xs w-20 text-muted-foreground" },
 { key: "name", label: "Name", render: (g) => <span className="font-medium">{g.name}</span> },
 { key: "type", label: "Type", render: (g) => <Badge className={TYPE_COLORS[g.type] || ""}>{g.type.replace("_", " ")}</Badge> },
 { key: "description", label: "Description", render: (g) => <span className="text-sm text-muted-foreground">{g.description || "—"}</span> },
 { key: "_count", label: "Accounts", render: (g) => <span className="text-sm">{g._count?.accounts || 0}</span> },
  ]

const filterColumns: FilterColumn[] = [
  { key: "name", label: "Name", getValue: (p: Group) => p.name },
  { key: "type", label: "Type", getValue: (p: Group) => p.type },
]

const filtered = groups.filter((g) => {
  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue
    const col = filterColumns.find((c) => c.key === key)
    if (col && col.getValue(g) !== value) return false
  }
  if (!search) return true
  return [g.name, g.code, g.type, g.description]
    .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
})

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Account Groups</h1>
          <p className="text-sm text-muted-foreground mt-1">Organize accounts into groups for reporting</p>
        </div>
        <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>New Group <ShortcutBadge shortcut="⌘C" /></Button>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={groups} />
          )}
        </div>
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search groups..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={6} columns={columns.length} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icons={[<Layers className="w-5 h-5" />]}
          title="No groups yet"
          description="Account groups help organize your chart of accounts."
        />
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
                <TableRow key={item.id}>
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
