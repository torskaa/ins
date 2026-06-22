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
import { Activity, ArrowLeft, Building2, Calendar, CheckCircle2, Clock, DollarSign, FileText, Hash, HouseIcon, Layers, Package, Pencil, ShoppingCart, Trash2, XCircle } from "lucide-react"
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

export default function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [quotation, setQuotation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState("")
  const [tab, setTab] = useState("items")
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<any>({})
  const router = useRouter()
  const [id, setId] = useState("")
  const [searchItems, setSearchItems] = useState("")
  const [searchActivity, setSearchActivity] = useState("")

  useEffect(() => { params.then(({ id }) => setId(id)) }, [params])

  function fetchQuotation() {
    if (!id) return
    setLoading(true)
    fetch(`/api/quotations/${id}`)
      .then(r => r.json())
      .then(json => { if (json?.success) { const d = json.data; setQuotation(d); setForm({ number: d.number, customerId: d.customerId || "", validUntil: d.validUntil || "", notes: d.notes || "", subtotal: String(d.subtotal || 0), discount: String(d.discount || 0), tax: String(d.tax || 0) }) } else throw new Error(json?.error || "Failed to load") })
      .catch((err) => { setError(err.message) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchQuotation() }, [id])

  async function handleTransition(action: string) {
    setActionLoading(action)
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast.success(`Quotation ${action}`)
      fetchQuotation()
    } catch (err: any) { toast.error(err.message) }
    finally { setActionLoading("") }
  }

  async function handleConvert() {
    setActionLoading("convert")
    try {
      const res = await fetch(`/api/quotations/${id}/convert`, { method: "POST" })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast.success("Converted to order")
      fetchQuotation()
    } catch (err: any) { toast.error(err.message) }
    finally { setActionLoading("") }
  }

  async function handleSave() {
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, subtotal: parseFloat(form.subtotal) || 0, discount: parseFloat(form.discount) || 0, tax: parseFloat(form.tax) || 0 }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Quotation updated")
      setShowEdit(false)
      fetchQuotation()
    } catch {
      toast.error("Failed to update quotation")
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/quotations/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      toast.success("Quotation deleted")
      router.push("/quotations")
      router.refresh()
    } catch {
      toast.error("Failed to delete quotation")
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

  if (loading) return <SkeletonDetail cards={4} hasChart={false} />

  if (!quotation) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Quotation not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The quotation you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/quotations")}>Back to Quotations</Button>
      </div>
    )
  }

  const { status } = quotation
  const itemCount = quotation.items?.length || 0

  const itemsColumns = [
    { key: "product", label: "Product", render: (item: any) => <span className="font-medium">{item.product?.name || "Unknown"}</span> },
    { key: "sku", label: "SKU", render: (item: any) => <span className="font-mono text-xs text-muted-foreground">{item.product?.sku || "—"}</span> },
    { key: "quantity", label: "Qty", render: (item: any) => <span className="font-mono text-sm">{item.quantity}</span> },
    { key: "unitPrice", label: "Unit Price", render: (item: any) => <span className="font-mono text-sm">{formatCurrency(item.unitPrice)}</span> },
    { key: "total", label: "Total", render: (item: any) => <span className="font-mono text-sm font-medium">{formatCurrency(item.total)}</span> },
  ]

  const activityColumns = [
    { key: "createdAt", label: "Date", render: (item: any) => <span className="text-sm text-muted-foreground">{formatDateTime(new Date(item.createdAt))}</span> },
    { key: "action", label: "Action", render: (item: any) => <span className="text-sm capitalize">{item.action}</span> },
    { key: "description", label: "Description", render: (item: any) => <span className="text-sm text-muted-foreground">{item.description || "—"}</span> },
  ]

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      {/* Breadcrumb */}
      <Frame variant="ghost" className="w-fit">
        <FramePanel className="gap-2 px-3! py-2! border-0!">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/quotations" className="flex items-center gap-1.5">
                  <HouseIcon className="size-4" aria-hidden="true" />
                  Quotations
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">{quotation.number}</BreadcrumbPage>
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
                  <h1 className="text-2xl font-bold">{quotation.number}</h1>
                  {quotation.customer && (
                    <SemanticBadge semantic={quotation.customer.name} category="category" className="gap-1 text-[11px]"><Building2 className="w-3 h-3" />{quotation.customer.name}</SemanticBadge>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <SemanticBadge semantic={status} category="status" className="gap-1 text-[11px]"><BadgeDot />{status}</SemanticBadge>
                  <SemanticBadge semantic={quotation.number} category="id" className="gap-1 font-mono text-[11px]"><Hash className="w-3 h-3" />{quotation.number}</SemanticBadge>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {["draft", "sent"].includes(status) && !quotation.order && (
                  <Button size="sm" onClick={handleConvert} loading={actionLoading === "convert"} disabled={status === "draft"} title={status === "draft" ? "Send quotation first" : "Convert to order"} className="gap-1.5 h-8 text-xs">
                    Convert to Order
                  </Button>
                )}
                <MoreMenu actions={[
                  ...(status === "draft" ? [{ label: "Edit", icon: <Pencil className="w-4 h-4" />, onClick: () => setShowEdit(true) }] : []),
                  ("separator" as const),
                  { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDelete(true) },
                ]} />
              </div>
            </div>
          </div>
          {/* Status action buttons */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {status === "draft" && (
              <Button size="sm" onClick={() => handleTransition("sent")} loading={actionLoading === "sent"} className="gap-1.5">
                Send
              </Button>
            )}
            {status === "sent" && (
              <Button variant="success" size="sm" onClick={() => handleTransition("confirmed")} loading={actionLoading === "confirmed"} className="gap-1.5">
                Confirm
              </Button>
            )}
            {status === "expired" && (
              <Button size="sm" onClick={() => handleTransition("sent")} loading={actionLoading === "sent"} className="gap-1.5">
                Renew
              </Button>
            )}
            {["draft", "sent", "confirmed"].includes(status) && (
              <Button variant="ghost" size="sm" onClick={() => handleTransition("cancelled")} loading={actionLoading === "cancelled"} className="gap-1.5 text-destructive">
                <XCircle className="w-4 h-4" /> Cancel
              </Button>
            )}
            {status === "sent" && (
              <Button variant="ghost" size="sm" onClick={() => handleTransition("expired")} loading={actionLoading === "expired"} className="gap-1.5 text-warning">
                <Clock className="w-4 h-4" /> Mark Expired
              </Button>
            )}
          </div>
        </div>

        {/* Metric cards row */}
        <div className="col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center gap-2">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground font-medium">Total</p>
                <p className="text-xl font-semibold font-mono">{formatCurrency(quotation.total)}</p>
                {quotation.subtotal > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Subtotal {formatCurrency(quotation.subtotal)}
                    {quotation.discount > 0 && <> &middot; -{formatCurrency(quotation.discount)}</>}
                    {quotation.tax > 0 && <> &middot; Tax {formatCurrency(quotation.tax)}</>}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground font-medium">Line Items</p>
                <p className="text-xl font-semibold font-mono">{itemCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground font-medium">Valid Until</p>
                <p className="text-xl font-semibold font-mono text-sm">{quotation.validUntil ? formatDate(new Date(quotation.validUntil)) : "—"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground font-medium">Linked Order</p>
                {quotation.order ? (
                  <div className="text-center">
                    <button onClick={() => router.push(`/orders/${quotation.order.id}`)} className="text-sm font-medium text-info hover:underline">{quotation.order.number}</button>
                    <SemanticBadge semantic={quotation.order.status} category="status" className="text-[10px] mt-0.5">{quotation.order.status}</SemanticBadge>
                  </div>
                ) : <p className="text-sm font-mono text-muted-foreground">—</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Left Column (8 cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="w-4 h-4 text-primary" />
                Quotation Details
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Customer" value={quotation.customer?.name || "—"} />
                <FieldDisplay label="Valid Until" value={quotation.validUntil ? formatDate(new Date(quotation.validUntil)) : "—"} />
                <FieldDisplay label="Status" value={status} />
                <FieldDisplay label="Subtotal" value={formatCurrency(quotation.subtotal || 0)} mono />
                {quotation.discount > 0 && <FieldDisplay label="Discount" value={`-${formatCurrency(quotation.discount)}`} mono />}
                {quotation.tax > 0 && <FieldDisplay label="Tax" value={formatCurrency(quotation.tax)} mono />}
              </div>
              {quotation.notes && (
                <div className="pt-3 border-t border-border">
                  <p className="text-[11px] text-muted-foreground font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quotation.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Organization */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="w-4 h-4 text-primary" />
                Customer
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <FieldDisplay label="Customer" value={quotation.customer?.name || "—"} />
              <FieldDisplay label="Customer ID" value={quotation.customer?.id || "—"} mono />
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
                <FieldDisplay label="Created" value={formatDate(new Date(quotation.createdAt))} />
                <FieldDisplay label="Updated" value={quotation.updatedAt ? formatDate(new Date(quotation.updatedAt)) : "—"} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tab Module */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden pt-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full overflow-x-auto px-4">
            <TabsTrigger value="items" className="gap-1.5"><Package className="w-4 h-4" /> Items ({itemCount})</TabsTrigger>
            <TabsTrigger value="order" className="gap-1.5"><ShoppingCart className="w-4 h-4" /> Order</TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5"><Activity className="w-4 h-4" /> Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="pt-8 px-3 pb-3">
            <div className="flex items-center mb-3">
              <Input
                placeholder="Search items..."
                value={searchItems}
                onChange={(e) => setSearchItems(e.target.value)}
                className="h-8 max-w-xs text-xs"
              />
            </div>
            {(() => {
              const data = quotation.items || []
              const filtered = !searchItems ? data : data.filter((item: any) =>
                JSON.stringify(item).toLowerCase().includes(searchItems.toLowerCase())
              )
              return filtered.length === 0 ? (
                <EmptyState
                  icons={[<Package key="qi1" className="w-6 h-6" />, <FileText key="qi2" className="w-6 h-6" />]}
                  title="No items"
                  description="This quotation has no line items"
                  size="sm"
                />
              ) : (
                <div data-slot="frame">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {itemsColumns.map((col: any) => (
                          <TableHead key={col.key}>{col.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((item: any) => (
                        <TableRow key={item.id}>
                          {itemsColumns.map((col: any) => (
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

          <TabsContent value="order" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              Linked Order
            </div>
            {quotation.order ? (
              <div className="space-y-3 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Order:</span>
                  <button onClick={() => router.push(`/orders/${quotation.order.id}`)} className="text-sm font-medium text-info hover:underline">{quotation.order.number}</button>
                  <SemanticBadge semantic={quotation.order.status} category="status" className="">{quotation.order.status}</SemanticBadge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="text-sm font-mono font-semibold">{formatCurrency(quotation.order.total)}</span>
                </div>
              </div>
            ) : (
              <EmptyState
                icons={[<ShoppingCart key="oq1" className="w-6 h-6" />, <FileText key="oq2" className="w-6 h-6" />]}
                title="No linked order"
                description="This quotation has not been converted to an order yet"
                size="sm"
              />
            )}
          </TabsContent>

          <TabsContent value="activity" className="pt-8 px-3 pb-3">
            <div className="flex items-center mb-3">
              <Input
                placeholder="Search activity..."
                value={searchActivity}
                onChange={(e) => setSearchActivity(e.target.value)}
                className="h-8 max-w-xs text-xs"
              />
            </div>
            {(() => {
              const data = quotation.activities || []
              const filtered = !searchActivity ? data : data.filter((item: any) =>
                JSON.stringify(item).toLowerCase().includes(searchActivity.toLowerCase())
              )
              return filtered.length === 0 ? (
                <EmptyState
                  icons={[<Activity key="ac1" className="w-6 h-6" />, <Clock key="ac2" className="w-6 h-6" />]}
                  title="No activity"
                  description="No activity recorded for this quotation"
                  size="sm"
                />
              ) : (
                <div data-slot="frame">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {activityColumns.map((col: any) => (
                          <TableHead key={col.key}>{col.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((item: any) => (
                        <TableRow key={item.id}>
                          {activityColumns.map((col: any) => (
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
            <DialogTitle>Edit Quotation</DialogTitle>
            <DialogDescription>Update details for <span className="font-medium text-foreground">{quotation?.number}</span></DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <FileText className="w-4 h-4 text-primary" />
                  Basic Information
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Number" required><Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Valid Until"><Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} /></FieldGroup>
                </div>
                <FieldGroup label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Financials
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Subtotal"><Input type="number" step="0.01" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Discount"><Input type="number" step="0.01" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /></FieldGroup>
                </div>
                <FieldGroup label="Tax"><Input type="number" step="0.01" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} /></FieldGroup>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border/60">
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘↵</kbd></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quotation</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{quotation.number}</strong>? This action cannot be undone.</DialogDescription>
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
