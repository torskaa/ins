"use client"

import { useState, useEffect, useCallback } from "react"
import { statusBadge } from "@/components/ui/data-table"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
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
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"

type Product = {
 id: string
 name: string
 sku: string
 unitPrice: number
 costPrice: number
 stock: number
 minStock: number
 status: string
 image?: string
 category: { name: string } | null
 supplier: { name: string } | null
}

const PROPERTY_OPTIONS = [
  { key: "sku", label: "SKU" },
  { key: "unitPrice", label: "Price" },
  { key: "costPrice", label: "Cost Price" },
  { key: "stock", label: "Stock" },
  { key: "status", label: "Status" },
  { key: "supplier", label: "Supplier" },
]

const DEFAULT_PROPS = ["sku", "unitPrice", "costPrice", "stock", "status", "supplier"]
const PAGE_SIZE = 10

export default function InventoryPage() {
 const [products, setProducts] = useState<Product[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("")
  const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [page, setPage] = useState(1)
  const router = useRouter()
  const handleNew = useCallback(() => router.push("/inventory/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/products")
 .then((res) => res.json())
 .then((data) => { if (Array.isArray(data)) setProducts(data) })
 .finally(() => setLoading(false))
 }, [])

  const filterColumns: FilterColumn[] = [
    { key: "status", label: "Status", getValue: (p: Product) => p.status },
    { key: "supplier", label: "Supplier", getValue: (p: Product) => p.supplier?.name || "" },
    { key: "category", label: "Category", getValue: (p: Product) => p.category?.name || "" },
  ]

  const filtered = products.filter((p) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const col = filterColumns.find((c) => c.key === key)
      if (col && col.getValue(p) !== value) return false
    }
    if (!search) return true
    return [p.name, p.sku, p.status, p.supplier?.name, p.category?.name]
      .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const safePage = Math.min(page, Math.max(totalPages, 1))
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, filters])

  const allColumns = [
 {
 key: "sku",
 label: "SKU",
 className: "w-[120px]",
 render: (p: Product) => <span className="font-mono text-xs font-medium">{p.sku}</span>,
 },
  {
  key: "name",
  label: "Product",
  render: (p: Product) => (
    <div className="flex items-center gap-3">
      {p.image && (
        <img src={p.image} alt={p.name} className="w-10 h-10 rounded-md object-cover border border-border/60 shrink-0" />
      )}
      <div className="min-w-0">
        <p className="font-medium truncate">{p.name}</p>
        {p.category && <p className="text-xs text-foreground truncate">{p.category.name}</p>}
      </div>
    </div>
  ),
  },
 {
 key: "unitPrice",
 label: "Price",
 className: "text-right",
 cellClassName: "text-right",
 render: (p: Product) => <span className="font-mono text-sm">{formatCurrency(p.unitPrice)}</span>,
 },
 {
 key: "costPrice",
 label: "Cost Price",
 className: "text-right",
 cellClassName: "text-right text-foreground",
 render: (p: Product) => <span className="font-mono text-sm">{formatCurrency(p.costPrice)}</span>,
 },
 {
 key: "stock",
 label: "Stock",
 className: "text-right",
 cellClassName: "text-right",
 render: (p: Product) => {
 const isLow = p.stock <= p.minStock
 return (
 <span className={"font-mono text-sm font-medium" + (isLow ? " text-destructive" : " text-foreground")}>
 {p.stock}
 {isLow && <AlertTriangle className="w-3 h-3 inline ml-1 text-destructive" />}
 </span>
 )
 },
 },
 {
 key: "status",
 label: "Status",
 className: "w-[120px]",
 render: (p: Product) => (
 <span className={statusBadge({ variant: p.status === "active" ? "success" : "secondary" })}>
 {p.status}
 </span>
 ),
 },
 {
 key: "supplier",
 label: "Supplier",
 className: "w-[160px]",
 render: (p: Product) => <span className="text-sm text-foreground">{p.supplier?.name || "—"}</span>,
 },
  ]

  const columns = allColumns.filter((c) => c.key === "name" || props.includes(c.key))

  return (
 <div className="space-y-6 animate-fade-in">
   <div className="flex items-center justify-between">
     <div>
       <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
       <p className="text-sm text-foreground mt-1">Manage your products and stock levels</p>
     </div>
     <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>
       Add Product <ShortcutBadge shortcut="⌘C" />
     </Button>
   </div>
    <div className="flex items-center justify-between flex-wrap gap-3 [&_.text-muted-foreground]:text-foreground">
    <div className="flex items-center gap-3">
      {filtered.length > 0 && (
        <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={products} />
      )}
      {filtered.length > 0 && (
        <>
          <ViewToggle view={view} onChange={setView} />
          <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
        </>
      )}
    </div>
    <div className="flex items-center gap-3">
      {filtered.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground" />
          <Input placeholder="Search products..." className="pl-10 h-10 w-56 rounded-md" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
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
    </div>
  </div>

  {loading ? (
    <SkeletonTable rows={6} columns={columns.length} />
  ) : filtered.length === 0 ? (
    <EmptyState
      icons={[<Package className="w-5 h-5" />, <Tag className="w-5 h-5" />, <BarChart3 className="w-5 h-5" />]}
      title="No products yet"
      description="Create your first product to start managing inventory."
      actions={[{ label: "Add Product", onClick: () => router.push("/inventory/new") }]}
    />
  ) : (
    <div data-slot="frame">
      <Table className="[&_th]:px-4 [&_td]:px-4 [&_th]:py-3 [&_td]:py-3">
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>{col.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.map((item) => (
            <TableRow
              key={item.id}
              className="cursor-pointer"
              onClick={() => router.push(`/inventory/${item.id}`)}
            >
              {columns.map((col) => (
                <TableCell key={col.key} className={col.cellClassName}>
                  {col.render(item)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => { e.preventDefault(); setPage(safePage - 1) }}
                className={safePage <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={p === safePage}
                  onClick={(e) => { e.preventDefault(); setPage(p) }}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={(e) => { e.preventDefault(); setPage(safePage + 1) }}
                className={safePage >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )}
 </div>
 )
}
