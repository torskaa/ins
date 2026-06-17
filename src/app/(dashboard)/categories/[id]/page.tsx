"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DataTable, type Column } from "@/components/ui/data-table"
import { ArrowLeft, Tags, FolderOpen, Bookmark, Edit, Trash2, Package, Layers, Hash, FileText } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { SkeletonDetail } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"

type CategoryProduct = {
 id: string
 name: string
 sku: string
 price: number
 stock: number
}

type Category = {
 id: string
 name: string
 description: string
 slug: string
 parentId: string | null
 _count: { products: number }
 parent: { id: string; name: string } | null
 children: { id: string; name: string }[]
 products: CategoryProduct[]
}

export default function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const [category, setCategory] = useState<Category | null>(null)
 const [loading, setLoading] = useState(true)
 const [id, setId] = useState("")
 const [activeTab, setActiveTab] = useState("info")
 const [editing, setEditing] = useState(false)
 const [editName, setEditName] = useState("")
 const [editDescription, setEditDescription] = useState("")
 const [deleteOpen, setDeleteOpen] = useState(false)
 const [deleting, setDeleting] = useState(false)
 const router = useRouter()

 useEffect(() => { params.then(({ id }) => setId(id)) }, [params])
 useEffect(() => {
 if (!id) return
 fetch(`/api/categories/${id}`)
 .then(r => r.json())
 .then(setCategory)
 .finally(() => setLoading(false))
 }, [id])

 async function handleSave() {
 try {
 const res = await fetch(`/api/categories/${id}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ name: editName, description: editDescription }),
 })
 if (!res.ok) throw new Error()
 const updated = await res.json()
 setCategory(prev => prev ? { ...prev, ...updated } : prev)
 setEditing(false)
 toast.success("Category updated")
 } catch {
 toast.error("Failed to update category")
 }
 }

 async function handleDelete() {
 setDeleting(true)
 try {
 const res = await fetch(`/api/categories/${id}`, { method: "DELETE" })
 if (!res.ok) throw new Error()
 toast.success("Category deleted")
 router.push("/categories")
 } catch {
 toast.error("Failed to delete category")
 setDeleting(false)
 }
 }

 if (loading) return <SkeletonDetail cards={4} hasChart={true} />

 if (!category) return <p>Category not found</p>

 const summaryCards = [
 { label: "Name", value: category.name, icon: Tags, color: "text-blue-600 bg-blue-100" },
 { label: "Description", value: category.description || "—", icon: FileText, color: "text-violet-600 bg-violet-100" },
 { label: "Slug", value: category.slug, icon: Hash, color: "text-emerald-600 bg-emerald-100" },
 { label: "Products", value: category._count.products, icon: Package, color: "text-amber-600 bg-amber-100" },
 ]

 const productColumns: Column<CategoryProduct>[] = [
 { key: "name", label: "Name", render: (item) => <span className="font-medium">{item.name}</span> },
 { key: "sku", label: "SKU", render: (item) => <span className="font-mono text-xs text-muted-foreground">{item.sku}</span> },
 { key: "price", label: "Price", render: (item) => <span className="font-mono text-sm font-medium">{formatCurrency(item.price)}</span> },
 { key: "stock", label: "Stock", cellClassName: "font-mono text-sm text-muted-foreground", render: (item) => <span>{item.stock}</span> },
 ]

 return (
 <div className="animate-fade-in space-y-6">
 <button
 onClick={() => router.push("/categories")}
 className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
 >
 Back to Categories
 </button>

 <div className="flex items-start justify-between">
 <div className="flex items-start gap-4">
 <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
 </div>
 <div>
 <div className="flex items-center gap-3 mb-1">
 {editing ? (
 <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="text-2xl font-semibold h-auto py-1 w-64" />
 ) : (
 <h1 className="text-2xl font-semibold">{category.name}</h1>
 )}
 <Badge variant="outline" className="text-xs">
 {category._count.products} product{category._count.products !== 1 ? "s" : ""}
 </Badge>
 </div>
 {category.parent && (
 <p className="text-sm text-muted-foreground">
 Parent: <span className="font-medium">{category.parent.name}</span>
 </p>
 )}
 </div>
 </div>
 <div className="flex items-center gap-2">
 {editing ? (
 <>
 <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
 <Button size="sm" onClick={handleSave}>Save</Button>
 </>
 ) : (
 <>
 <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => { setEditing(true); setEditName(category.name); setEditDescription(category.description || "") }}>
 Edit
 </Button>
 <Button variant="secondary" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
 Delete
 </Button>
 </>
 )}
 </div>
 </div>

 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {summaryCards.map((card) => (
 <Card key={card.label} className="border-border/50">
 <CardContent className="p-4">
 <div className="flex items-center gap-3">
 <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
 <card.icon className="w-4 h-4" />
 </div>
 <div className="min-w-0">
 <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">
 {card.label}
 </p>
 <p className="text-sm font-semibold font-mono mt-0.5 truncate">{card.value}</p>
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>

 {editing && (
 <Card>
 <CardHeader>
 <CardTitle className="text-base">Edit Details</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <p className="text-xs text-muted-foreground">Name</p>
 <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
 </div>
 <div className="space-y-2">
 <p className="text-xs text-muted-foreground">Description</p>
 <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
 </div>
 </CardContent>
 </Card>
 )}

 <Tabs value={activeTab} onValueChange={setActiveTab}>
 <div className="px-5 pt-4 pb-0 border-b border-border">
 <TabsList>
 <TabsTrigger value="info" className="gap-1.5">
 <Tags className="w-4 h-4" />
 Info
 </TabsTrigger>
 <TabsTrigger value="products" className="gap-1.5">
 Products
 {category._count.products > 0 && (
 <span className="ml-1 text-[11px] text-muted-foreground">({category._count.products})</span>
 )}
 </TabsTrigger>
 <TabsTrigger value="children" className="gap-1.5">
 <Layers className="w-4 h-4" />
 Children
 {category.children.length > 0 && (
 <span className="ml-1 text-[11px] text-muted-foreground">({category.children.length})</span>
 )}
 </TabsTrigger>
 </TabsList>
 </div>

 <TabsContent value="info" className="p-5 m-0">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-4">
 <div>
 <p className="text-xs text-muted-foreground mb-1">Name</p>
 <p className="text-sm font-medium">{category.name}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1">Description</p>
 <p className="text-sm">{category.description || "—"}</p>
 </div>
 </div>
 <div className="space-y-4">
 <div>
 <p className="text-xs text-muted-foreground mb-1">Slug</p>
 <p className="text-sm font-medium font-mono">{category.slug}</p>
 </div>
 {category.parent && (
 <div>
 <p className="text-xs text-muted-foreground mb-1">Parent Category</p>
 <p className="text-sm font-medium">{category.parent.name}</p>
 </div>
 )}
 </div>
 </div>
 </TabsContent>

 <TabsContent value="products" className="p-5 m-0">
 {category.products && category.products.length > 0 ? (
 <DataTable
 columns={productColumns}
 data={category.products}
 searchable
 searchPlaceholder="Search products..."
 onRowClick={(item: any) => router.push(`/products/${item.id}`)}
 />
 ) : (
 <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
 <p className="text-sm">No products in this category</p>
 </div>
 )}
 </TabsContent>

 <TabsContent value="children" className="p-5 m-0">
 {category.children.length > 0 ? (
 <div className="space-y-2">
 {category.children.map((child) => (
 <button
 key={child.id}
 onClick={() => router.push(`/categories/${child.id}`)}
 className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors text-left"
 >
 <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
 </div>
 <span className="text-sm font-medium">{child.name}</span>
 </button>
 ))}
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
 <Layers className="w-8 h-8 mb-2" />
 <p className="text-sm">No child categories</p>
 </div>
 )}
 </TabsContent>
 </Tabs>

 <ConfirmDialog
 open={deleteOpen}
 onOpenChange={setDeleteOpen}
 title="Delete Category"
 description={`Are you sure you want to delete "${category.name}"? This action cannot be undone.`}
 onConfirm={handleDelete}
 loading={deleting}
 />
 </div>
 )
}
