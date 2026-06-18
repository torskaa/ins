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
import { Search, BookOpen, Building2, DollarSign } from "lucide-react"
import { useHotkey } from "@/hooks/use-hotkey"

type Account = { id: string; code: string; name: string; type: string; currentBalance: number; isActive: boolean; group: { name: string } }

const TYPE_COLORS: Record<string, string> = { asset: "bg-blue-100 text-blue-700", liability: "bg-orange-100 text-orange-700", equity: "bg-purple-100 text-purple-700", revenue: "bg-emerald-100 text-emerald-700", expense: "bg-red-100 text-red-700" }

export default function ChartOfAccountsPage() {
 const router = useRouter()
 const [accounts, setAccounts] = useState<Account[]>([])
const [loading, setLoading] = useState(true)
const [search, setSearch] = useState("")
const [filters, setFilters] = useState<Record<string, string | null>>({})
const handleNew = useCallback(() => router.push("/finance/accounts/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/finance/accounts").then(r => r.json()).then(d => { if (d.accounts) setAccounts(d.accounts) }).finally(() => setLoading(false))
 }, [])

 const columns = [
 { key: "code", label: "Code", cellClassName: "font-mono text-xs text-muted-foreground w-20" },
 { key: "name", label: "Name", render: (a) => <span className="font-medium">{a.name}</span> },
 { key: "type", label: "Type", render: (a) => <Badge className={TYPE_COLORS[a.type] || ""}>{a.type.replace("_", " ")}</Badge> },
 { key: "group", label: "Group", render: (a) => <span className="text-sm text-muted-foreground">{a.group?.name || "—"}</span> },
 { key: "currentBalance", label: "Balance", render: (a) => <span className={`font-mono text-sm ${a.currentBalance >= 0 ? "text-emerald-600" : "text-red-600"}`}>฿{Math.abs(a.currentBalance).toLocaleString()}</span> },
 { key: "isActive", label: "Status", render: (a) => <Badge variant={a.isActive ? "default" : "secondary"}>{a.isActive ? "Active" : "Inactive"}</Badge> },
  ]

const filterColumns: FilterColumn[] = [
  { key: "type", label: "Type", getValue: (p: Account) => p.type },
  { key: "isActive", label: "Status", getValue: (p: Account) => p.isActive ? "Active" : "Inactive" },
]

const filtered = accounts.filter((a) => {
  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue
    const col = filterColumns.find((c) => c.key === key)
    if (col && col.getValue(a) !== value) return false
  }
  if (!search) return true
  return [a.code, a.name, a.type, a.group?.name]
    .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
})

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Chart of Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your GL accounts and groups</p>
        </div>
        <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>New Account <ShortcutBadge shortcut="⌘C" /></Button>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={accounts} />
          )}
        </div>
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search accounts..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={6} columns={columns.length} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icons={[<BookOpen className="w-5 h-5" />, <Building2 className="w-5 h-5" />, <DollarSign className="w-5 h-5" />]}
          title="No accounts yet"
          description="Add your first GL account to start tracking finances."
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
                <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/finance/accounts/${item.id}`)}>
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
