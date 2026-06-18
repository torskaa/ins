"use client"

import { useState, useEffect, useCallback } from "react"
import { statusBadge } from "@/components/ui/data-table"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Box, Package, Search, Truck } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { formatCurrency } from "@/lib/utils"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { useRouter } from "next/navigation"
import { downloadCSV, downloadPDF } from "@/lib/export"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"

type Material = {
 id: string
 name: string
 sku: string
 unitPrice: number
 costPrice: number
 stock: number
 minStock: number
 status: string
 category: { name: string } | null
}

const PROPERTY_OPTIONS = [
 { key: "unitPrice", label: "Price" },
 { key: "stock", label: "Stock" },
 { key: "status", label: "Status" },
]

const DEFAULT_PROPS = ["unitPrice", "stock", "status"]

export default function MaterialsPage() {
 const [materials, setMaterials] = useState<Material[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("")
 const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const router = useRouter()
 const handleNew = useCallback(() => router.push("/materials/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/materials")
 .then((res) => res.json())
 .then((data) => { if (Array.isArray(data)) setMaterials(data) })
 .finally(() => setLoading(false))
 }, [])

  const filterColumns: FilterColumn[] = [
    { key: "status", label: "Status", getValue: (m) => m.status },
    { key: "category", label: "Category", getValue: (m) => m.category?.name || "" },
  ]

  const filtered = materials.filter((m) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const col = filterColumns.find((c) => c.key === key)
      if (col && col.getValue(m) !== value) return false
    }
    if (!search) return true
    return [m.name, m.sku, m.status, m.category?.name]
      .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  })

  const allColumns = [
 {
 key: "sku",
 label: "SKU",
 render: (m) => <span className="font-mono text-xs font-medium">{m.sku}</span>,
 },
 {
 key: "name",
 label: "Name",
 render: (m) => (
 <div>
 <p className="font-medium">{m.name}</p>
 {m.category && <p className="text-xs text-muted-foreground">{m.category.name}</p>}
 </div>
 ),
 },
 {
 key: "unitPrice",
 label: "Price",
 render: (m) => <span className="font-mono text-sm">{formatCurrency(m.unitPrice)}</span>,
 },
 {
 key: "stock",
 label: "Stock",
 cellClassName: "font-mono text-sm font-medium",
 render: (m) => {
 const isLow = m.stock <= m.minStock
 return (
 <span className={isLow ? "text-destructive" : ""}>
 {m.stock}
 {isLow && <AlertTriangle className="w-3 h-3 inline ml-1 text-destructive" />}
 </span>
 )
 },
 },
 {
 key: "status",
 label: "Status",
 render: (m) => (
 <span className={statusBadge({ variant: m.status === "active" ? "success" : "secondary" })}>
 {m.status}
 </span>
 ),
 },
 ]

 const columns = allColumns.filter((c) => props.includes(c.key))

  return (
    <div className="space-y-6 animate-fade-in [&_.text-muted-foreground]:text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Materials</h1>
          <p className="text-sm text-foreground mt-1">Manage your raw materials</p>
        </div>
        <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>
          Add Material <ShortcutBadge shortcut="⌘C" />
        </Button>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <>
              <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={materials} />
              <ViewToggle view={view} onChange={setView} />
              <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground" />
              <Input placeholder="Search materials..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
          <MoreMenu actions={[
            { label: "Import", icon: ActionIcons.AddNew },
            "separator",
            { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Name", "SKU", "Unit Price", "Cost Price", "Stock", "Status"], materials.map(m => [m.name, m.sku, m.unitPrice, m.costPrice, m.stock, m.status]), "materials.csv") },
            { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Materials", []) },
            "separator",
            { label: "Refresh", icon: ActionIcons.Refresh },
          ]} />
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={6} columns={columns.length} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icons={[<Package className="w-5 h-5" />, <Box className="w-5 h-5" />, <Truck className="w-5 h-5" />]}
          title="No materials yet"
          description="Add your first raw material to start building BOMs."
          actions={[{ label: "Add Material", onClick: () => router.push("/materials/new") }]}
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
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/materials/${item.id}`)}
                >
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
