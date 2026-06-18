"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { statusBadge } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { toast } from "sonner"
import { Key, Settings2, ShieldAlert, Search } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"

type ApiKey = {
 id: string
 name: string
 keyPrefix: string
 lastUsedAt: string | null
 expiresAt: string | null
 active: boolean
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [search, setSearch] = useState("")
  const router = useRouter()
 const handleNew = useCallback(() => { window.location.href = "/settings/api-keys/new" }, [])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/api-keys")
 .then((res) => res.json())
 .then((data) => { if (Array.isArray(data)) setKeys(data) })
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

  const columns: any[] = [
 { key: "name", label: "Name", render: (k) => <span className="font-medium">{k.name}</span> },
 { key: "keyPrefix", label: "Prefix", render: (k) => <span className="font-mono text-xs">{k.keyPrefix}...</span> },
 {
 key: "lastUsedAt", label: "Last Used",
 render: (k) => k.lastUsedAt ? <span className="text-sm text-muted-foreground">{formatDate(new Date(k.lastUsedAt))}</span>
 : <span className="text-sm text-muted-foreground/50">Never</span>,
 },
 {
 key: "expiresAt", label: "Expires",
 render: (k) => k.expiresAt ? <span className="text-sm text-muted-foreground">{formatDate(new Date(k.expiresAt))}</span>
 : <span className="text-sm text-muted-foreground/50">Never</span>,
 },
 {
 key: "active", label: "Status",
 render: (k) => k.active ? <span className={statusBadge({ variant: "success" })}>Active</span>
 : <span className={statusBadge({ variant: "secondary" })}>Inactive</span>,
 },
 {
 key: "actions", label: "",
 render: (k) => (
 <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(k) }}>
 </Button>
 ),
  },
  ]

  const filterColumns: FilterColumn[] = [
    { key: "name", label: "Name", getValue: (e: any) => e.name },
    { key: "status", label: "Status", getValue: (e: any) => e.active ? "Active" : "Inactive" },
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

  return (
  <div className="animate-fade-in">
  <div className="page-header flex items-center justify-between">
  <div><h1>API Keys</h1><p>Manage API keys for programmatic access</p></div>
  <Link href="/settings/api-keys/new"><Button className="gap-1.5">Create API Key <ShortcutBadge shortcut="⌘C" /></Button></Link>
  </div>
  <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
    <div className="flex items-center gap-3">
      <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={keys} />
    </div>
    <div className="flex items-center gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search API keys..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
    </div>
  </div>
  {loading ? (
    <SkeletonTable rows={6} columns={columns.length} />
  ) : filtered.length === 0 ? (
    <EmptyState icons={[<Key className="w-5 h-5" />, <ShieldAlert className="w-5 h-5" />, <Settings2 className="w-5 h-5" />]} title="No API keys yet" description="Create an API key to enable programmatic access." />
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
