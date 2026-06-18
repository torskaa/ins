"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { FilterButton, type FilterColumn } from "@/components/ui/filter-button"
import { SkeletonTable } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { FolderOpen, Layers, Search, Tags, XCircle } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { downloadCSV, downloadPDF } from "@/lib/export"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"

type Category = {
 id: string
 name: string
 description: string
 _count: { products: number }
}

const PROPERTY_OPTIONS = [
 { key: "description", label: "Description" },
 { key: "products", label: "Products" },
]

const DEFAULT_PROPS = ["description", "products"]
const PAGE_SIZE = 10

export default function CategoriesPage() {
 const router = useRouter()
 const [categories, setCategories] = useState<Category[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("")
 const [view, setView] = useState<"cards" | "rows">("rows")
  const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
   const [filters, setFilters] = useState<Record<string, string | null>>({})
   const [page, setPage] = useState(1)
   const [showCreate, setShowCreate] = useState(false)
 const handleNew = useCallback(() => router.push("/categories/new"), [router])
 useHotkey("c", handleNew)
 const [name, setName] = useState("")
 const [description, setDescription] = useState("")

 useEffect(() => {
 fetch("/api/categories")
 .then(r => r.json())
 .then((data) => { if (Array.isArray(data)) setCategories(data) })
 .finally(() => setLoading(false))
 }, [])

 async function handleCreate() {
 try {
 const res = await fetch("/api/categories", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ name, description }),
 })
 if (!res.ok) throw new Error()
 const cat = await res.json()
 setCategories([...categories, cat])
 setShowCreate(false)
 setName("")
 setDescription("")
 toast.success("Category created")
 } catch {
 toast.error("Failed to create category")
 }
 }

  const filterColumns: FilterColumn[] = [
   { key: "name", label: "Name", getValue: (c: Category) => c.name },
  ]

  const filtered = categories.filter((c) => {
   for (const [key, value] of Object.entries(filters)) {
    if (!value) continue
    const col = filterColumns.find((c) => c.key === key)
    if (col && col.getValue(c) !== value) return false
   }
   if (!search) return true
   return [c.name, c.description].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const safePage = Math.min(page, Math.max(totalPages, 1))
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, filters])

  const allColumns = [
  { key: "name", label: "Name",   render: (c: Category) => <span className="font-medium">{c.name}</span> },
  {
  key: "description",
  label: "Description",
  render: (c: Category) => <span className="text-sm text-foreground">{c.description || "—"}</span>,
  },
  {
  key: "products",
  label: "Products",
  className: "text-right",
  cellClassName: "text-right font-mono text-sm",
  render: (c: Category) => <span>{c._count?.products || 0}</span>,
  },
 ]

  const columns = allColumns.filter((c) => c.key === "name" || props.includes(c.key))

 return (
 <div className="space-y-6 animate-fade-in">
  <div className="flex items-center justify-between">
  <div>
  <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
  <p className="text-sm text-foreground mt-1">Organize your products into categories</p>
  </div>
  <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>Add Category <ShortcutBadge shortcut="⌘C" />
  </Button>
  </div>
  <div className="flex items-center justify-between flex-wrap gap-3 [&_.text-muted-foreground]:text-foreground">
    <div className="flex items-center gap-3">
     {filtered.length > 0 && (
      <>
       <FilterButton filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} columns={filterColumns} data={categories} />
       <ViewToggle view={view} onChange={setView} />
       <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
      </>
     )}
    </div>
    <div className="flex items-center gap-3">
     {filtered.length > 0 && (
      <div className="relative">
       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground" />
       <Input placeholder="Search categories..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
     )}
     <MoreMenu actions={[
      { label: "Import", icon: ActionIcons.AddNew },
      "separator",
      { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Name", "Description", "Products"], categories.map(c => [c.name, c.description, c._count?.products]), "categories.csv") },
      { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Categories", []) },
     ]} />
    </div>
   </div>

   {loading ? (
    <SkeletonTable rows={6} columns={columns.length} />
   ) : filtered.length === 0 ? (
    <EmptyState
     icons={[<Tags className="w-5 h-5" />, <Layers className="w-5 h-5" />, <FolderOpen className="w-5 h-5" />]}
     title="No categories yet"
     description="Create your first category to organize products."
      actions={[{ label: "Add Category", onClick: () => setShowCreate(true) }]}
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
        {paginated.map((c) => (
        <TableRow key={c.id}>
         {columns.map((col) => (
          <TableCell key={col.key} className={col.cellClassName}>
           {col.render ? col.render(c) : String((c as any)[col.key] ?? "")}
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
 <DialogTitle>New Category</DialogTitle>
 <DialogDescription>Add a new product category</DialogDescription>
 </DialogHeader>
 <div className="space-y-4">
  <div className="space-y-1">
  <Label htmlFor="catName">Name</Label>
  <Input id="catName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Electronics" />
  </div>
  <div className="space-y-1">
  <Label htmlFor="catDesc">Description (optional)</Label>
  <Input id="catDesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Electronic devices and accessories" />
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
