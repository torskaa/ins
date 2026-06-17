"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, Building2, ShoppingCart, Package, Truck, CheckCircle2, Clock, MapPin, Mail, Phone, FileText, Pencil, Trash2, Globe, User, Award, BadgePercent, Hash, DollarSign, CalendarDays, ClipboardList } from "lucide-react"
import { SkeletonDetail } from "@/components/ui/skeleton"

interface SupplierPrice {
 id: string
 productId: string
 supplierId: string
 price: number
 currency: string
 leadTimeDays: number | null
 isPreferred: boolean
 product: { id: string; name: string; sku: string }
}

interface Lot {
 id: string
 lotNumber: string
 productId: string
 quantity: number
 receivedDate: string
 expiryDate: string | null
 product: { id: string; name: string; sku: string }
}

interface OrderItem {
 id: string
 productId: string
 quantity: number
 unitPrice: number
 product: { id: string; name: string; sku: string }
}

interface PurchaseOrder {
 id: string
 orderNumber: string
 status: string
 totalAmount: number
 currency: string
 orderDate: string
 items: OrderItem[]
}

interface Product {
 id: string
 name: string
 sku: string
 price: number
 stock: number
 status: string
}

interface Performance {
 totalOrders: number
 deliveredOrders: number
 onTimeDeliveryRate: number
 totalProducts: number
 totalLots: number
}

interface Supplier {
 id: string
 name: string
 email: string | null
 phone: string | null
 taxId: string | null
 rating: string
 paymentTerms: string | null
 currency: string
 address: string | null
 contactPerson: string | null
 contactPersonRole: string | null
 website: string | null
 preferredChannel: string | null
 defaultLeadTime: number | null
 notes: string | null
 createdAt: string
 products: Product[]
 purchaseOrders: PurchaseOrder[]
 lots: Lot[]
 supplierPrices: SupplierPrice[]
 performance: Performance
}

const statusBadge: Record<string, "success" | "secondary" | "warning" | "destructive" | "default"> = {
 active: "success",
 preferred: "default",
 inactive: "secondary",
 blacklisted: "destructive",
 draft: "secondary",
 pending: "warning",
 confirmed: "default",
 shipped: "default",
 delivered: "success",
 cancelled: "destructive",
}

