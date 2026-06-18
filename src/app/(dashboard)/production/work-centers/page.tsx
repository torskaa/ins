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
import { Search, Wrench, Activity, Settings2 } from "lucide-react"
import { useHotkey } from "@/hooks/use-hotkey"

type WorkCenter = {
 id: string
 code: string
 name: string
 costPerHour: number
 capacity: number
 location: string | null
 isActive: boolean
}

export default function WorkCentersPage() {
 const [data, setData] = useState<WorkCenter[]>([])
const [loading, setLoading] = useState(true)
const [search, setSearch] = useState("")
const [filters, setFilters] = useState<Record<string, string | null>>({})
const router = useRouter()
 const handleNew = useCallback(() => router.push("/production/work-centers/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/work-centers")
 .then(r => r.json())
 .then((d) => { if (Array.isArray(d)) setData(d) })
 .finally(() => setLoading(false))
 }, [])

 const columns = [
 { key: "code", label: "Code", render: (w) => (
 <button onClick={() => router.push(`/production/orders?workCenter=${w.id}`)} className="font-mono text-xs text-muted-foreground">{w.code}</button>
 )},
 { key: "name", label: "Name", render: (w) => (
 <span className="font-medium">{w.name}</span>
 )},
 { key: "costPerHour", label: "Cost/hr", render: (w) => (
 <span className="font-mono text-sm">฿{w.costPerHour.toLocaleString()}</span>
 )},
 { key: "capacity", label: "Capacity", cellClassName: "font-mono text-sm", render: (w) => <span>{w.capacity}</span> },
 { key: "location", label: "Location", render: (w) => (
 <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
 {w.location || "—"}
 </span>
 )},
 { key: "isActive", label: "Status", render: (w) => (
 <Badge className={w.isActive ? "bg-emerald-100 text-emerald-700 border-0" : "bg-slate-100 text-slate-600 border-0"}>
 {w.isActive ? "Active" : "Inactive"}
 </Badge>
  )},
  ]

const filterColumns: FilterColumn[] = [
  { key: "isActive", label: "Status", getValue: (p: WorkCenter) => p.isActive ? "Active" : "Inactive" },
  { key: "location", label: "Location", getValue: (p: WorkCenter) => p.location || "" },
]

const filtered = data.filter((w) => {
  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue
    const col = filterColumns.find((c) => c.key === key)
    if (col && col.getValue(w) !== value) return false
  }
  if (!search) return true
  return [w.code, w.name, w.location]
    .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
})

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Work Centers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage production work centers and cost rates</p>
        </div>
        <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>New Work Center <ShortcutBadge shortcut="⌘C" /></Button>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={data} />
          )}
        </div>
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search work centers..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={6} columns={columns.length} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icons={[<Wrench className="w-5 h-5" />, <Activity className="w-5 h-5" />, <Settings2 className="w-5 h-5" />]}
          title="No work centers yet"
          description="Add your first work center to start production planning."
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
                <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/production/work-centers/${item.id}`)}>
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
