"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { Settings2, Shield, Users, Search } from "lucide-react"
import { useHotkey } from "@/hooks/use-hotkey"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"

type Role = {
 id: string
 name: string
 description: string | null
 isSystem: boolean
 permissions: string
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [search, setSearch] = useState("")
  const router = useRouter()
 const handleNew = useCallback(() => { window.location.href = "/settings/roles/new" }, [])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/roles")
 .then((res) => res.json())
 .then((data) => { if (Array.isArray(data)) setRoles(data) })
 .finally(() => setLoading(false))
 }, [])

  const columns: any[] = [
 { key: "name", label: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
 {
 key: "description", label: "Description",
 render: (r) => <span className="text-muted-foreground">{r.description || "—"}</span>,
 },
 {
 key: "isSystem", label: "System",
 render: (r) =>
 r.isSystem
 ? <Badge variant="success">System</Badge>
 : <Badge variant="secondary">Custom</Badge>,
 },
  {
  key: "actions", label: "",
  render: (r) => (
  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/settings/roles/${r.id}`) }}>
  Edit
  </Button>
  ),
  },
  ]

  const filterColumns: FilterColumn[] = [
    { key: "name", label: "Name", getValue: (e: any) => e.name },
  ]

  const filtered = roles.filter((item) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const col = filterColumns.find((c) => c.key === key)
      if (col && col.getValue(item) !== value) return false
    }
    if (!search) return true
    return [item.name, item.description].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  })

  return (
 <div className="animate-fade-in">
 <div className="page-header flex items-center justify-between">
 <div>
 <h1>Roles</h1>
 <p>Manage access control roles and permissions</p>
 </div>
 <Link href="/settings/roles/new"><Button className="gap-1.5">Create Role <ShortcutBadge shortcut="⌘C" /></Button></Link>
 </div>
  <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
    <div className="flex items-center gap-3">
      <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={roles} />
    </div>
    <div className="flex items-center gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search roles..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
    </div>
  </div>
  {loading ? (
    <SkeletonTable rows={6} columns={columns.length} />
  ) : filtered.length === 0 ? (
    <EmptyState icons={[<Shield className="w-5 h-5" />, <Users className="w-5 h-5" />, <Settings2 className="w-5 h-5" />]} title="No roles yet" description="Create your first role to define access permissions." />
  ) : (
    <div data-slot="frame">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((item) => (
            <TableRow key={item.id} onClick={() => router.push(`/settings/roles/${item.id}`)} className="cursor-pointer">
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