const poStatusBadge: Record<string, "success" | "secondary" | "warning" | "destructive" | "default"> = {
 draft: "secondary",
 pending: "warning",
 confirmed: "default",
 shipped: "default",
 delivered: "success",
 cancelled: "destructive",
}

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const [supplier, setSupplier] = useState<Supplier | null>(null)
 const [loading, setLoading] = useState(true)
 const [showDelete, setShowDelete] = useState(false)
 const [deleting, setDeleting] = useState(false)
 const [tab, setTab] = useState("info")
 const router = useRouter()
 const [id, setId] = useState<string>("")

 useEffect(() => {
 params.then(({ id }) => setId(id))
 }, [params])

 useEffect(() => {
 if (!id) return
 fetch(`/api/suppliers/${id}`)
 .then((res) => res.json())
 .then(setSupplier)
 .finally(() => setLoading(false))
 }, [id])

 async function handleDelete() {
 setDeleting(true)
 try {
 const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" })
 if (!res.ok) throw new Error("Failed")
 toast.success("Supplier deleted")
 router.push("/suppliers")
 router.refresh()
 } catch {
 toast.error("Failed to delete supplier")
 setDeleting(false)
 }
 }

 const productColumns: Column<Product>[] = useMemo(
 () => [
 { key: "name", label: "Product", render: (item) => <span className="font-medium">{item.name}</span> },
 { key: "sku", label: "SKU" },
 { key: "price", label: "Price", render: (item) => formatCurrency(item.price, supplier?.currency) },
 { key: "stock", label: "Stock", render: (item) => (
 <span className={item.stock <= 0 ? "text-destructive font-medium" : ""}>{item.stock}</span>
 )},
 { key: "status", label: "Status", render: (item) => <Badge variant={statusBadge[item.status] || "secondary"} className="capitalize">{item.status}</Badge> },
 ],
 [supplier]
 )

 const poColumns: Column<PurchaseOrder>[] = useMemo(
 () => [
 { key: "orderNumber", label: "Order #", render: (item) => (
 <span className="font-medium text-info hover:underline cursor-pointer" onClick={() => router.push(`/purchase-orders/${item.id}`)}>{item.orderNumber}</span>
 )},
 { key: "status", label: "Status", render: (item) => <Badge variant={poStatusBadge[item.status] || "secondary"} className="capitalize">{item.status}</Badge> },
 { key: "itemsCount", label: "Items", render: (item) => item.items.length },
 { key: "totalAmount", label: "Total", render: (item) => formatCurrency(item.totalAmount, item.currency) },
 { key: "orderDate", label: "Date", render: (item) => formatDateTime(new Date(item.orderDate)) },
 ],
 [router]
 )

 const lotColumns: Column<Lot>[] = useMemo(
 () => [
 { key: "lotNumber", label: "Lot Number", render: (item) => <span className="font-mono text-sm">{item.lotNumber}</span> },
 { key: "product", label: "Product", render: (item) => item.product.name },
 { key: "quantity", label: "Quantity" },
 { key: "receivedDate", label: "Received", render: (item) => formatDateTime(new Date(item.receivedDate)) },
 { key: "expiryDate", label: "Expiry", render: (item) => item.expiryDate ? formatDateTime(new Date(item.expiryDate)) : <span className="text-muted-foreground">—</span> },
 ],
 []
 )

 const pricingColumns: Column<SupplierPrice>[] = useMemo(
 () => [
 { key: "product", label: "Product", render: (item) => <span className="font-medium">{item.product.name}</span> },
 { key: "sku", label: "SKU", render: (item) => item.product.sku },
 { key: "price", label: "Unit Price", render: (item) => formatCurrency(item.price, item.currency) },
 { key: "currency", label: "Currency" },
 { key: "leadTimeDays", label: "Lead Time", render: (item) => item.leadTimeDays ? `${item.leadTimeDays} days` : <span className="text-muted-foreground">—</span> },
 { key: "preferred", label: "", render: (item) => item.isPreferred ? <Badge variant="default">Preferred</Badge> : null },
 ],
 []
 )

 if (loading) return <SkeletonDetail cards={5} hasChart={false} />

 if (!supplier) {
 return (
 <div className="animate-fade-in">
 <p className="text-muted-foreground">Supplier not found</p>
 <Button variant="secondary" onClick={() => router.push("/suppliers")}>Back to Suppliers</Button>
 </div>
 )
 }

 const perf = supplier.performance
 const onTimePct = perf?.onTimeDeliveryRate ?? 0

 return (
 <div className="animate-fade-in space-y-6">
 {/* Back */}
 <button
 onClick={() => router.push("/suppliers")}
 className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
 >
 Back to Suppliers
 </button>

 {/* Header */}
 <Card>
 <CardContent className="p-6">
 <div className="flex items-start justify-between flex-wrap gap-4">
 <div className="flex items-center gap-4">
 <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
 <Building2 className="w-7 h-7 text-primary" />
 </div>
 <div>
 <div className="flex items-center gap-2 mb-1">
 <h1 className="text-2xl font-semibold">{supplier.name}</h1>
 <Badge variant={(statusBadge[supplier.rating] || "secondary") as any} className="capitalize text-xs">{supplier.rating}</Badge>
 </div>
 <div className="flex items-center gap-3 text-sm text-muted-foreground">
 <span className="flex items-center gap-1">
 {perf?.totalProducts ?? supplier.products.length} products
 </span>
 <span className="flex items-center gap-1">
 {onTimePct}% on-time delivery
 </span>
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Button variant="secondary" size="sm" onClick={() => router.push(`/suppliers/${id}/edit`)} className="gap-1.5">
 Edit
 </Button>
 <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)} className="gap-1.5">
 </Button>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Summary Cards */}
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
 <Card>
 <CardContent className="p-4 flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
 </div>
 <div>
 <p className="text-xs text-muted-foreground">Total Products</p>
 <p className="text-lg font-semibold">{perf?.totalProducts ?? supplier.products.length}</p>
 </div>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="p-4 flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-warning/15 flex items-center justify-center shrink-0">
 </div>
 <div>
 <p className="text-xs text-muted-foreground">Total POs</p>
 <p className="text-lg font-semibold">{perf?.totalOrders ?? supplier.purchaseOrders.length}</p>
 </div>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="p-4 flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center shrink-0">
 </div>
 <div>
 <p className="text-xs text-muted-foreground">Delivered</p>
 <p className="text-lg font-semibold">{perf?.deliveredOrders ?? 0}</p>
 </div>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="p-4 flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
 <Award className="w-5 h-5 text-primary-dark" />
 </div>
 <div>
 <p className="text-xs text-muted-foreground">On-Time Rate</p>
 <p className="text-lg font-semibold">{onTimePct}%</p>
 </div>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="p-4 flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-secondary/15 flex items-center justify-center shrink-0">
 </div>
 <div>
 <p className="text-xs text-muted-foreground">Total Lots</p>
 <p className="text-lg font-semibold">{perf?.totalLots ?? supplier.lots.length}</p>
 </div>
 </CardContent>
 </Card>
 </div>

 {/* Tabs */}
 <Tabs value={tab} onValueChange={setTab}>
 <div className="px-6 pt-4 border-b border-border">
 <TabsList>
 <TabsTrigger value="info" className="gap-1.5"><Building2 className="w-4 h-4" />Info</TabsTrigger>
 <TabsTrigger value="products" className="gap-1.5">Products</TabsTrigger>
 <TabsTrigger value="purchase-orders" className="gap-1.5">Purchase Orders</TabsTrigger>
 <TabsTrigger value="lots" className="gap-1.5">Lots</TabsTrigger>
 <TabsTrigger value="pricing" className="gap-1.5">Pricing</TabsTrigger>
 </TabsList>
 </div>

 <TabsContent value="info">
 <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Contact */}
 <div className="space-y-4">
 <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Contact</h3>
 <div className="space-y-3">
 {supplier.contactPerson && (
 <div className="flex items-center gap-3 p-3 rounded-lg bg-surface/50">
 <User className="w-4 h-4 text-muted-foreground shrink-0" />
 <div>
 <p className="text-xs text-muted-foreground">Contact Person</p>
 <p className="text-sm font-medium">{supplier.contactPerson}</p>
 {supplier.contactPersonRole && <p className="text-xs text-muted-foreground">{supplier.contactPersonRole}</p>}
 </div>
 </div>
 )}
 {supplier.email && (
 <div className="flex items-center gap-3 p-3 rounded-lg bg-surface/50">
 <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
 <div>
 <p className="text-xs text-muted-foreground">Email</p>
 <p className="text-sm font-medium">{supplier.email}</p>
 </div>
 </div>
 )}
 {supplier.phone && (
 <div className="flex items-center gap-3 p-3 rounded-lg bg-surface/50">
 <div>
 <p className="text-xs text-muted-foreground">Phone</p>
 <p className="text-sm font-medium">{supplier.phone}</p>
 </div>
 </div>
 )}
 {supplier.preferredChannel && (
 <div className="flex items-center gap-3 p-3 rounded-lg bg-surface/50">
 <Award className="w-4 h-4 text-muted-foreground shrink-0" />
 <div>
 <p className="text-xs text-muted-foreground">Preferred Channel</p>
 <p className="text-sm font-medium capitalize">{supplier.preferredChannel}</p>
 </div>
 </div>
 )}
 {supplier.website && (
 <div className="flex items-center gap-3 p-3 rounded-lg bg-surface/50">
 <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
 <div>
 <p className="text-xs text-muted-foreground">Website</p>
 <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-info hover:underline">{supplier.website}</a>
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Financial & Address */}
 <div className="space-y-4">
 <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Financial & Tax</h3>
 <div className="space-y-3">
 <div className="flex items-center gap-3 p-3 rounded-lg bg-surface/50">
 <BadgePercent className="w-4 h-4 text-muted-foreground shrink-0" />
 <div>
 <p className="text-xs text-muted-foreground">Tax ID</p>
 <p className="text-sm font-medium">{supplier.taxId || <span className="text-muted-foreground">—</span>}</p>
 </div>
 </div>
 <div className="flex items-center gap-3 p-3 rounded-lg bg-surface/50">
 <div>
 <p className="text-xs text-muted-foreground">Payment Terms</p>
 <p className="text-sm font-medium">{supplier.paymentTerms || <span className="text-muted-foreground">—</span>}</p>
 </div>
 </div>
 <div className="flex items-center gap-3 p-3 rounded-lg bg-surface/50">
 <div>
 <p className="text-xs text-muted-foreground">Currency</p>
 <p className="text-sm font-medium">{supplier.currency}</p>
 </div>
 </div>
 <div className="flex items-center gap-3 p-3 rounded-lg bg-surface/50">
 <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
 <div>
 <p className="text-xs text-muted-foreground">Default Lead Time</p>
 <p className="text-sm font-medium">{supplier.defaultLeadTime ? `${supplier.defaultLeadTime} days` : <span className="text-muted-foreground">—</span>}</p>
 </div>
 </div>
 {supplier.address && (
 <div className="flex items-start gap-3 p-3 rounded-lg bg-surface/50">
 <div>
 <p className="text-xs text-muted-foreground">Address</p>
 <p className="text-sm font-medium whitespace-pre-wrap">{supplier.address}</p>
 </div>
 </div>
 )}
 </div>
 {supplier.notes && (
 <div className="p-3 rounded-lg bg-surface/50">
 <p className="text-xs text-muted-foreground mb-1">Notes</p>
 <p className="text-sm whitespace-pre-wrap">{supplier.notes}</p>
 </div>
 )}
 </div>
 </div>
 </TabsContent>

 <TabsContent value="products">
 <div className="p-6">
 <DataTable
 columns={productColumns}
 data={supplier.products}
 searchable
 searchPlaceholder="Search products..."
 />
 </div>
 </TabsContent>

 <TabsContent value="purchase-orders">
 <div className="p-6">
 <DataTable
 columns={poColumns}
 data={supplier.purchaseOrders}
 searchable
 searchPlaceholder="Search orders..."
 />
 </div>
 </TabsContent>

 <TabsContent value="lots">
 <div className="p-6">
 <DataTable
 columns={lotColumns}
 data={supplier.lots}
 searchable
 searchPlaceholder="Search lots..."
 />
 </div>
 </TabsContent>

 <TabsContent value="pricing">
 <div className="p-6">
 <DataTable
 columns={pricingColumns}
 data={supplier.supplierPrices}
 searchable
 searchPlaceholder="Search prices..."
 />
 </div>
 </TabsContent>
 </Tabs>

 {/* Delete Dialog */}
 <Dialog open={showDelete} onOpenChange={setShowDelete}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Delete Supplier</DialogTitle>
 <DialogDescription>
 Are you sure you want to delete <strong>{supplier.name}</strong>? This action cannot be undone.
 </DialogDescription>
 </DialogHeader>
 <DialogFooter>
 <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
 <Button variant="destructive" onClick={handleDelete} loading={deleting}><Trash2 className="w-4 h-4" /> Delete</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 )
}
