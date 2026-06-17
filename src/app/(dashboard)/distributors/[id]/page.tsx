"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { use } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { ArrowLeft, Calendar, ClipboardList, Edit, Hash, Mail, MapPin, MoreHorizontal, Package, Phone, Trash2, Truck, User, XCircle } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { SkeletonDetail } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

type DeliveryItem = {
 id: string
 quantity: number
 unitPrice: number
 product: { id: string; name: string; sku: string }
}

type Delivery = {
 id: string
 number: string
 status: string
 totalItems: number
 totalValue: number
 estimatedDate: string | null
 items: DeliveryItem[]
}

type DistributorDetail = {
 id: string
 name: string
 email: string | null
 phone: string | null
 address: string | null
 taxId: string | null
 contactPerson: string | null
 territory: string | null
 route: string | null
 contractStart: string | null
 contractEnd: string | null
 status: string
 notes: string | null
 _count: { deliveries: number }
 deliveries: Delivery[]
}

const statusColors: Record<string, string> = {
 active: "bg-emerald-100 text-emerald-700",
 inactive: "bg-slate-100 text-slate-600",
 suspended: "bg-red-100 text-red-700",
}

const deliveryStatusColors: Record<string, string> = {
 draft: "bg-slate-100 text-slate-600",
 packing: "bg-amber-100 text-amber-700",
 shipped: "bg-blue-100 text-blue-700",
 in_transit: "bg-purple-100 text-purple-700",
 delivered: "bg-emerald-100 text-emerald-700",
 failed: "bg-red-100 text-red-700",
 cancelled: "bg-slate-100 text-slate-600",
}

