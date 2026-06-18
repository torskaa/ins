"use client"

import { useState, useEffect, useCallback } from "react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Building2, Mail, Phone, Search } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { formatDate } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { downloadCSV, downloadPDF } from "@/lib/export"

type Customer = {
 id: string
 name: string
 email: string
 phone: string
 company: string
 _count: { orders: number; invoices: number }
 createdAt: string
}

const PROPERTY_OPTIONS = [
 { key: "email", label: "Email" },
 { key: "phone", label: "Phone" },
 { key: "orders", label: "Orders" },
 { key: "createdAt", label: "Created" },
]

const DEFAULT_PROPS = ["email", "phone", "orders", "createdAt"]

export default function CRMPage() {
 const [customers, setCustomers] = useState<Customer[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("")
 const [view, setView] = useState<"cards" | "rows">("rows")
const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const router = useRouter()
 const handleNew = useCallback(() => router.push("/crm/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/customers")
 .then(r => r.json())
 .then((data) => { if (Array.isArray(data)) setCustomers(data) })
 .finally(() => setLoading(false))
 }, [])

  const filterColumns: FilterColumn[] = [
  { key: "status", label: "Status", getValue: (c) => "active" },
  { key: "type", label: "Type", getValue: (c) => c.company ? "business" : "individual" },
  ]

  const filtered = customers.filter((item) => {
  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue
    const col = filterColumns.find((c) => c.key === key)
    if (col && col.getValue(item) !== value) return false
  }
  if (!search) return true
  return [item.name, item.email, item.phone, item.company].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  })

  const allColumns = [
 {
 key: "name",
 label: "Name",
 render: (c) => (
 <div>
 <p className="font-medium">{c.name}</p>
 {c.company && <p className="text-xs text-muted-foreground">{c.company}</p>}
 </div>
 ),
 },
 {
 key: "email",
 label: "Email",
 render: (c) => <span className="text-sm text-muted-foreground">{c.email || "—"}</span>,
 },
 {
 key: "phone",
 label: "Phone",
 render: (c) => <span className="text-sm text-muted-foreground">{c.phone || "—"}</span>,
 },
 {
 key: "orders",
 label: "Orders",
 cellClassName: "font-mono text-sm",
 render: (c) => <span>{c._count?.orders || 0}</span>,
 },
 {
 key: "createdAt",
 label: "Created",
 render: (c) => <span className="text-sm text-muted-foreground">{formatDate(new Date(c.createdAt))}</span>,
 },
 ]

 const columns = allColumns.filter((c) => props.includes(c.key))

 return (
 <div className="space-y-6 animate-fade-in">
  <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">CRM</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your customers and relationships</p>
      </div>
      <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>Add Customer <ShortcutBadge shortcut="⌘C" />
      </Button>
    </div>
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        {filtered.length > 0 && (
          <>
            <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={customers} />
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
        <MoreMenu actions={[
          { label: "Import", icon: ActionIcons.AddNew },
          "separator",
          { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Name", "Email", "Phone", "Company", "Total Orders"], customers.map(c => [c.name, c.email || "", c.phone || "", c.company || "", String(c._count?.orders || 0)]), "customers.csv") },
          { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Customers", []) },
          "separator",
          { label: "Refresh", icon: ActionIcons.Refresh },
        ]} />
      </div>
    </div>

  {loading ? (
    <SkeletonTable rows={6} columns={columns.length} />
  ) : filtered.length === 0 ? (
    <EmptyState icons={[<Users className="w-5 h-5" />, <Building2 className="w-5 h-5" />, <Mail className="w-5 h-5" />]} title="No customers yet" description="Add your first customer to start tracking relationships." actions={[{ label: "Add Customer", onClick: () => router.push("/crm/new") }]} />
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
            <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/crm/${item.id}`)}>
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
