"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge, SemanticBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { Boxes, Building2, Calendar, Clock, Hash, Layers, MapPin, Package, Pencil, Trash2, Warehouse, XCircle } from "lucide-react"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

import { formatDate, formatDateTime, cn } from "@/lib/utils"
import { toast } from "sonner"
import { SkeletonDetail } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { MoreMenu } from "@/components/ui/more-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"

function FieldDisplay({ label, value, mono, badge }: { label: string; value: string; mono?: boolean; badge?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground font-medium mb-0.5 truncate">{label}</p>
      {badge ? (
        <SemanticBadge semantic={value} category="status">{value}</SemanticBadge>
      ) : (
        <p className={cn("text-sm truncate", mono ? "font-mono" : "font-medium")}>{value || "—"}</p>
      )}
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

type WarehouseProduct = {
  id: string
  name: string
  sku: string
  stock: number
}

type StockMovement = {
  id: string
  type: string
  quantity: number
  createdAt: string
  product: { name: string; sku: string }
}

type Warehouse = {
  id: string
  name: string
  location: string
  capacity: number | null
  binLocation: string
  createdAt: string
  _count: { products: number; stockMovements: number }
  products: WarehouseProduct[]
  stockMovements: StockMovement[]
}

export default function WarehouseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [id, setId] = useState("")
  const [activeTab, setActiveTab] = useState("products")
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editName, setEditName] = useState("")
  const [editLocation, setEditLocation] = useState("")
  const [editCapacity, setEditCapacity] = useState("")
  const [editBinLocation, setEditBinLocation] = useState("")
  const [searchProducts, setSearchProducts] = useState("")
  const [searchMovements, setSearchMovements] = useState("")
  const router = useRouter()

  useEffect(() => { params.then(({ id }) => setId(id)) }, [params])
  useEffect(() => {
    if (!id) return
    fetch(`/api/warehouses/${id}`)
      .then(r => r.json())
      .then(r => { if (r?.success) setWarehouse(r.data); else setError(r?.error || "Failed to load") })
      .catch((err) => { setError(err.message || "Failed to load data") })
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave() {
    try {
      const res = await fetch(`/api/warehouses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          location: editLocation,
          capacity: editCapacity ? Number(editCapacity) : null,
          binLocation: editBinLocation,
        }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setWarehouse(prev => prev ? { ...prev, ...updated } : prev)
      setShowEdit(false)
      toast.success("Warehouse updated")
    } catch {
      toast.error("Failed to update warehouse")
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/warehouses/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Warehouse deleted")
      router.push("/warehouses")
    } catch {
      toast.error("Failed to delete warehouse")
      setDeleting(false)
    }
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Failed to load data"
        description={error}
        actions={[{ label: "Try again", onClick: () => window.location.reload() }]}
      />
    )
  }

  if (loading) return <SkeletonDetail cards={3} hasChart={false} />

  if (!warehouse) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Warehouse not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The warehouse you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/warehouses")}>Back to Warehouses</Button>
      </div>
    )
  }

  const productColumns = [
    { key: "name", label: "Name", render: (item: WarehouseProduct) => <span className="font-medium">{item.name}</span> },
    { key: "sku", label: "SKU", render: (item: WarehouseProduct) => <span className="font-mono text-xs text-muted-foreground">{item.sku}</span> },
    { key: "stock", label: "Stock", render: (item: WarehouseProduct) => <span className="font-mono">{item.stock}</span> },
  ]

  const movementColumns = [
    { key: "type", label: "Type", render: (item: StockMovement) => (
      <SemanticBadge semantic={item.type} category="type" className="" />
    )},
    { key: "product", label: "Product", render: (item: StockMovement) => (
      <span className="text-sm">{item.product.name} <span className="font-mono text-xs text-muted-foreground">({item.product.sku})</span></span>
    )},
    { key: "quantity", label: "Quantity", render: (item: StockMovement) => <span className="font-mono">{item.quantity}</span> },
    { key: "createdAt", label: "Date", render: (item: StockMovement) => (
      <span className="text-sm text-muted-foreground">{formatDateTime(new Date(item.createdAt))}</span>
    )},
  ]

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button onClick={() => router.push("/warehouses")}>
                <Warehouse className="size-4" />
                Warehouses
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{warehouse.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 border border-border/60 rounded-lg bg-card p-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex gap-3 min-w-0 flex-1">
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{warehouse.name}</h1>
                  <Badge variant="outline" className="text-[11px]">{warehouse._count?.products ?? 0} product{warehouse._count?.products !== 1 ? "s" : ""}</Badge>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <SemanticBadge semantic={warehouse.location || "—"} category="id" className="gap-1 font-mono text-[11px]"><MapPin className="w-3 h-3" />{warehouse.location || "—"}</SemanticBadge>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <MoreMenu actions={[
                  { label: "Edit", icon: <Pencil className="w-4 h-4" />, onClick: () => { setShowEdit(true); setEditName(warehouse.name); setEditLocation(warehouse.location || ""); setEditCapacity(warehouse.capacity?.toString() || ""); setEditBinLocation(warehouse.binLocation || "") } },
                  "separator",
                  { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDelete(true) },
                ]} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Warehouse className="w-4 h-4 text-primary" />
                Warehouse Details
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Name" value={warehouse.name} />
                <FieldDisplay label="Location" value={warehouse.location || "—"} />
                <FieldDisplay label="Capacity" value={warehouse.capacity ? `${warehouse.capacity.toLocaleString()} units` : "—"} mono />
                <FieldDisplay label="Bin Location" value={warehouse.binLocation || "—"} mono />
                <FieldDisplay label="Products Stored" value={String(warehouse._count.products)} />
                <FieldDisplay label="Stock Movements" value={String(warehouse._count.stockMovements)} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Boxes className="w-4 h-4 text-primary" />
                Overview
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl font-semibold font-mono">{warehouse._count.products}</span>
                <span className="text-xs text-muted-foreground">products stored</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold font-mono">{warehouse._count.stockMovements}</span>
                <span className="text-xs text-muted-foreground">movements recorded</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="w-4 h-4 text-primary" />
                Organization
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Location</span><span className="text-sm font-medium ml-auto">{warehouse.location || "—"}</span></div>
                <div className="flex items-center gap-2.5"><Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Bin Location</span><span className="text-sm font-medium ml-auto">{warehouse.binLocation || "—"}</span></div>
                <div className="flex items-center gap-2.5"><Layers className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Capacity</span><span className="text-sm font-medium ml-auto">{warehouse.capacity ? `${warehouse.capacity.toLocaleString()} units` : "—"}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="w-4 h-4 text-primary" />
                Metadata
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Created" value={formatDate(new Date(warehouse.createdAt))} />
                <FieldDisplay label="Updated" value={warehouse.updatedAt ? formatDate(new Date(warehouse.updatedAt)) : "—"} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden pt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full overflow-x-auto px-4">
            <TabsTrigger value="products" className="gap-1.5"><Package className="w-4 h-4" /> Products ({warehouse._count.products})</TabsTrigger>
            <TabsTrigger value="movements" className="gap-1.5"><Boxes className="w-4 h-4" /> Stock Movements ({warehouse._count.stockMovements})</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Package className="w-4 h-4 text-primary" />
              Products ({warehouse.products?.length || 0})
            </div>
            {(() => {
              const data = warehouse.products || []
              if (data.length === 0) {
                return (
                  <EmptyState
                    icons={[<Package key="wp1" className="w-6 h-6" />, <Layers key="wp2" className="w-6 h-6" />, <Warehouse key="wp3" className="w-6 h-6" />]}
                    title="No products"
                    description="Products stored in this warehouse will appear here"
                    size="sm"
                  />
                )
              }
              const filtered = !searchProducts ? data : data.filter((item: any) =>
                JSON.stringify(item).toLowerCase().includes(searchProducts.toLowerCase())
              )
              return (
                <>
                  <div className="flex items-center mb-3">
                    <input
                      className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Search products..."
                      value={searchProducts}
                      onChange={(e) => setSearchProducts(e.target.value)}
                    />
                  </div>
                  {filtered.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-6">No products match your search</div>
                  ) : (
                    <div data-slot="frame">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {productColumns.map((col: any) => (
                              <TableHead key={col.key}>{col.label}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map((item: any) => (
                            <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/products/${item.id}`)}>
                              {productColumns.map((col: any) => (
                                <TableCell key={col.key}>
                                  {col.render ? col.render(item) : String(item[col.key] ?? "")}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              )
            })()}
          </TabsContent>

          <TabsContent value="movements" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Boxes className="w-4 h-4 text-primary" />
              Stock Movements ({warehouse.stockMovements?.length || 0})
            </div>
            {(() => {
              const data = warehouse.stockMovements || []
              if (data.length === 0) {
                return (
                  <EmptyState
                    icons={[<Boxes key="wm1" className="w-6 h-6" />, <MapPin key="wm2" className="w-6 h-6" />, <Calendar key="wm3" className="w-6 h-6" />]}
                    title="No stock movements"
                    description="Stock movements in this warehouse will appear here"
                    size="sm"
                  />
                )
              }
              const filtered = !searchMovements ? data : data.filter((item: any) =>
                JSON.stringify(item).toLowerCase().includes(searchMovements.toLowerCase())
              )
              return (
                <>
                  <div className="flex items-center mb-3">
                    <input
                      className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Search movements..."
                      value={searchMovements}
                      onChange={(e) => setSearchMovements(e.target.value)}
                    />
                  </div>
                  {filtered.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-6">No movements match your search</div>
                  ) : (
                    <div data-slot="frame">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {movementColumns.map((col: any) => (
                              <TableHead key={col.key}>{col.label}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map((item: any) => (
                            <TableRow key={item.id}>
                              {movementColumns.map((col: any) => (
                                <TableCell key={col.key}>
                                  {col.render ? col.render(item) : String(item[col.key] ?? "")}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              )
            })()}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-2xl flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>Edit Warehouse</DialogTitle>
            <DialogDescription>Update details for <span className="font-medium text-foreground">{warehouse?.name}</span></DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Warehouse className="w-4 h-4 text-primary" />
                  Warehouse Details
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Name" required><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></FieldGroup>
                  <FieldGroup label="Location"><Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} /></FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Capacity (units)"><Input type="number" value={editCapacity} onChange={(e) => setEditCapacity(e.target.value)} /></FieldGroup>
                  <FieldGroup label="Bin Location"><Input value={editBinLocation} onChange={(e) => setEditBinLocation(e.target.value)} /></FieldGroup>
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border/60">
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘↵</kbd></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Warehouse</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{warehouse.name}</strong>? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}><XCircle className="w-4 h-4" /> Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}><Trash2 className="w-4 h-4" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
