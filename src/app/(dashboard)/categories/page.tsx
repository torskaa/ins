"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Tags, Search } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { downloadCSV, downloadPDF } from "@/lib/export"

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

export default function CategoriesPage() {
 const router = useRouter()
 const [categories, setCategories] = useState<Category[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("")
 const [view, setView] = useState<"cards" | "rows">("rows")
 const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
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

 const filtered = categories.filter((c) =>
 !search || [c.name, c.description]
 .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
 )

 const allColumns: Column<Category>[] = [
 { key: "name", label: "Name", render: (c) => <span className="font-medium">{c.name}</span> },
 {
 key: "description",
 label: "Description",
 render: (c) => <span className="text-sm text-muted-foreground">{c.description || "—"}</span>,
 },
 {
 key: "products",
 label: "Products",
 cellClassName: "font-mono text-sm text-muted-foreground",
 render: (c) => <span>{c._count?.products || 0}</span>,
 },
 ]

 const columns = allColumns.filter((c) => props.includes(c.key))

 return (
 <div className="space-y-6 animate-fade-in">
 <div className="flex items-center justify-between flex-wrap gap-4">
 <div>
 <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
 <p className="text-sm text-muted-foreground mt-1">Organize your products into categories</p>
 </div>
 <div className="flex items-center gap-3">
 {filtered.length > 0 && (
 <>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
<Input placeholder="Search categories..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
 </div>
 <ViewToggle view={view} onChange={setView} />
 <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
 </>
 )}
 <MoreMenu actions={[
 { label: "Import", icon: ActionIcons.AddNew },
 "separator",
 { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Name", "Description", "Products"], categories.map(c => [c.name, c.description, c._count?.products]), "categories.csv") },
 { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Categories", []) },
 ]} />
 <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>Add Category <ShortcutBadge shortcut="⌘C" />
 </Button>
 </div>
 </div>

 <DataTable
 columns={columns}
 data={filtered}
 loading={loading}
 empty={{
 icons: [<Tags className="w-5 h-5" />, , ],
 title: "No categories yet",
 description: "Create your first category to organize products.",
 action: { label: "Add Category", onClick: () => setShowCreate(true) },
 }}
 />

 <Dialog open={showCreate} onOpenChange={setShowCreate}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>New Category</DialogTitle>
 <DialogDescription>Add a new product category</DialogDescription>
 </DialogHeader>
 <div className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="catName">Name</Label>
 <Input id="catName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Electronics" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="catDesc">Description (optional)</Label>
 <Input id="catDesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Electronic devices and accessories" />
 </div>
 </div>
 <DialogFooter>
 <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
 <Button onClick={handleCreate}>Create</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 )
}
