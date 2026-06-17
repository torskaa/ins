"use client"

import { useState, useEffect, useCallback } from "react"
import { DataTable, statusBadge, type Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Box, Search } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { formatCurrency } from "@/lib/utils"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { useRouter } from "next/navigation"
import { downloadCSV, downloadPDF } from "@/lib/export"

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
 const router = useRouter()
 const handleNew = useCallback(() => router.push("/materials/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/materials")
 .then((res) => res.json())
 .then((data) => { if (Array.isArray(data)) setMaterials(data) })
 .finally(() => setLoading(false))
 }, [])

 const filtered = materials.filter((m) =>
 !search || [m.name, m.sku, m.status, m.category?.name]
 .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
 )

 const allColumns: Column<Material>[] = [
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
 <div className="space-y-6 animate-fade-in">
 <div className="flex items-center justify-between flex-wrap gap-4">
 <div>
 <h1 className="text-2xl font-semibold tracking-tight">Materials</h1>
 <p className="text-sm text-muted-foreground mt-1">Manage your raw materials</p>
 </div>
 <div className="flex items-center gap-3">
 {filtered.length > 0 && (
 <>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
<Input placeholder="Search materials..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
 </div>
 <ViewToggle view={view} onChange={setView} />
 <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
 </>
 )}
 <MoreMenu actions={[
 { label: "Import", icon: ActionIcons.AddNew },
 "separator",
 { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Name", "SKU", "Unit Price", "Cost Price", "Stock", "Status"], materials.map(m => [m.name, m.sku, m.unitPrice, m.costPrice, m.stock, m.status]), "materials.csv") },
 { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Materials", []) },
 "separator",
 { label: "Refresh", icon: ActionIcons.Refresh },
 ]} />
 <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>Add Material <ShortcutBadge shortcut="⌘C" />
 </Button>
 </div>
 </div>

 <DataTable
 columns={columns}
 data={filtered}
 onRowClick={(item) => router.push(`/materials/${item.id}`)}
 loading={loading}
 empty={{
 icons: [, , <Box className="w-5 h-5" />],
 title: "No materials yet",
 description: "Add your first raw material to start building BOMs.",
 action: { label: "Add Material", onClick: () => router.push("/materials/new") },
 }}
 />
 </div>
 )
}
