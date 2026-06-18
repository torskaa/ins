"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { BadgePercent, Percent, Receipt, Search } from "lucide-react"
import { useHotkey } from "@/hooks/use-hotkey"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"

type TaxRate = { id: string; name: string; rate: number; type: string; isDefault: boolean; isActive: boolean }

export default function TaxRatesPage() {
 const router = useRouter()
 const [rates, setRates] = useState<TaxRate[]>([])
 const [loading, setLoading] = useState(true)
 const handleNew = useCallback(() => router.push("/tax-rates/new"), [router])
  useHotkey("c", handleNew)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [search, setSearch] = useState("")

  useEffect(() => {
 fetch("/api/tax-rates").then(r => r.json()).then(d => { if (Array.isArray(d)) setRates(d) }).finally(() => setLoading(false))
 }, [])

  const columns: any[] = [
 { key: "name", label: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
 { key: "rate", label: "Rate", render: (r) => <span className="font-mono font-semibold">{r.rate}%</span> },
 { key: "type", label: "Type", render: (r) => <Badge variant="outline">{r.type === "vat" ? "VAT" : r.type === "withholding" ? "Withholding" : r.type}</Badge> },
 { key: "isDefault", label: "Default", render: (r) => r.isDefault ? <Badge className="bg-emerald-100 text-emerald-700 border-0">Default</Badge> : null },
  { key: "isActive", label: "Status", render: (r) => <Badge variant={r.isActive ? "default" : "secondary"}>{r.isActive ? "Active" : "Inactive"}</Badge> },
  ]

  const filterColumns: FilterColumn[] = [
    { key: "name", label: "Name", getValue: (e: any) => e.name },
    { key: "rate", label: "Rate", getValue: (e: any) => String(e.rate) },
    { key: "type", label: "Type", getValue: (e: any) => e.type },
  ]

  const filtered = rates.filter((item) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const col = filterColumns.find((c) => c.key === key)
      if (col && col.getValue(item) !== value) return false
    }
    if (!search) return true
    return [item.name, item.type].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  })

  return (
 <div className="animate-fade-in">
 <div className="page-header flex items-center justify-between">
 <div><h1>Tax Rates</h1><p>Manage VAT, withholding tax, and other tax rates</p></div>
 <div className="flex items-center gap-2">
 <Button variant="secondary" onClick={() => router.push("/tax-rates/reports")} className="gap-1.5">Tax Reports</Button>
 <Button onClick={handleNew} className="gap-1.5">New Tax Rate <ShortcutBadge shortcut="⌘C" /></Button>
 </div>
 </div>
  <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
    <div className="flex items-center gap-3">
      <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={rates} />
    </div>
    <div className="flex items-center gap-3">
      <Button variant="secondary" onClick={() => router.push("/tax-rates/reports")} className="gap-1.5">Tax Reports</Button>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search tax rates..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
    </div>
  </div>
  {loading ? (
    <SkeletonTable rows={6} columns={columns.length} />
  ) : filtered.length === 0 ? (
    <EmptyState icons={[<Percent className="w-5 h-5" />, <BadgePercent className="w-5 h-5" />, <Receipt className="w-5 h-5" />]} title="No tax rates" description="Add VAT and withholding tax rates." />
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
            <TableRow key={item.id} onClick={() => router.push(`/tax-rates/${item.id}/edit`)} className="cursor-pointer">
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
