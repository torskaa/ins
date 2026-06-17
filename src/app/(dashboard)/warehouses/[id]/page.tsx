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
import { ArrowLeft, Building2, Calendar, Edit, Hash, Layers, MapPin, Package, PackagePlus, Trash2, Warehouse, XCircle } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { SkeletonDetail } from "@/components/ui/skeleton"

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
 _count: { products: number; stockMovements: number }
 products: WarehouseProduct[]
 stockMovements: StockMovement[]
}

const movementTypeColors: Record<string, "default" | "secondary" | "success" | "destructive" | "warning" | "outline"> = {
 inbound: "success",
 outbound: "destructive",
 transfer_in: "default",
 transfer_out: "warning",
 adjustment: "outline",
}

export default function WarehouseDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const [warehouse, setWarehouse] = useState<Warehouse | null>(null)
 const [loading, setLoading] = useState(true)
 const [id, setId] = useState("")
 const [activeTab, setActiveTab] = useState("info")
 const [editing, setEditing] = useState(false)
 const [editName, setEditName] = useState("")
 const [editLocation, setEditLocation] = useState("")
 const [editCapacity, setEditCapacity] = useState("")
 const [editBinLocation, setEditBinLocation] = useState("")
 const [deleteOpen, setDeleteOpen] = useState(false)
 const [deleting, setDeleting] = useState(false)
 const router = useRouter()

 useEffect(() => { params.then(({ id }) => setId(id)) }, [params])
 useEffect(() => {
 if (!id) return
 fetch(`/api/warehouses/${id}`)
 .then(r => r.json())
 .then(setWarehouse)
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
 setEditing(false)
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

 if (loading) return <SkeletonDetail cards={5} hasChart={true} />

 if (!warehouse) return <p>Warehouse not found</p>

 const summaryCards = [
 { label: "Name", value: warehouse.name, icon: Warehouse, color: "text-blue-600 bg-blue-100" },
 { label: "Location", value: warehouse.location || "—", icon: MapPin, color: "text-violet-600 bg-violet-100" },
 { label: "Capacity", value: warehouse.capacity ? `${warehouse.capacity.toLocaleString()} units` : "—", icon: Layers, color: "text-emerald-600 bg-emerald-100" },
 { label: "Bin Location", value: warehouse.binLocation || "—", icon: Hash, color: "text-amber-600 bg-amber-100" },
 { label: "Products", value: warehouse._count.products, icon: Package, color: "text-rose-600 bg-rose-100" },
 ]

 const productColumns: Column<WarehouseProduct>[] = [
 { key: "name", label: "Name", render: (item) => <span className="font-medium">{item.name}</span> },
 { key: "sku", label: "SKU", render: (item) => <span className="font-mono text-xs text-muted-foreground">{item.sku}</span> },
 { key: "stock", label: "Stock", cellClassName: "font-mono text-sm text-muted-foreground", render: (item) => <span>{item.stock}</span> },
 ]

 const movementColumns: Column<StockMovement>[] = [
 {
 key: "type", label: "Type", render: (item) => (
 <Badge variant={movementTypeColors[item.type] || "default"} className="capitalize">
 {item.type.replace(/_/g, " ")}
 </Badge>
 ),
 },
 {
 key: "product", label: "Product", render: (item) => (
 <span className="text-sm">{item.product.name} <span className="font-mono text-xs text-muted-foreground">({item.product.sku})</span></span>
 ),
 },
 { key: "quantity", label: "Quantity", cellClassName: "font-mono text-sm", render: (item) => <span>{item.quantity}</span> },
 {
 key: "createdAt", label: "Date", render: (item) => (
 <span className="text-sm text-muted-foreground">{formatDateTime(new Date(item.createdAt))}</span>
 ),
 },
 ]

 return (
 <div className="animate-fade-in space-y-6">
 <button
 onClick={() => router.push("/warehouses")}
 className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
 >
 Back to Warehouses
 </button>

 <div className="flex items-start justify-between">
 <div className="flex items-start gap-4">
 <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
 <Building2 className="w-7 h-7 text-primary-dark" />
 </div>
 <div>
 <div className="flex items-center gap-3 mb-1">
 {editing ? (
 <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="text-2xl font-semibold h-auto py-1 w-64" />
 ) : (
 <h1 className="text-2xl font-semibold">{warehouse.name}</h1>
 )}
 <Badge variant="outline" className="text-xs">
 {warehouse._count.products} product{warehouse._count.products !== 1 ? "s" : ""}
 </Badge>
 </div>
 {warehouse.location && (
 <p className="text-sm text-muted-foreground flex items-center gap-1.5">
 {warehouse.location}
 </p>
 )}
 </div>
 </div>
 <div className="flex items-center gap-2">
 {editing ? (
 <>
 <Button variant="secondary" size="sm" onClick={() => setEditing(false)}><XCircle className="w-4 h-4" /> Cancel</Button>
 <Button size="sm" onClick={handleSave}>Save</Button>
 </>
 ) : (
 <>
 <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => { setEditing(true); setEditName(warehouse.name); setEditLocation(warehouse.location || ""); setEditCapacity(warehouse.capacity?.toString() || ""); setEditBinLocation(warehouse.binLocation || "") }}>
 Edit
 </Button>
 <Button variant="secondary" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
 Delete
 </Button>
 </>
 )}
 </div>
 </div>

 <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
 <p className="text-xs text-muted-foreground">Location</p>
 <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
 </div>
 <div className="space-y-2">
 <p className="text-xs text-muted-foreground">Capacity (units)</p>
 <Input type="number" value={editCapacity} onChange={(e) => setEditCapacity(e.target.value)} />
 </div>
 <div className="space-y-2">
 <p className="text-xs text-muted-foreground">Bin Location</p>
 <Input value={editBinLocation} onChange={(e) => setEditBinLocation(e.target.value)} />
 </div>
 </CardContent>
 </Card>
 )}

 <Tabs value={activeTab} onValueChange={setActiveTab}>
 <div className="px-5 pt-4 pb-0 border-b border-border">
 <TabsList>
 <TabsTrigger value="info" className="gap-1.5">
 <Warehouse className="w-4 h-4" />
 Info
 </TabsTrigger>
 <TabsTrigger value="products" className="gap-1.5">
 Products
 {warehouse._count.products > 0 && (
 <span className="ml-1 text-[11px] text-muted-foreground">({warehouse._count.products})</span>
 )}
 </TabsTrigger>
 <TabsTrigger value="movements" className="gap-1.5">
 <PackagePlus className="w-4 h-4" />
 Stock Movements
 {warehouse._count.stockMovements > 0 && (
 <span className="ml-1 text-[11px] text-muted-foreground">({warehouse._count.stockMovements})</span>
 )}
 </TabsTrigger>
 </TabsList>
 </div>

 <TabsContent value="info" className="p-5 m-0">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="space-y-4">
 <div>
 <p className="text-xs text-muted-foreground mb-1">Name</p>
 <p className="text-sm font-medium">{warehouse.name}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1">Location</p>
 <p className="text-sm font-medium flex items-center gap-1.5">
 {warehouse.location || "—"}
 </p>
 </div>
 </div>
 <div className="space-y-4">
 <div>
 <p className="text-xs text-muted-foreground mb-1">Capacity</p>
 <p className="text-sm font-medium font-mono">{warehouse.capacity ? `${warehouse.capacity.toLocaleString()} units` : "—"}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1">Bin Location</p>
 <p className="text-sm font-medium font-mono">{warehouse.binLocation || "—"}</p>
 </div>
 </div>
 <div className="space-y-4">
 <div>
 <p className="text-xs text-muted-foreground mb-1">Products Stored</p>
 <p className="text-sm font-medium">{warehouse._count.products}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1">Stock Movements</p>
 <p className="text-sm font-medium">{warehouse._count.stockMovements}</p>
 </div>
 </div>
 </div>
 </TabsContent>

 <TabsContent value="products" className="p-5 m-0">
 {warehouse.products && warehouse.products.length > 0 ? (
 <DataTable
 columns={productColumns}
 data={warehouse.products}
 searchable
 searchPlaceholder="Search products..."
 onRowClick={(item: any) => router.push(`/products/${item.id}`)}
 />
 ) : (
 <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
 <p className="text-sm">No products in this warehouse</p>
 </div>
 )}
 </TabsContent>

 <TabsContent value="movements" className="p-5 m-0">
 {warehouse.stockMovements && warehouse.stockMovements.length > 0 ? (
 <DataTable
 columns={movementColumns}
 data={warehouse.stockMovements}
 searchable
 searchPlaceholder="Search movements..."
 />
 ) : (
 <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
 <PackagePlus className="w-8 h-8 mb-2" />
 <p className="text-sm">No stock movements recorded</p>
 </div>
 )}
 </TabsContent>
 </Tabs>

 <ConfirmDialog
 open={deleteOpen}
 onOpenChange={setDeleteOpen}
 title="Delete Warehouse"
 description={`Are you sure you want to delete "${warehouse.name}"? This action cannot be undone.`}
 onConfirm={handleDelete}
 loading={deleting}
 />
 </div>
 )
}