export default function DistributorDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = use(params)
 const router = useRouter()
 const [distributor, setDistributor] = useState<DistributorDetail | null>(null)
 const [loading, setLoading] = useState(true)
 const [activeTab, setActiveTab] = useState("info")
 const [editing, setEditing] = useState(false)
 const [editName, setEditName] = useState("")
 const [editEmail, setEditEmail] = useState("")
 const [editPhone, setEditPhone] = useState("")
 const [editAddress, setEditAddress] = useState("")
 const [editContactPerson, setEditContactPerson] = useState("")
 const [editNotes, setEditNotes] = useState("")
 const [deleteOpen, setDeleteOpen] = useState(false)
 const [deleting, setDeleting] = useState(false)

 useEffect(() => {
 if (!id) return
 fetch(`/api/distributors/${id}`)
 .then(r => r.json())
 .then(setDistributor)
 .finally(() => setLoading(false))
 }, [id])

 async function handleSave() {
 try {
 const res = await fetch(`/api/distributors/${id}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 name: editName,
 email: editEmail || null,
 phone: editPhone || null,
 address: editAddress || null,
 contactPerson: editContactPerson || null,
 notes: editNotes || null,
 }),
 })
 if (!res.ok) throw new Error()
 const updated = await res.json()
 setDistributor(prev => prev ? { ...prev, ...updated } : prev)
 setEditing(false)
 toast.success("Distributor updated")
 } catch {
 toast.error("Failed to update distributor")
 }
 }

 async function handleDelete() {
 setDeleting(true)
 try {
 const res = await fetch(`/api/distributors/${id}`, { method: "DELETE" })
 if (!res.ok) throw new Error()
 toast.success("Distributor deleted")
 router.push("/distributors")
 } catch {
 toast.error("Failed to delete distributor")
 setDeleting(false)
 }
 }

 if (loading) return <SkeletonDetail cards={4} hasChart={true} />

 if (!distributor) return <p>Distributor not found</p>

 const summaryCards = [
 { label: "Status", value: distributor.status, icon: Truck, color: "text-blue-600 bg-blue-100", badge: true },
 { label: "Territory", value: distributor.territory || "—", icon: MapPin, color: "text-violet-600 bg-violet-100" },
 { label: "Deliveries", value: distributor._count.deliveries, icon: Package, color: "text-amber-600 bg-amber-100" },
 { label: "Route", value: distributor.route || "—", icon: Hash, color: "text-emerald-600 bg-emerald-100" },
 ]

 const deliveryColumns: Column<Delivery>[] = [
 { key: "number", label: "Number", render: (d) => <span className="font-medium">{d.number}</span> },
 { key: "status", label: "Status", render: (d) => <Badge className={`${deliveryStatusColors[d.status] || ""} border-0 font-medium`}>{d.status}</Badge> },
 { key: "totalItems", label: "Items", cellClassName: "font-mono text-sm text-muted-foreground", render: (d) => <span>{d.totalItems}</span> },
 { key: "totalValue", label: "Value", render: (d) => <span className="font-mono text-sm">฿{d.totalValue.toLocaleString()}</span> },
 { key: "estimatedDate", label: "Est. Date", render: (d) => <span className="text-sm text-muted-foreground">{d.estimatedDate ? format(new Date(d.estimatedDate), "dd/MM/yy") : "—"}</span> },
 ]

 return (
 <div className="animate-fade-in space-y-6">
  <Breadcrumb className="mb-4">
  <BreadcrumbList>
  <BreadcrumbItem>
  <BreadcrumbLink asChild>
  <button onClick={() => router.push("/distributors")}>Distributors</button>
  </BreadcrumbLink>
  </BreadcrumbItem>
  <BreadcrumbSeparator />
  <BreadcrumbItem>
  <BreadcrumbPage>{distributor.name}</BreadcrumbPage>
  </BreadcrumbItem>
  </BreadcrumbList>
  </Breadcrumb>

  <div className="flex items-start justify-between">
  <div className="flex items-start gap-4">
  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
  </div>
  <div>
  <div className="flex items-center gap-3 mb-1">
  {editing ? (
  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="text-2xl font-semibold h-auto py-1 w-64" />
  ) : (
  <h1 className="text-2xl font-semibold">{distributor.name}</h1>
 )}
 <Badge className={`${statusColors[distributor.status] || ""} border-0 font-medium`}>
 {distributor.status}
 </Badge>
 </div>
 {distributor.contactPerson && (
 <p className="text-sm text-muted-foreground">
 Contact: <span className="font-medium">{distributor.contactPerson}</span>
 </p>
 )}
 </div>
 </div>
<div className="flex items-center gap-2">
  {editing ? (
  <>
  <Button variant="outline" size="sm" onClick={() => setEditing(false)}><XCircle className="w-4 h-4" /> Cancel</Button>
  <Button size="sm" onClick={handleSave}>Save</Button>
  </>
  ) : (
  <>
  <Button size="sm" className="gap-1.5" onClick={() => router.push(`/distributors/${distributor.id}/edit`)}>
  Edit
  </Button>
  <DropdownMenu>
  <DropdownMenuTrigger asChild>
  <Button variant="ghost" size="sm" className="h-9 w-9 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
  <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
  </DropdownMenuContent>
  </DropdownMenu>
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
 {card.badge ? (
 <Badge className={`${statusColors[distributor.status] || ""} border-0 font-medium mt-0.5`}>
 {distributor.status}
 </Badge>
 ) : (
 <p className="text-sm font-semibold font-mono mt-0.5 truncate">{card.value}</p>
 )}
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>

 {editing && (
 <Card>
 <CardContent className="p-5 space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <p className="text-xs text-muted-foreground">Email</p>
 <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="email@example.com" />
 </div>
 <div className="space-y-2">
 <p className="text-xs text-muted-foreground">Phone</p>
 <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+66 2-123-4567" />
 </div>
 <div className="space-y-2">
 <p className="text-xs text-muted-foreground">Contact Person</p>
 <Input value={editContactPerson} onChange={(e) => setEditContactPerson(e.target.value)} />
 </div>
 <div className="space-y-2">
 <p className="text-xs text-muted-foreground">Address</p>
 <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
 </div>
 </div>
 <div className="space-y-2">
 <p className="text-xs text-muted-foreground">Notes</p>
 <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} />
 </div>
 </CardContent>
 </Card>
 )}

  <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
  <Tabs value={activeTab} onValueChange={setActiveTab}>
    <TabsList className="w-full overflow-x-auto px-4">
 <TabsTrigger value="info" className="gap-1.5">
 <User className="w-4 h-4" />
 Info
 </TabsTrigger>
 <TabsTrigger value="deliveries" className="gap-1.5">
 <Truck className="w-4 h-4" />
 Deliveries
 {distributor._count.deliveries > 0 && (
 <span className="ml-1 text-[11px] text-muted-foreground">({distributor._count.deliveries})</span>
 )}
 </TabsTrigger>
 </TabsList>

  <TabsContent value="info" className="p-3">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-4">
 <div>
 <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
 <p className="text-sm font-medium">{distributor.email || "—"}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">Phone</p>
 <p className="text-sm font-medium">{distributor.phone || "—"}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Contact Person</p>
 <p className="text-sm font-medium">{distributor.contactPerson || "—"}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1">Tax ID</p>
 <p className="text-sm font-medium font-mono">{distributor.taxId || "—"}</p>
 </div>
 </div>
 <div className="space-y-4">
 <div>
 <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">Address</p>
 <p className="text-sm">{distributor.address || "—"}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">Territory</p>
 <p className="text-sm font-medium">{distributor.territory || "—"}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1">Route</p>
 <p className="text-sm font-medium font-mono">{distributor.route || "—"}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Contract</p>
 <p className="text-sm">
 {distributor.contractStart ? format(new Date(distributor.contractStart), "dd/MM/yyyy") : "—"}
 {" → "}
 {distributor.contractEnd ? format(new Date(distributor.contractEnd), "dd/MM/yyyy") : "—"}
 </p>
 </div>
 {distributor.notes && (
 <div>
 <p className="text-xs text-muted-foreground mb-1">Notes</p>
 <p className="text-sm">{distributor.notes}</p>
 </div>
 )}
 </div>
 </div>
 </TabsContent>

  <TabsContent value="deliveries" className="p-3">
  {distributor.deliveries && distributor.deliveries.length > 0 ? (
  <DataTable
  noBorder compact
  columns={deliveryColumns}
 data={distributor.deliveries}
 searchable
 searchPlaceholder="Search deliveries..."
 onRowClick={(item: any) => router.push(`/deliveries/${item.id}`)}
 />
 ) : (
  <EmptyState
  icons={[<Truck key="d1" className="w-6 h-6" />, <Package key="d2" className="w-6 h-6" />, <ClipboardList key="d3" className="w-6 h-6" />]}
  title="No deliveries"
  description="Deliveries assigned to this distributor will appear here"
  size="sm"
  />
 )}
 </TabsContent>
  </Tabs>
  </div>

  <ConfirmDialog
 open={deleteOpen}
 onOpenChange={setDeleteOpen}
 title="Delete Distributor"
 description={`Are you sure you want to delete "${distributor.name}"? This action cannot be undone.`}
 onConfirm={handleDelete}
 loading={deleting}
 />
 </div>
 )
}
