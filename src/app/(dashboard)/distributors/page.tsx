"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Search, Building2, Globe, Phone, Users } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { Badge } from "@/components/ui/badge"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { downloadCSV, downloadPDF } from "@/lib/export"

type Distributor = {
 id: string
 name: string
 email: string | null
 phone: string | null
 territory: string | null
 status: string
 contactPerson: string | null
 _count: { deliveries: number }
}

const statusColors: Record<string, string> = {
 active: "bg-emerald-100 text-emerald-700",
 inactive: "bg-slate-100 text-slate-600",
 suspended: "bg-red-100 text-red-700",
}

export default function DistributorsPage() {
 const [distributors, setDistributors] = useState<Distributor[]>([])
const [loading, setLoading] = useState(true)
const [search, setSearch] = useState("")
const [filters, setFilters] = useState<Record<string, string | null>>({})
const router = useRouter()
 const handleNew = useCallback(() => router.push("/distributors/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/distributors")
 .then(r => r.json())
 .then((data) => { if (Array.isArray(data)) setDistributors(data) })
 .finally(() => setLoading(false))
 }, [])

 const columns = [
 {
 key: "name",
 label: "Name",
 render: (d) => (
 <button onClick={() => router.push(`/distributors/${d.id}`)} className="font-medium text-left hover:text-primary transition-colors">
 {d.name}
 </button>
 ),
 },
 {
 key: "contactPerson",
 label: "Contact",
 render: (d) => (
 <div className="text-sm text-muted-foreground">
 {d.contactPerson && <span>{d.contactPerson}</span>}
 {d.email && <span className="block text-xs">{d.email}</span>}
 </div>
 ),
 },
 {
 key: "phone",
 label: "Phone",
 render: (d) => <span className="text-sm font-mono text-muted-foreground">{d.phone || "—"}</span>,
 },
 {
 key: "territory",
 label: "Territory",
 render: (d) => (
 <span className="flex items-center gap-1.5 text-sm">
 {d.territory || "—"}
 </span>
 ),
 },
 {
 key: "status",
 label: "Status",
 render: (d) => (
 <Badge className={`${statusColors[d.status] || "bg-slate-100 text-slate-600"} border-0 font-medium`}>
 {d.status}
 </Badge>
 ),
 },
 {
 key: "deliveries",
 label: "Deliveries",
 cellClassName: "font-mono text-sm text-muted-foreground",
 render: (d) => <span>{d._count?.deliveries || 0}</span>,
  },
]

const filterColumns: FilterColumn[] = [
  { key: "name", label: "Name", getValue: (p: Distributor) => p.name },
  { key: "territory", label: "Territory", getValue: (p: Distributor) => p.territory || "" },
  { key: "status", label: "Status", getValue: (p: Distributor) => p.status },
]

const filtered = distributors.filter((d) => {
  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue
    const col = filterColumns.find((c) => c.key === key)
    if (col && col.getValue(d) !== value) return false
  }
  if (!search) return true
  return [d.name, d.contactPerson, d.email, d.phone, d.territory, d.status]
    .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
})

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Distributors</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your distribution network</p>
        </div>
        <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>New Distributor <ShortcutBadge shortcut="⌘C" />
        </Button>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={distributors} />
          )}
        </div>
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search distributors..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
          <MoreMenu actions={[
            { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Name", "Contact", "Phone", "Territory", "Status", "Deliveries"], distributors.map(d => [d.name, d.contactPerson || "", d.phone || "", d.territory || "", d.status, d._count?.deliveries]), "distributors.csv") },
            { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Distributors", []) },
          ]} />
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={6} columns={columns.length} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icons={[<Building2 className="w-5 h-5" />, <Users className="w-5 h-5" />, <Globe className="w-5 h-5" />]}
          title="No distributors yet"
          description="Add your first distributor to start managing distribution."
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
