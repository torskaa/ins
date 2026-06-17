"use client"

import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { DataTable, statusBadge, type Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Package, Tag, BarChart3, Search } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { formatCurrency } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { downloadCSV, downloadPDF } from "@/lib/export"

type Product = {
 id: string
 name: string
 sku: string
 unitPrice: number
 costPrice: number
 stock: number
 minStock: number
 status: string
 category: { name: string } | null
 supplier: { name: string } | null
}

const PROPERTY_OPTIONS = [
 { key: "sku", label: "SKU" },
 { key: "unitPrice", label: "Price" },
 { key: "stock", label: "Stock" },
 { key: "status", label: "Status" },
 { key: "supplier", label: "Supplier" },
]

const DEFAULT_PROPS = ["sku", "unitPrice", "stock", "status", "supplier"]

export default function InventoryPage() {
 const [products, setProducts] = useState<Product[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("")
 const [view, setView] = useState<"cards" | "rows">("rows")
 const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
 const router = useRouter()
 const handleNew = useCallback(() => router.push("/inventory/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/products")
 .then((res) => res.json())
 .then((data) => { if (Array.isArray(data)) setProducts(data) })
 .finally(() => setLoading(false))
 }, [])

 const filtered = products.filter((p) =>
 !search || [p.name, p.sku, p.status, p.supplier?.name, p.category?.name]
 .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
 )

 const allColumns: Column<Product>[] = [
 {
 key: "sku",
 label: "SKU",
 render: (p) => <span className="font-mono text-xs font-medium">{p.sku}</span>,
 },
 {
 key: "name",
 label: "Product",
 render: (p) => (
 <div>
 <p className="font-medium">{p.name}</p>
 {p.category && <p className="text-xs text-muted-foreground">{p.category.name}</p>}
 </div>
 ),
 },
 {
 key: "unitPrice",
 label: "Price",
 render: (p) => <span className="font-mono text-sm">{formatCurrency(p.unitPrice)}</span>,
 },
 {
 key: "stock",
 label: "Stock",
 cellClassName: "font-mono text-sm font-medium",
 render: (p) => {
 const isLow = p.stock <= p.minStock
 return (
 <span className={isLow ? "text-destructive" : ""}>
 {p.stock}
 {isLow && <AlertTriangle className="w-3 h-3 inline ml-1 text-destructive" />}
 </span>
 )
 },
 },
 {
 key: "status",
 label: "Status",
 render: (p) => (
 <span className={statusBadge({ variant: p.status === "active" ? "success" : "secondary" })}>
 {p.status}
 </span>
 ),
 },
 {
 key: "supplier",
 label: "Supplier",
 render: (p) => <span className="text-sm text-muted-foreground">{p.supplier?.name || "—"}</span>,
 },
 ]

 const columns = allColumns.filter((c) => c.key === "name" || props.includes(c.key))

 return (
 <div className="space-y-6 animate-fade-in">
 <div className="flex items-center justify-between flex-wrap gap-4">
 <div>
 <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
 <p className="text-sm text-muted-foreground mt-1">Manage your products and stock levels</p>
 </div>
 <div className="flex items-center gap-3">
 {filtered.length > 0 && (
 <>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
<Input placeholder="Search products..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
 </div>
 <ViewToggle view={view} onChange={setView} />
 <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
 </>
 )}
 <MoreMenu actions={[
 { label: "Import", icon: ActionIcons.AddNew },
 "separator",
 { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Name", "SKU", "Unit Price", "Cost Price", "Stock", "Status"], products.map(p => [p.name, p.sku, p.unitPrice, p.costPrice, p.stock, p.status]), "inventory.csv") },
 { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Inventory", []) },
 "separator",
 { label: "Low Stock Report", href: "/reports", icon: ActionIcons.ViewAll },
 { label: "Refresh", icon: ActionIcons.Refresh },
 ]} />
 <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>
 Add Product <ShortcutBadge shortcut="⌘C" />
 </Button>
 </div>
 </div>

 <DataTable
 columns={columns}
 data={filtered}
 onRowClick={(item) => router.push(`/inventory/${item.id}`)}
 loading={loading}
 empty={{
  icons: [<Package className="w-5 h-5" />, <Tag className="w-5 h-5" />, <BarChart3 className="w-5 h-5" />],
 title: "No products yet",
 description: "Create your first product to start managing inventory.",
 action: { label: "Add Product", onClick: () => router.push("/inventory/new") },
 }}
 />
 </div>
 )
}
