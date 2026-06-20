"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
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
import { AlertTriangle, Beaker, Calendar, CheckCircle, Clock, ClipboardList, Cog, DollarSign, Hash, Package, Play, Pencil, Trash2, XCircle } from "lucide-react"
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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

type DetailOrder = {
  id: string; number: string; status: string; quantity: number; producedQty: number
  startDate: string | null; dueDate: string | null; completedDate: string | null; notes: string | null; createdAt: string; updatedAt: string
  product: { id: string; name: string; sku: string; unitPrice: number | null }
  bom: { id: string; finishedGoodId: string; version: string; status: string } | null
  warehouse: { id: string; name: string; location: string | null } | null
  materials: Array<{ id: string; product: { id: string; name: string; sku: string; unitPrice: number | null }; quantityNeeded: number; quantityIssued: number }>
  operations: Array<{ id: string; sequence: number; name: string; setupTime: number; runTime: number; workCenter: { id: string; name: string; costPerHour: number } }>
}

const transitionLabels: Record<string, string> = {
  draft: "Confirm Order",
  confirmed: "Start Production",
  in_progress: "Complete Order",
}
const transitionActions: Record<string, string> = {
  draft: "confirmed",
  confirmed: "in_progress",
  in_progress: "completed",
}
const transitionIcons: Record<string, any> = {
  draft: CheckCircle,
  confirmed: Play,
  in_progress: CheckCircle,
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

export default function ProductionOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [order, setOrder] = useState<DetailOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transitioning, setTransitioning] = useState(false)
  const [producedInput, setProducedInput] = useState("")
  const [tab, setTab] = useState("materials")
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/production-orders/${params.id}`)
      .then(r => r.json())
      .then(json => {
        if (!json?.success) throw new Error(json?.error || "Failed to load")
        const d = json.data
        setOrder(d)
        setProducedInput(String(d.quantity))
      })
      .catch((err) => { setError(err.message); setLoading(false) })
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleTransition(action: string) {
    setTransitioning(true)
    try {
      const body: any = { action }
      if (action === "completed" && producedInput) body.producedQty = parseInt(producedInput)
      const res = await fetch(`/api/production-orders/${params.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast.success(`Order ${action.replace(/_/g, " ")}`)
      const updated = await fetch(`/api/production-orders/${params.id}`).then(r => r.json())
      setOrder(updated)
      setProducedInput(String(updated.quantity))
    } catch (err: any) { toast.error(err.message) }
    finally { setTransitioning(false) }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/production-orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: parseInt(form.quantity) || 0,
          startDate: form.startDate || null,
          dueDate: form.dueDate || null,
          notes: form.notes,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Production order updated")
      setShowEdit(false)
      const updated = await fetch(`/api/production-orders/${params.id}`).then(r => r.json())
      setOrder(updated)
    } catch {
      toast.error("Failed to update production order")
    } finally {
      setSaving(false)
    }
  }

  if (error) return (
    <div className="animate-fade-in pb-8 space-y-4">
      <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
    </div>
  )

  if (loading) return <SkeletonDetail cards={3} hasChart={false} />
  if (!order) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Order not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The production order you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/production/orders")}>Back to Orders</Button>
      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-lg flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>Edit Production Order</DialogTitle>
            <DialogDescription>Update details for <span className="font-medium text-foreground">{order?.number}</span></DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  Order Information
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Quantity"><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Start Date"><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Due Date"><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></FieldGroup>
                </div>
                <FieldGroup label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Internal notes..." /></FieldGroup>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border/60">
            <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save Changes <ShortcutBadge shortcut="⌘↵" /></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

  const nextAction = transitionActions[order.status]
  const totalSetup = order.operations.reduce((s, o) => s + o.setupTime, 0)
  const totalRun = order.operations.reduce((s, o) => s + o.runTime, 0)
  const totalCost = order.operations.reduce((s, o) => s + (o.setupTime + o.runTime) / 60 * o.workCenter.costPerHour, 0)

  const materialColumns = [
    { key: "product", label: "Product", render: (item: any) => <span className="font-medium">{item.product?.name}</span> },
    { key: "sku", label: "SKU", render: (item: any) => <span className="font-mono text-xs text-muted-foreground">{item.product?.sku || "—"}</span> },
    { key: "needed", label: "Needed", render: (item: any) => <span className="font-mono">{formatNumber(item.quantityNeeded)}</span> },
    { key: "issued", label: "Issued", render: (item: any) => <span className="font-mono">{formatNumber(item.quantityIssued)}</span> },
  ]

  const operationColumns = [
    { key: "sequence", label: "#", render: (item: any) => <span className="font-mono text-xs">{item.sequence}</span> },
    { key: "name", label: "Operation", render: (item: any) => <span className="font-medium">{item.name}</span> },
    { key: "workCenter", label: "Work Center", render: (item: any) => <span className="text-muted-foreground">{item.workCenter?.name}</span> },
    { key: "time", label: "Time", render: (item: any) => <span className="font-mono">{item.setupTime + item.runTime}m</span> },
    { key: "cost", label: "Cost", render: (item: any) => <span className="font-mono">{formatCurrency((item.setupTime + item.runTime) / 60 * item.workCenter.costPerHour)}</span> },
  ]

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button onClick={() => router.push("/production/orders")}>Orders</button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{order.number}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-12 gap-4">
        {/* Page Header — bento card */}
        <div className="col-span-12 border border-border/60 rounded-lg bg-card p-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{order.number}</h1>
                <SemanticBadge semantic={order.status} category="status" className="gap-1 text-[11px]"><BadgeDot />{order.status.replace(/_/g, " ")}</SemanticBadge>
                <SemanticBadge semantic={order.number} category="id" className="gap-1 font-mono text-[11px]"><Hash className="w-3 h-3" />{order.number}</SemanticBadge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="font-medium">{order.product.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{order.product.sku}</span>
                {order.warehouse && <><span className="text-muted-foreground/30">·</span><span>{order.warehouse.name}</span></>}
              </div>
              {order.updatedAt && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Updated {formatDate(new Date(order.updatedAt))}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {nextAction && (
                  <Button size="sm" onClick={() => handleTransition(nextAction)} loading={transitioning} className="h-9 gap-1.5">
                    {(() => { const Icon = transitionIcons[order.status]; return Icon ? <><Icon className="w-4 h-4" /> {transitionLabels[order.status]}</> : transitionLabels[order.status] })()}
                  </Button>
                )}
                <MoreMenu actions={[
                  ...(["draft", "confirmed"].includes(order.status) ? [{ label: "Edit", icon: <Pencil className="w-4 h-4" />, onClick: () => { setForm({ quantity: String(order.quantity), startDate: order.startDate ? order.startDate.split("T")[0] : "", dueDate: order.dueDate ? order.dueDate.split("T")[0] : "", notes: order.notes || "" }); setShowEdit(true) } }] : []),
                ]} />
              </div>
            </div>
          </div>
        </div>

        {/* Produced quantity input (in_progress) */}
        {order.status === "in_progress" && (
          <div className="col-span-12 border border-warning/20 rounded-lg bg-warning/5 p-4 flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-xs font-medium text-warning mb-1 block">Quantity Produced</Label>
              <Input type="number" min="1" value={producedInput} onChange={(e) => setProducedInput(e.target.value)} className="w-32 bg-white" />
            </div>
            <Button size="sm" onClick={() => handleTransition("completed")} loading={transitioning} className="gap-1.5 mt-5">
              Complete Order
            </Button>
          </div>
        )}

        {/* Left Column (8 cols) — Primary Information */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          {/* Order Details */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardList className="w-4 h-4 text-primary" />
                Order Details
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Product" value={order.product.name} />
                <FieldDisplay label="SKU" value={order.product.sku} mono />
                <FieldDisplay label="Warehouse" value={order.warehouse?.name || "—"} />
                <FieldDisplay label="BOM Version" value={order.bom?.version || "—"} />
                <FieldDisplay label="Start Date" value={order.startDate ? formatDate(new Date(order.startDate)) : "—"} />
                <FieldDisplay label="Due Date" value={order.dueDate ? formatDate(new Date(order.dueDate)) : "—"} />
                <FieldDisplay label="Completed Date" value={order.completedDate ? formatDate(new Date(order.completedDate)) : "—"} />
                <FieldDisplay label="BOM Status" value={order.bom?.status || "—"} />
              </div>
              {order.notes && (
                <div className="pt-2 border-t border-border/60">
                  <p className="text-[11px] text-muted-foreground font-medium mb-0.5">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols) — Contextual / Meta */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Quantity */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Package className="w-4 h-4 text-primary" />
                Quantity
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-semibold">{order.quantity}</span>
                <span className="text-xs text-muted-foreground">units planned</span>
              </div>
              <Progress
                className="h-1.5 mb-2"
                indicatorClassName={order.producedQty >= order.quantity ? "bg-success" : "bg-primary"}
                value={Math.min((order.producedQty / order.quantity) * 100, 100)}
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Produced: {order.producedQty || 0}</span>
                <span>Remaining: {order.quantity - (order.producedQty || 0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Due Date */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Calendar className="w-4 h-4 text-primary" />
                Schedule
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2.5"><Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Start</span><span className="text-sm font-medium ml-auto">{order.startDate ? formatDate(new Date(order.startDate)) : "—"}</span></div>
              <div className="flex items-center gap-2.5"><Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Due</span><span className="text-sm font-medium ml-auto">{order.dueDate ? formatDate(new Date(order.dueDate)) : "—"}</span></div>
              {order.completedDate && <div className="flex items-center gap-2.5"><CheckCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Completed</span><span className="text-sm font-medium ml-auto">{formatDate(new Date(order.completedDate))}</span></div>}
            </CardContent>
          </Card>

          {/* Est. Cost */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <DollarSign className="w-4 h-4 text-primary" />
                Estimated Cost
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-2xl font-semibold font-mono">{formatCurrency(totalCost)}</p>
              <p className="text-xs text-muted-foreground mt-1">Total time: {totalSetup + totalRun}m ({(totalSetup + totalRun) / 60}h)</p>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="w-4 h-4 text-primary" />
                Metadata
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Created" value={order.createdAt ? formatDate(new Date(order.createdAt)) : "—"} />
                <FieldDisplay label="Updated" value={order.updatedAt ? formatDate(new Date(order.updatedAt)) : "—"} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unified Tab Module */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full overflow-x-auto px-4">
            <TabsTrigger value="materials" className="gap-1.5"><Beaker className="w-4 h-4" /> Materials ({order.materials.length})</TabsTrigger>
            <TabsTrigger value="operations" className="gap-1.5"><Cog className="w-4 h-4" /> Operations ({order.operations.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="p-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Beaker className="w-4 h-4 text-primary" />
              Materials
            </div>
            {(order.materials || []).length === 0 ? (
              <EmptyState
                icons={[<Beaker key="pm1" className="w-6 h-6" />, <Package key="pm2" className="w-6 h-6" />, <ClipboardList key="pm3" className="w-6 h-6" />]}
                title="No materials"
                description="Materials for this production order will appear here"
                size="sm"
              />
            ) : (
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {materialColumns.map((col) => (
                        <TableHead key={col.key}>{col.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.materials.map((item: any) => (
                      <TableRow key={item.id}>
                        {materialColumns.map((col) => (
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
          </TabsContent>

          <TabsContent value="operations" className="p-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Cog className="w-4 h-4 text-primary" />
              Operations
            </div>
            {(order.operations || []).length === 0 ? (
              <EmptyState
                icons={[<Cog key="po1" className="w-6 h-6" />, <Play key="po2" className="w-6 h-6" />, <CheckCircle key="po3" className="w-6 h-6" />]}
                title="No operations"
                description="Operations for this production order will appear here"
                size="sm"
              />
            ) : (
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {operationColumns.map((col) => (
                        <TableHead key={col.key}>{col.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.operations.map((item: any) => (
                      <TableRow key={item.id}>
                        {operationColumns.map((col) => (
                          <TableCell key={col.key}>
                            {col.render ? col.render(item) : String(item[col.key] ?? "")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between px-4 py-2 border-t border-border/60 bg-muted/30">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="font-mono text-sm font-semibold">{totalSetup + totalRun}m ({(totalSetup + totalRun) / 60}h) — {formatCurrency(totalCost)}</span>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
