"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { Building2, MapPin, Search, Warehouse, XCircle } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
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

type WarehouseType = {
  id: string
  name: string
  location: string
  binLocation: string
  _count: { products: number }
}

const PROPERTY_OPTIONS = [
  { key: "location", label: "Location" },
  { key: "binLocation", label: "Bin" },
  { key: "products", label: "Products" },
]

const DEFAULT_PROPS = ["location", "binLocation", "products"]
const PAGE_SIZE = 10

export default function WarehousesPage() {
  const router = useRouter()
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
  const [filters, setFilters] = useState<Record<string, string | null>>({})
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const handleNew = useCallback(() => router.push("/warehouses/new"), [router])
  useHotkey("c", handleNew)
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")

  useEffect(() => {
    fetch("/api/warehouses")
      .then(r => r.json())
      .then((json) => { if (json?.success && Array.isArray(json.data)) setWarehouses(json.data); else if (!json?.success) throw new Error(json?.error || "Failed to load") })
      .catch((err) => { setError(err.message); setLoading(false) })
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    try {
      const res = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, location }),
      })
      if (!res.ok) throw new Error()
      const wh = await res.json()
      setWarehouses([...warehouses, wh])
      setShowCreate(false)
      setName("")
      setLocation("")
      toast.success("Warehouse created")
    } catch {
      toast.error("Failed to create warehouse")
    }
  }

  const filterColumns: FilterColumn[] = [
    { key: "location", label: "Location", getValue: (w: WarehouseType) => w.location || "" },
    { key: "name", label: "Name", getValue: (w: WarehouseType) => w.name },
  ]

  const filtered = warehouses.filter((w) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const col = filterColumns.find((c) => c.key === key)
      if (col && col.getValue(w) !== value) return false
    }
    if (!search) return true
    return [w.name, w.location, w.binLocation]
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
      key: "name",
      label: "Name",
      render: (w: WarehouseType) => (
        <div>
          <p className="font-medium">{w.name}</p>
          {w.location && <p className="text-xs text-foreground">{w.location}</p>}
        </div>
      ),
    },
    {
      key: "location",
      label: "Location",
      render: (w: WarehouseType) => <span className="text-sm text-foreground">{w.location || "—"}</span>,
    },
    {
      key: "binLocation",
      label: "Bin",
      render: (w: WarehouseType) => <span className="font-mono text-xs text-foreground">{w.binLocation || "—"}</span>,
    },
    {
      key: "products",
      label: "Products",
      className: "text-right",
      cellClassName: "text-right",
      render: (w: WarehouseType) => <span className="font-mono text-sm">{w._count?.products || 0}</span>,
    },
  ]

  const columns = allColumns.filter((c) => c.key === "name" || props.includes(c.key))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Warehouses</h1>
          <p className="text-sm text-foreground mt-1">Manage your storage locations</p>
        </div>
        <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>
          Add Warehouse <ShortcutBadge shortcut="⌘C" />
        </Button>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3 [&_.text-muted-foreground]:text-foreground">
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <>
              <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={warehouses} />
              <ViewToggle view={view} onChange={setView} />
              <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground" />
              <Input placeholder="Search warehouses..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
          <MoreMenu actions={[
            { label: "Import", icon: ActionIcons.AddNew },
            "separator",
            { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Name", "Location", "Bin", "Products"], warehouses.map(w => [w.name, w.location, w.binLocation, w._count?.products]), "warehouses.csv") },
            { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Warehouses", []) },
          ]} />
        </div>
      </div>

      {error ? (
        <EmptyState
          variant="error"
          title="Failed to load data"
          description={error}
          actions={[{ label: "Try again", onClick: () => window.location.reload() }]}
        />
      ) : loading ? (
        <SkeletonTable rows={6} columns={columns.length} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icons={[<Warehouse className="w-5 h-5" />, <Building2 className="w-5 h-5" />, <MapPin className="w-5 h-5" />]}
          title="No warehouses yet"
          description="Create your first warehouse to manage storage locations."
          actions={[{ label: "Add Warehouse", onClick: () => setShowCreate(true) }]}
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
                  onClick={() => router.push(`/warehouses/${item.id}`)}
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

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Warehouse</DialogTitle>
            <DialogDescription>Add a new storage location</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="whName">Name</Label>
              <Input id="whName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Main Warehouse" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="whLocation">Location (optional)</Label>
              <Input id="whLocation" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bangkok, Thailand" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowCreate(false)}><XCircle className="w-4 h-4" /> Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
