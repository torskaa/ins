"use client"

import { useState, useEffect, useMemo } from "react"
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
import { Award, BadgePercent, Boxes, Building2, CheckCircle, Clock, DollarSign, FileText, Hash, HouseIcon, MapPin, Package, Pencil, Phone, ShoppingCart, Trash2, User, XCircle } from "lucide-react"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Frame, FramePanel } from "@/components/reui/frame"
import { formatCurrency, formatNumber, formatDate, formatDateTime, cn } from "@/lib/utils"
import { toast } from "sonner"
import { SkeletonDetail } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { MoreMenu } from "@/components/ui/more-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"

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

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [tab, setTab] = useState("products")
  const [form, setForm] = useState<any>({})
  const router = useRouter()
  const [id, setId] = useState<string>("")
  const [searchProducts, setSearchProducts] = useState("")
  const [searchPOs, setSearchPOs] = useState("")
  const [searchLots, setSearchLots] = useState("")
  const [searchPrices, setSearchPrices] = useState("")

  useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  useEffect(() => {
    if (!id) return
    fetch(`/api/suppliers/${id}`)
      .then((res) => res.json())
      .then((json) => { if (json?.success) { const d = json.data; setSupplier(d); setForm({ name: d.name, email: d.email || "", phone: d.phone || "", taxId: d.taxId || "", paymentTerms: d.paymentTerms || "", currency: d.currency, address: d.address || "", contactPerson: d.contactPerson || "", contactPersonRole: d.contactPersonRole || "", website: d.website || "", preferredChannel: d.preferredChannel || "", defaultLeadTime: d.defaultLeadTime != null ? String(d.defaultLeadTime) : "", notes: d.notes || "", rating: d.rating }) } else throw new Error(json?.error || "Failed to load") })
      .catch((err) => { setError(err.message) })
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave() {
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, defaultLeadTime: form.defaultLeadTime ? parseInt(form.defaultLeadTime) : null }),
      })
      if (!res.ok) throw new Error("Failed")
      const updated = await res.json()
      setSupplier(updated)
      setShowEdit(false)
      toast.success("Supplier updated")
    } catch {
      toast.error("Failed to update supplier")
    }
  }

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

  const productColumns = useMemo(
    () => [
      { key: "name", label: "Product", render: (item: Product) => <span className="font-medium">{item.name}</span> },
      { key: "sku", label: "SKU" },
      { key: "price", label: "Price", render: (item: Product) => formatCurrency(item.price, supplier?.currency) },
      { key: "stock", label: "Stock", render: (item: Product) => (
        <span className={item.stock <= 0 ? "text-destructive font-medium" : ""}>{item.stock}</span>
      )},
      { key: "status", label: "Status", render: (item: Product) => <SemanticBadge semantic={item.status} category="status" className="" /> },
    ],
    [supplier]
  )

  const poColumns = useMemo(
    () => [
      { key: "orderNumber", label: "Order #", render: (item: PurchaseOrder) => (
        <span className="font-medium text-info hover:underline cursor-pointer" onClick={() => router.push(`/purchase-orders/${item.id}`)}>{item.orderNumber}</span>
      )},
      { key: "status", label: "Status", render: (item: PurchaseOrder) => <SemanticBadge semantic={item.status} category="status" className="" /> },
      { key: "itemsCount", label: "Items", render: (item: PurchaseOrder) => item.items.length },
      { key: "totalAmount", label: "Total", render: (item: PurchaseOrder) => formatCurrency(item.totalAmount, item.currency) },
      { key: "orderDate", label: "Date", render: (item: PurchaseOrder) => formatDateTime(new Date(item.orderDate)) },
    ],
    [router]
  )

  const lotColumns = useMemo(
    () => [
      { key: "lotNumber", label: "Lot Number", render: (item: Lot) => <span className="font-mono text-sm">{item.lotNumber}</span> },
      { key: "product", label: "Product", render: (item: Lot) => item.product.name },
      { key: "quantity", label: "Quantity" },
      { key: "receivedDate", label: "Received", render: (item: Lot) => formatDateTime(new Date(item.receivedDate)) },
      { key: "expiryDate", label: "Expiry", render: (item: Lot) => item.expiryDate ? formatDateTime(new Date(item.expiryDate)) : <span className="text-muted-foreground">—</span> },
    ],
    []
  )

  const pricingColumns = useMemo(
    () => [
      { key: "product", label: "Product", render: (item: SupplierPrice) => <span className="font-medium">{item.product.name}</span> },
      { key: "sku", label: "SKU", render: (item: SupplierPrice) => item.product.sku },
      { key: "price", label: "Unit Price", render: (item: SupplierPrice) => formatCurrency(item.price, item.currency) },
      { key: "currency", label: "Currency" },
      { key: "leadTimeDays", label: "Lead Time", render: (item: SupplierPrice) => item.leadTimeDays ? `${item.leadTimeDays} days` : <span className="text-muted-foreground">—</span> },
      { key: "preferred", label: "", render: (item: SupplierPrice) => item.isPreferred ? <SemanticBadge semantic="preferred" category="status" /> : null },
    ],
    []
  )

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

  if (loading) return <SkeletonDetail cards={5} hasChart={false} />

  if (!supplier) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Supplier not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The supplier you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/suppliers")}>Back to Suppliers</Button>
      </div>
    )
  }

  const perf = supplier.performance
  const onTimePct = perf?.onTimeDeliveryRate ?? 0

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      <Frame variant="ghost" className="w-fit">
        <FramePanel className="gap-2 px-3! py-2! border-0!">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/suppliers" className="flex items-center gap-1.5">
                  <HouseIcon className="size-4" aria-hidden="true" />
                  Suppliers
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">{supplier.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </FramePanel>
      </Frame>
      <div className="grid grid-cols-12 gap-4">
        {/* Page Header */}
        <div className="col-span-12 border border-border/60 rounded-lg bg-card p-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex gap-3 min-w-0 flex-1">
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{supplier.name}</h1>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <SemanticBadge semantic={supplier.rating} category="status" className="gap-1 text-[11px]"><BadgeDot />{supplier.rating}</SemanticBadge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{perf?.totalProducts ?? supplier.products.length} products</span>
                  <span className="text-muted-foreground/30">·</span>
                  <span>{onTimePct}% on-time delivery</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <MoreMenu actions={[
                  { label: "Edit", icon: <Pencil className="w-4 h-4" />, onClick: () => setShowEdit(true) },
                  "separator",
                  { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDelete(true) },
                ]} />
              </div>
            </div>
          </div>
        </div>

        {/* Left Column (8 cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          {/* Contact Information */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <User className="w-4 h-4 text-primary" />
                Contact Information
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Contact Person" value={supplier.contactPerson || "—"} />
                {supplier.contactPersonRole && <FieldDisplay label="Role" value={supplier.contactPersonRole} />}
                <FieldDisplay label="Email" value={supplier.email || "—"} />
                <FieldDisplay label="Phone" value={supplier.phone || "—"} />
                <FieldDisplay label="Preferred Channel" value={supplier.preferredChannel ? supplier.preferredChannel.charAt(0).toUpperCase() + supplier.preferredChannel.slice(1) : "—"} />
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground font-medium mb-0.5 truncate">Website</p>
                  {supplier.website ? (
                    <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-info hover:underline truncate block">{supplier.website}</a>
                  ) : (
                    <p className="text-sm font-medium">—</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial & Tax */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <BadgePercent className="w-4 h-4 text-primary" />
                Financial & Tax
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Tax ID" value={supplier.taxId || "—"} mono />
                <FieldDisplay label="Payment Terms" value={supplier.paymentTerms || "—"} />
                <FieldDisplay label="Currency" value={supplier.currency} />
                <FieldDisplay label="Default Lead Time" value={supplier.defaultLeadTime ? `${supplier.defaultLeadTime} days` : "—"} />
              </div>
              {supplier.address && (
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium mb-1">Address</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{supplier.address}</p>
                </div>
              )}
              {supplier.notes && (
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{supplier.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Performance Overview */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Award className="w-4 h-4 text-primary" />
                Performance
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="flex items-center gap-2.5"><Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Products</span><span className="text-sm font-medium ml-auto">{perf?.totalProducts ?? supplier.products.length}</span></div>
              <div className="flex items-center gap-2.5"><ShoppingCart className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">POs</span><span className="text-sm font-medium ml-auto">{perf?.totalOrders ?? supplier.purchaseOrders.length}</span></div>
              <div className="flex items-center gap-2.5"><CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Delivered</span><span className="text-sm font-medium ml-auto">{perf?.deliveredOrders ?? 0}</span></div>
              <div className="flex items-center gap-2.5"><Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">On-Time</span><span className="text-sm font-medium ml-auto">{onTimePct}%</span></div>
              <div className="flex items-center gap-2.5"><Boxes className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Lots</span><span className="text-sm font-medium ml-auto">{perf?.totalLots ?? supplier.lots.length}</span></div>
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
                <FieldDisplay label="Created" value={formatDate(new Date(supplier.createdAt))} />
                <FieldDisplay label="Updated" value="—" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tab Module */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden pt-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full overflow-x-auto px-4">
            <TabsTrigger value="products" className="gap-1.5"><Package className="w-4 h-4" /> Products ({supplier.products?.length || 0})</TabsTrigger>
            <TabsTrigger value="purchase-orders" className="gap-1.5"><ShoppingCart className="w-4 h-4" /> Purchase Orders ({supplier.purchaseOrders?.length || 0})</TabsTrigger>
            <TabsTrigger value="lots" className="gap-1.5"><Boxes className="w-4 h-4" /> Lots ({supplier.lots?.length || 0})</TabsTrigger>
            <TabsTrigger value="pricing" className="gap-1.5"><DollarSign className="w-4 h-4" /> Pricing ({supplier.supplierPrices?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="pt-8 px-3 pb-3">
            <div className="flex items-center mb-3">
              <Input
                placeholder="Search products..."
                value={searchProducts}
                onChange={(e) => setSearchProducts(e.target.value)}
                className="h-8 max-w-xs text-xs"
              />
            </div>
            {(() => {
              const filtered = (supplier.products || []).filter((item: any) =>
                !searchProducts || JSON.stringify(item).toLowerCase().includes(searchProducts.toLowerCase())
              )
              return filtered.length === 0 ? (
                <EmptyState
                  icons={[<Package key="sp1" className="w-6 h-6" />, <Building2 key="sp2" className="w-6 h-6" />]}
                  title="No products"
                  description="No products associated with this supplier"
                  size="sm"
                />
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
                        <TableRow key={item.id}>
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
              )
            })()}
          </TabsContent>

          <TabsContent value="purchase-orders" className="pt-8 px-3 pb-3">
            <div className="flex items-center mb-3">
              <Input
                placeholder="Search orders..."
                value={searchPOs}
                onChange={(e) => setSearchPOs(e.target.value)}
                className="h-8 max-w-xs text-xs"
              />
            </div>
            {(() => {
              const filtered = (supplier.purchaseOrders || []).filter((item: any) =>
                !searchPOs || JSON.stringify(item).toLowerCase().includes(searchPOs.toLowerCase())
              )
              return filtered.length === 0 ? (
                <EmptyState
                  icons={[<ShoppingCart key="spo1" className="w-6 h-6" />, <FileText key="spo2" className="w-6 h-6" />]}
                  title="No orders"
                  description="No purchase orders placed with this supplier"
                  size="sm"
                />
              ) : (
                <div data-slot="frame">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {poColumns.map((col: any) => (
                          <TableHead key={col.key}>{col.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((item: any) => (
                        <TableRow key={item.id}>
                          {poColumns.map((col: any) => (
                            <TableCell key={col.key}>
                              {col.render ? col.render(item) : String(item[col.key] ?? "")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            })()}
          </TabsContent>

          <TabsContent value="lots" className="pt-8 px-3 pb-3">
            <div className="flex items-center mb-3">
              <Input
                placeholder="Search lots..."
                value={searchLots}
                onChange={(e) => setSearchLots(e.target.value)}
                className="h-8 max-w-xs text-xs"
              />
            </div>
            {(() => {
              const filtered = (supplier.lots || []).filter((item: any) =>
                !searchLots || JSON.stringify(item).toLowerCase().includes(searchLots.toLowerCase())
              )
              return filtered.length === 0 ? (
                <EmptyState
                  icons={[<Boxes key="slt1" className="w-6 h-6" />, <Package key="slt2" className="w-6 h-6" />]}
                  title="No lots"
                  description="No lots recorded for this supplier"
                  size="sm"
                />
              ) : (
                <div data-slot="frame">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {lotColumns.map((col: any) => (
                          <TableHead key={col.key}>{col.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((item: any) => (
                        <TableRow key={item.id}>
                          {lotColumns.map((col: any) => (
                            <TableCell key={col.key}>
                              {col.render ? col.render(item) : String(item[col.key] ?? "")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            })()}
          </TabsContent>

          <TabsContent value="pricing" className="pt-8 px-3 pb-3">
            <div className="flex items-center mb-3">
              <Input
                placeholder="Search prices..."
                value={searchPrices}
                onChange={(e) => setSearchPrices(e.target.value)}
                className="h-8 max-w-xs text-xs"
              />
            </div>
            {(() => {
              const filtered = (supplier.supplierPrices || []).filter((item: any) =>
                !searchPrices || JSON.stringify(item).toLowerCase().includes(searchPrices.toLowerCase())
              )
              return filtered.length === 0 ? (
                <EmptyState
                  icons={[<DollarSign key="spr1" className="w-6 h-6" />, <BadgePercent key="spr2" className="w-6 h-6" />]}
                  title="No pricing"
                  description="No supplier pricing records found"
                  size="sm"
                />
              ) : (
                <div data-slot="frame">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {pricingColumns.map((col: any) => (
                          <TableHead key={col.key}>{col.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((item: any) => (
                        <TableRow key={item.id}>
                          {pricingColumns.map((col: any) => (
                            <TableCell key={col.key}>
                              {col.render ? col.render(item) : String(item[col.key] ?? "")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            })()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-2xl flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>Update details for <span className="font-medium text-foreground">{supplier?.name}</span></DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="w-4 h-4 text-primary" />
                  Basic Information
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <FieldGroup label="Name" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FieldGroup>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Rating">
                    <Select options={[{ value: "preferred", label: "Preferred" }, { value: "approved", label: "Approved" }, { value: "standard", label: "Standard" }, { value: "blacklisted", label: "Blacklisted" }]} value={form.rating} onChange={(e: any) => setForm({ ...form, rating: e.target.value })} />
                  </FieldGroup>
                  <FieldGroup label="Currency"><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></FieldGroup>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <User className="w-4 h-4 text-primary" />
                  Contact Details
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Contact Person"><Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Contact Role"><Input value={form.contactPersonRole} onChange={(e) => setForm({ ...form, contactPersonRole: e.target.value })} /></FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Website"><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" /></FieldGroup>
                  <FieldGroup label="Preferred Channel">
                    <Select options={[{ value: "email", label: "Email" }, { value: "phone", label: "Phone" }, { value: "portal", label: "Portal" }]} value={form.preferredChannel} onChange={(e: any) => setForm({ ...form, preferredChannel: e.target.value })} />
                  </FieldGroup>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <BadgePercent className="w-4 h-4 text-primary" />
                  Financial & Terms
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Tax ID"><Input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Payment Terms"><Input value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} placeholder="Net 30" /></FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Default Lead Time (days)"><Input type="number" value={form.defaultLeadTime} onChange={(e) => setForm({ ...form, defaultLeadTime: e.target.value })} /></FieldGroup>
                </div>
                <FieldGroup label="Address"><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} /></FieldGroup>
                <FieldGroup label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></FieldGroup>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border/60">
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes <ShortcutBadge shortcut="⌘↵" /></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{supplier.name}</strong>? This action cannot be undone.</DialogDescription>
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
