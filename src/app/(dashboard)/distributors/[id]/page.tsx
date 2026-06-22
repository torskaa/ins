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
import { Calendar, Clock, Hash, HouseIcon, Mail, MapPin, Package, Pencil, Phone, Trash2, Truck, User, XCircle } from "lucide-react"
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
  createdAt: string
  _count: { deliveries: number }
  deliveries: Delivery[]
}

export default function DistributorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("")
  const router = useRouter()
  const [distributor, setDistributor] = useState<DistributorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("deliveries")
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", contactPerson: "", notes: "" })
  const [searchDeliveries, setSearchDeliveries] = useState("")

  useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  useEffect(() => {
    if (!id) return
    fetch(`/api/distributors/${id}`)
      .then(r => r.json())
      .then(r => { if (r?.success) setDistributor(r.data); else setError(r?.error || "Failed to load") })
      .catch((err) => { setError(err.message || "Failed to load data") })
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave() {
    try {
      const res = await fetch(`/api/distributors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          address: form.address || null,
          contactPerson: form.contactPerson || null,
          notes: form.notes || null,
        }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setDistributor(prev => prev ? { ...prev, ...updated } : prev)
      setShowEdit(false)
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

  if (loading) return <SkeletonDetail cards={4} hasChart={true} />

  if (!distributor) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Distributor not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The distributor you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/distributors")}>Back to Distributors</Button>
      </div>
    )
  }

  const deliveryColumns = [
    { key: "number", label: "Number", render: (d: Delivery) => <span className="font-medium">{d.number}</span> },
    { key: "status", label: "Status", render: (d: Delivery) => <SemanticBadge semantic={d.status} category="status" className="font-medium" /> },
    { key: "totalItems", label: "Items", render: (d: Delivery) => <span className="font-mono text-sm text-muted-foreground">{d.totalItems}</span> },
    { key: "totalValue", label: "Value", render: (d: Delivery) => <span className="font-mono text-sm">{formatCurrency(d.totalValue)}</span> },
    { key: "estimatedDate", label: "Est. Date", render: (d: Delivery) => <span className="text-sm text-muted-foreground">{d.estimatedDate ? formatDate(new Date(d.estimatedDate)) : "—"}</span> },
  ]

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      {/* Breadcrumb */}
      <Frame variant="ghost" className="w-fit">
        <FramePanel className="gap-2 px-3! py-2! border-0!">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/distributors" className="flex items-center gap-1.5">
                  <HouseIcon className="size-4" aria-hidden="true" />
                  Distributors
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">{distributor.name}</BreadcrumbPage>
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
                  <h1 className="text-2xl font-bold">{distributor.name}</h1>
                  {distributor.territory && (
                    <SemanticBadge semantic={distributor.territory} category="category" className="gap-1 text-[11px]"><MapPin className="w-3 h-3" />{distributor.territory}</SemanticBadge>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <SemanticBadge semantic={distributor.status} category="status" className="gap-1 text-[11px]"><BadgeDot />{distributor.status}</SemanticBadge>
                  <SemanticBadge semantic={distributor.taxId || distributor.id} category="id" className="gap-1 font-mono text-[11px]"><Hash className="w-3 h-3" />{distributor.taxId || distributor.id}</SemanticBadge>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <MoreMenu actions={[
                  { label: "Edit", icon: <Pencil className="w-4 h-4" />, onClick: () => { setShowEdit(true); setForm({ name: distributor.name, email: distributor.email || "", phone: distributor.phone || "", address: distributor.address || "", contactPerson: distributor.contactPerson || "", notes: distributor.notes || "" }) } },
                  "separator",
                  { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDelete(true) },
                ]} />
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>Updated {formatDate(new Date(distributor.createdAt))}</span>
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
                <FieldDisplay label="Email" value={distributor.email || "—"} />
                <FieldDisplay label="Phone" value={distributor.phone || "—"} />
                <FieldDisplay label="Contact Person" value={distributor.contactPerson || "—"} />
                <FieldDisplay label="Tax ID" value={distributor.taxId || "—"} mono />
                <FieldDisplay label="Address" value={distributor.address || "—"} />
                <FieldDisplay label="Territory" value={distributor.territory || "—"} />
                <FieldDisplay label="Route" value={distributor.route || "—"} mono />
              </div>
            </CardContent>
          </Card>

          {/* Contract */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Calendar className="w-4 h-4 text-primary" />
                Contract
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Contract Start" value={distributor.contractStart ? formatDate(new Date(distributor.contractStart)) : "—"} />
                <FieldDisplay label="Contract End" value={distributor.contractEnd ? formatDate(new Date(distributor.contractEnd)) : "—"} />
              </div>
              {distributor.notes && (
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{distributor.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Overview */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Truck className="w-4 h-4 text-primary" />
                Overview
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <FieldDisplay label="Status" value={distributor.status} />
              <FieldDisplay label="Territory" value={distributor.territory || "—"} />
              <FieldDisplay label="Deliveries" value={String(distributor._count.deliveries)} />
              <FieldDisplay label="Route" value={distributor.route || "—"} />
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
                <FieldDisplay label="Created" value={formatDate(new Date(distributor.createdAt))} />
                <FieldDisplay label="Updated" value={formatDate(new Date(distributor.createdAt))} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unified Tab Module */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden pt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full overflow-x-auto px-4">
            <TabsTrigger value="deliveries" className="gap-1.5">
              <Truck className="w-4 h-4" />
              Deliveries
              {distributor._count.deliveries > 0 && (
                <span className="ml-1 text-[11px] text-muted-foreground">({distributor._count.deliveries})</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deliveries" className="pt-8 px-3 pb-3">
            <div className="flex items-center mb-3">
              <input
                className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Search deliveries..."
                value={searchDeliveries}
                onChange={(e) => setSearchDeliveries(e.target.value)}
              />
            </div>
            {(() => {
              const data = distributor.deliveries || []
              if (data.length === 0) {
                return (
                  <EmptyState
                    icons={[<Truck key="d1" className="w-6 h-6" />, <Package key="d2" className="w-6 h-6" />]}
                    title="No deliveries"
                    description="Deliveries assigned to this distributor will appear here"
                    size="sm"
                  />
                )
              }
              const filtered = !searchDeliveries ? data : data.filter((item: any) =>
                JSON.stringify(item).toLowerCase().includes(searchDeliveries.toLowerCase())
              )
              return filtered.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-6">No deliveries match your search</div>
              ) : (
                <div data-slot="frame">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {deliveryColumns.map((col: any) => (
                          <TableHead key={col.key}>{col.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((item: any) => (
                        <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/deliveries/${item.id}`)}>
                          {deliveryColumns.map((col: any) => (
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
        <DialogContent className="sm:max-w-lg flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>Edit Distributor</DialogTitle>
            <DialogDescription>Update details for <span className="font-medium text-foreground">{distributor?.name}</span></DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <User className="w-4 h-4 text-primary" />
                  Contact Information
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <FieldGroup label="Name" required>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </FieldGroup>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Email">
                    <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                  </FieldGroup>
                  <FieldGroup label="Phone">
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+66 2-123-4567" />
                  </FieldGroup>
                </div>
                <FieldGroup label="Contact Person">
                  <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Address">
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </FieldGroup>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Calendar className="w-4 h-4 text-primary" />
                  Notes
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <FieldGroup label="Notes">
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
                </FieldGroup>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border/60">
            <Button variant="outline" onClick={() => setShowEdit(false)}><XCircle className="w-4 h-4" /> Cancel</Button>
            <Button onClick={handleSave}>Save Changes <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘↵</kbd></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Distributor</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{distributor.name}</strong>? This action cannot be undone.</DialogDescription>
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
