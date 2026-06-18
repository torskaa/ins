"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { BookOpen, FileText, Receipt, Search } from "lucide-react"
import { useHotkey } from "@/hooks/use-hotkey"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"

type JournalEntry = { id: string; number: string; date: string; description: string; totalDebit: number; totalCredit: number; status: string; referenceType: string; lines: { account: { name: string } }[] }

export default function JournalEntriesPage() {
 const router = useRouter()
 const [entries, setEntries] = useState<JournalEntry[]>([])
 const [loading, setLoading] = useState(true)
 const handleNew = useCallback(() => router.push("/finance/journal-entries/new"), [router])
  useHotkey("c", handleNew)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [search, setSearch] = useState("")

  useEffect(() => {
 fetch("/api/finance/journal-entries").then(r => r.json()).then(d => { if (d.entries) setEntries(d.entries) }).finally(() => setLoading(false))
 }, [])

  const columns: any[] = [
 { key: "number", label: "Number", cellClassName: "font-mono text-xs w-28" },
 { key: "date", label: "Date", render: (e) => <span className="text-sm">{formatDate(new Date(e.date))}</span> },
 { key: "description", label: "Description", render: (e) => <span className="text-sm truncate max-w-[200px] block">{e.description || "—"}</span> },
 { key: "referenceType", label: "Reference", render: (e) => e.referenceType ? <Badge variant="outline" className="text-xs">{e.referenceType}</Badge> : <span className="text-muted-foreground">—</span> },
 { key: "totalDebit", label: "Debit", render: (e) => <span className="font-mono text-sm">{formatCurrency(e.totalDebit)}</span> },
 { key: "totalCredit", label: "Credit", render: (e) => <span className="font-mono text-sm">{formatCurrency(e.totalCredit)}</span> },
  { key: "status", label: "Status", render: (e) => <Badge variant={e.status === "posted" ? "default" : "secondary"}>{e.status}</Badge> },
  ]

  const filterColumns: FilterColumn[] = [
    { key: "status", label: "Status", getValue: (e: any) => e.status },
    { key: "type", label: "Type", getValue: (e: any) => e.referenceType },
  ]

  const filtered = entries.filter((item) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const col = filterColumns.find((c) => c.key === key)
      if (col && col.getValue(item) !== value) return false
    }
    if (!search) return true
    return [item.number, item.description, item.referenceType].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  })

  return (
  <div className="space-y-6 animate-fade-in">
  <div className="flex items-center justify-between">
  <div>
  <h1 className="text-2xl font-semibold tracking-tight">Journal Entries</h1>
  <p className="text-sm text-muted-foreground mt-1">Record and manage general ledger entries</p>
  </div>
  <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>New Entry <ShortcutBadge shortcut="⌘C" /></Button>
  </div>
   <div className="flex items-center justify-between flex-wrap gap-3">
     <div className="flex items-center gap-3">
       {filtered.length > 0 && (
         <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={entries} />
       )}
     </div>
     <div className="flex items-center gap-3">
       {filtered.length > 0 && (
         <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
           <Input placeholder="Search entries..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
         </div>
       )}
     </div>
   </div>
  {loading ? (
    <SkeletonTable rows={6} columns={columns.length} />
  ) : filtered.length === 0 ? (
    <EmptyState icons={[<BookOpen className="w-5 h-5" />, <FileText className="w-5 h-5" />, <Receipt className="w-5 h-5" />]} title="No journal entries yet" description="Create your first journal entry." />
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
            <TableRow key={item.id} onClick={() => router.push(`/finance/journal-entries/${item.id}`)} className="cursor-pointer">
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
