"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge, BadgeDot, SemanticBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { Bookmark, Clock, FileText, FolderOpen, Hash, Layers, Package, Pencil, Tags, Trash2, XCircle } from "lucide-react"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { formatCurrency, formatNumber, formatDate, formatDateTime, cn } from "@/lib/utils"
import { toast } from "sonner"
import { SkeletonDetail } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { MoreMenu } from "@/components/ui/more-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"

function FieldDisplay({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground font-medium mb-0.5 truncate">{label}</p>
      <p className={cn("text-sm truncate", mono ? "font-mono" : "font-medium")}>{value || "—"}</p>
    </div>
  )
}

function FieldGroup({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="min-w-0 space-y-1">
      <Label className="text-[11px] text-muted-foreground font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

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
  createdAt: string
  _count: { products: number }
  parent: { id: string; name: string } | null
  children: { id: string; name: string }[]
  products: CategoryProduct[]
}

export default function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState("")
  const [activeTab, setActiveTab] = useState("products")
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({ name: "", description: "" })
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
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setCategory(prev => prev ? { ...prev, ...updated } : prev)
      setShowEdit(false)
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

  if (!category) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Category not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The category you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/categories")}>Back to Categories</Button>
      </div>
    )
  }

  const productColumns = [
    { key: "name", label: "Name", render: (item: CategoryProduct) => <span className="font-medium">{item.name}</span> },
    { key: "sku", label: "SKU", render: (item: CategoryProduct) => <span className="font-mono text-xs text-muted-foreground">{item.sku}</span> },
    { key: "price", label: "Price", render: (item: CategoryProduct) => <span className="font-mono text-sm font-medium">{formatCurrency(item.price)}</span> },
    { key: "stock", label: "Stock", render: (item: CategoryProduct) => <span className="font-mono text-sm text-muted-foreground">{item.stock}</span> },
  ]

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button onClick={() => router.push("/categories")}>Categories</button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{category.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-12 gap-4">
        {/* Page Header */}
        <div className="col-span-12 border border-border/60 rounded-lg bg-card p-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex gap-3 min-w-0 flex-1">
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{category.name}</h1>
                  <SemanticBadge semantic={category.name} category="category" appearance="outline" className="gap-1 text-[11px]"><Tags className="w-3 h-3" />{category.name}</SemanticBadge>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <SemanticBadge semantic={category.slug} category="id" appearance="outline" className="gap-1 font-mono text-[11px]"><Hash className="w-3 h-3" />{category.slug}</SemanticBadge>
                  <Badge variant="outline" className="text-[11px]">{category._count.products} product{category._count.products !== 1 ? "s" : ""}</Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <MoreMenu actions={[
                  { label: "Edit", icon: <Pencil className="w-4 h-4" />, onClick: () => { setShowEdit(true); setForm({ name: category.name, description: category.description || "" }) } },
                  "separator",
                  { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDelete(true) },
                ]} />
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>Updated {formatDate(new Date(category.createdAt))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Left Column (8 cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Tags className="w-4 h-4 text-primary" />
                Category Details
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Name" value={category.name} />
                <FieldDisplay label="Slug" value={category.slug} mono />
                {category.parent && <FieldDisplay label="Parent Category" value={category.parent.name} />}
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium mb-1">Description</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{category.description || "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Overview */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Hash className="w-4 h-4 text-primary" />
                Overview
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <FieldDisplay label="Name" value={category.name} />
              <FieldDisplay label="Slug" value={category.slug} mono />
              <FieldDisplay label="Products" value={String(category._count.products)} />
              {category.children.length > 0 && <FieldDisplay label="Child Categories" value={String(category.children.length)} />}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="flex-1">
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="w-4 h-4 text-primary" />
                Metadata
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Created" value={formatDate(new Date(category.createdAt))} />
                <FieldDisplay label="Updated" value={formatDate(new Date(category.createdAt))} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unified Tab Module */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full overflow-x-auto px-4">
            <TabsTrigger value="products" className="gap-1.5">
              <Package className="w-4 h-4" />
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

          <TabsContent value="products" className="p-3">
            {!category.products || category.products.length === 0 ? (
              <EmptyState
                icons={[<Package key="p1" className="w-6 h-6" />, <Tags key="p2" className="w-6 h-6" />, <FolderOpen key="p3" className="w-6 h-6" />]}
                title="No products in this category"
                description="Products assigned to this category will appear here"
                size="sm"
              />
            ) : (
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {productColumns.map((col) => (
                        <TableHead key={col.key as string}>{col.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.products.map((item) => (
                      <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/products/${item.id}`)}>
                        {productColumns.map((col) => (
                          <TableCell key={col.key as string}>
                            {col.render ? col.render(item) : String((item as any)[col.key] ?? "")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="children" className="p-3">
            {category.children.length > 0 ? (
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.children.map((child) => (
                      <TableRow key={child.id} className="cursor-pointer" onClick={() => router.push(`/categories/${child.id}`)}>
                        <TableCell><span className="font-medium">{child.name}</span></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState
                icons={[<FolderOpen key="c1" className="w-6 h-6" />, <Layers key="c2" className="w-6 h-6" />, <Bookmark key="c3" className="w-6 h-6" />]}
                title="No child categories"
                description="Subcategories nested under this category will appear here"
                size="sm"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-lg flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update details for <span className="font-medium text-foreground">{category?.name}</span></DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Tags className="w-4 h-4 text-primary" />
                  Basic Information
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <FieldGroup label="Name" required>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Slug">
                  <Input value={category.slug} disabled className="font-mono text-muted-foreground" />
                </FieldGroup>
                <FieldGroup label="Description">
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                </FieldGroup>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border/60">
            <Button variant="secondary" onClick={() => setShowEdit(false)}><XCircle className="w-4 h-4" /> Cancel</Button>
            <Button onClick={handleSave}>Save Changes <ShortcutBadge shortcut="⌘↵" /></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{category.name}</strong>? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowDelete(false)}><XCircle className="w-4 h-4" /> Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}><Trash2 className="w-4 h-4" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
