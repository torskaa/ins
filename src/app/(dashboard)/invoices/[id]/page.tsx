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
import { AlertTriangle, Banknote, Clock, DollarSign, FileText, Hash, Mail, Package, Pencil, Trash2, XCircle } from "lucide-react"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { toast } from "sonner"
import { SkeletonDetail } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { MoreMenu } from "@/components/ui/more-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"

const statusConfig: Record<string, { label: string; icon: any }> = {
  draft: { label: "Draft", icon: FileText },
  sent: { label: "Sent", icon: Mail },
  paid: { label: "Paid", icon: DollarSign },
  overdue: { label: "Overdue", icon: AlertTriangle },
  cancelled: { label: "Cancelled", icon: XCircle },
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

function daysOverdue(dueDate: string): number {
  const diff = Date.now() - new Date(dueDate).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [tab, setTab] = useState("items")
  const [form, setForm] = useState<any>({})
  const [transitioning, setTransitioning] = useState("")
  const [id, setId] = useState<string>("")

  useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  useEffect(() => {
    if (!id) return
    fetch(`/api/invoices/${id}`)
      .then((r) => {
        if (r.status === 404) return null
        if (!r.ok) throw new Error("Failed to load")
        return r.json()
      })
      .then((json) => {
        if (json?.success && json.data) {
          const data = json.data
          setInvoice(data)
          setForm({
            number: data.number,
            issueDate: data.issueDate?.split("T")[0] || "",
            dueDate: data.dueDate?.split("T")[0] || "",
            subtotal: String(data.subtotal || 0),
            tax: String(data.tax || 0),
            discount: String(data.discount || 0),
            status: data.status,
          })
        } else if (!json?.success) throw new Error(json?.error || "Failed to load")
      })
      .catch((err) => { setError(err.message); setLoading(false) })
      .finally(() => setLoading(false))
  }, [id])

  async function handleStatusAction(action: string) {
    setTransitioning(action)
    try {
      const body: any = { action }
      if (action === "paid") body.amount = invoice?.total
      const res = await fetch(`/api/invoices/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      const updated = await fetch(`/api/invoices/${id}`).then(r => r.json())
      if (updated && !updated.error) setInvoice(updated)
    } catch (err: any) { toast.error(err.message) }
    finally { setTransitioning("") }
  }

  async function handleSave() {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          subtotal: parseFloat(form.subtotal) || 0,
          tax: parseFloat(form.tax) || 0,
          discount: parseFloat(form.discount) || 0,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      const updated = await res.json()
      setInvoice(updated)
      setShowEdit(false)
      toast.success("Invoice updated")
    } catch {
      toast.error("Failed to update invoice")
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      toast.success("Invoice deleted")
      router.push("/invoices")
      router.refresh()
    } catch {
      toast.error("Failed to delete invoice")
      setDeleting(false)
    }
  }

  if (error) return (
    <div className="animate-fade-in pb-8 space-y-4">
      <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
    </div>
  )

  if (loading) return <SkeletonDetail cards={3} hasChart={true} />

  if (!invoice) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Invoice not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The invoice you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/invoices")}>Back to Invoices</Button>
      </div>
    )
  }

  const { status } = invoice
  const StatusIcon = statusConfig[status]?.icon || FileText
  const overdue = status === "overdue" ? daysOverdue(invoice.dueDate) : 0
  const balanceDue = invoice.total - invoice.paidAmount

  const itemColumns = [
    { key: "product", label: "Product", render: (item: any) => (
      <div>
        <p className="font-medium text-sm">{item.product?.name}</p>
        <p className="text-xs text-muted-foreground">{item.product?.sku}</p>
      </div>
    )},
    { key: "description", label: "Description", render: (item: any) => <span className="text-sm text-muted-foreground">{item.description || "—"}</span> },
    { key: "quantity", label: "Qty", render: (item: any) => <span className="font-mono text-sm">{item.quantity}</span> },
    { key: "unitPrice", label: "Unit Price", render: (item: any) => <span className="font-mono text-sm">{formatCurrency(item.unitPrice)}</span> },
    { key: "total", label: "Total", render: (item: any) => <span className="font-mono text-sm font-medium">{formatCurrency(item.total)}</span> },
  ]

  const paymentColumns = [
    { key: "date", label: "Date", render: (item: any) => <span className="text-sm">{formatDate(new Date(item.date))}</span> },
    { key: "amount", label: "Amount", render: (item: any) => <span className="font-mono text-sm font-medium">{formatCurrency(item.amount)}</span> },
    { key: "method", label: "Method", render: (item: any) => <SemanticBadge semantic={item.method} category="method" className="" /> },
    { key: "reference", label: "Reference", render: (item: any) => <span className="font-mono text-xs text-muted-foreground">{item.reference || "—"}</span> },
  ]

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button onClick={() => router.push("/invoices")}>
                <FileText className="size-4" />
                Invoices
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{invoice.number}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 border border-border/60 rounded-lg bg-card p-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{invoice.number}</h1>
                <SemanticBadge semantic={status} category="status" className="gap-1 text-[11px]">
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig[status]?.label || status}
                  {overdue > 0 && ` (${overdue}d)`}
                </SemanticBadge>
                <SemanticBadge semantic={invoice.number} category="id" className="gap-1 font-mono text-[11px]"><Hash className="w-3 h-3" />{invoice.number}</SemanticBadge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{invoice.customer?.name}</span>
                <span className="text-muted-foreground/30">·</span>
                <span>Due {formatDate(new Date(invoice.dueDate))}</span>
                <span className="text-muted-foreground/30">·</span>
                <span>Issued {formatDate(new Date(invoice.issueDate))}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {status === "draft" && (
                  <Button size="sm" onClick={() => handleStatusAction("sent")} loading={transitioning === "sent"} className="gap-1.5 h-8 text-xs">
                    Send
                  </Button>
                )}
                {(status === "sent" || status === "overdue") && (
                  <Button variant="success" size="sm" onClick={() => handleStatusAction("paid")} loading={transitioning === "paid"} className="gap-1.5 h-8 text-xs">
                    Mark Paid
                  </Button>
                )}
                <MoreMenu actions={[
                  ...(["draft", "sent", "overdue"].includes(status) ? [{ label: "Edit", icon: <Pencil className="w-4 h-4" />, onClick: () => setShowEdit(true) }] : []),
                  ...(["draft", "sent", "overdue"].includes(status) ? ["separator" as const] : []),
                  ...(["draft", "sent", "overdue"].includes(status) ? [{ label: "Cancel", icon: <XCircle className="w-4 h-4" />, onClick: () => handleStatusAction("cancelled") }] : []),
                  "separator" as const,
                  { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDelete(true) },
                ]} />
              </div>
              {invoice.updatedAt && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Updated {formatDate(new Date(invoice.updatedAt))}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-semibold tracking-tight">{formatCurrency(invoice.total)}</p>
                </div>
                <div className="rounded-lg p-2.5 bg-primary/10 text-primary">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Paid Amount</p>
                  <p className="text-xl font-semibold tracking-tight">{formatCurrency(invoice.paidAmount)}</p>
                </div>
                <div className={`rounded-lg p-2.5 ${invoice.paidAmount >= invoice.total ? "bg-success/15 text-success" : "bg-primary/10 text-primary"}`}>
                  <Banknote className="w-4 h-4" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Balance Due</p>
                  <p className="text-xl font-semibold tracking-tight">{formatCurrency(balanceDue)}</p>
                  {balanceDue > 0 && overdue > 0 && <p className="text-xs text-muted-foreground">{overdue} day{overdue > 1 ? "s" : ""} overdue</p>}
                </div>
                <div className={`rounded-lg p-2.5 ${balanceDue > 0 ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}>
                  {balanceDue > 0 ? <AlertTriangle className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="w-4 h-4 text-primary" />
                Invoice Details
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Customer" value={invoice.customer?.name || "—"} />
                <FieldDisplay label="Issue Date" value={formatDate(new Date(invoice.issueDate))} />
                <FieldDisplay label="Due Date" value={formatDate(new Date(invoice.dueDate))} />
                <FieldDisplay label="Status" value={statusConfig[status]?.label || status} />
                <FieldDisplay label="Subtotal" value={formatCurrency(invoice.subtotal)} mono />
                {invoice.discount > 0 && <FieldDisplay label="Discount" value={`-${formatCurrency(invoice.discount)}`} mono />}
                <FieldDisplay label="Tax" value={formatCurrency(invoice.tax)} mono />
                <FieldDisplay label="Total" value={formatCurrency(invoice.total)} mono />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Banknote className="w-4 h-4 text-primary" />
                Payment Summary
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-semibold font-mono">{formatCurrency(invoice.paidAmount)}</span>
                  <span className="text-xs text-muted-foreground">paid of {formatCurrency(invoice.total)}</span>
                </div>
                <Progress
                  className="h-1.5"
                  indicatorClassName={balanceDue === 0 ? "bg-success" : "bg-primary"}
                  value={invoice.total > 0 ? (invoice.paidAmount / invoice.total) * 100 : 0}
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Paid: {formatCurrency(invoice.paidAmount)}</span>
                  <span>Due: {formatCurrency(balanceDue)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Package className="w-4 h-4 text-primary" />
                Customer
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="space-y-2.5">
                <FieldDisplay label="Name" value={invoice.customer?.name || "—"} />
                <FieldDisplay label="Email" value={invoice.customer?.email || "—"} />
                <FieldDisplay label="Phone" value={invoice.customer?.phone || "—"} />
                <FieldDisplay label="Address" value={invoice.customer?.address || "—"} />
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
                <FieldDisplay label="Created" value={invoice.createdAt ? formatDate(new Date(invoice.createdAt)) : "—"} />
                <FieldDisplay label="Updated" value={invoice.updatedAt ? formatDate(new Date(invoice.updatedAt)) : "—"} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden pt-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full overflow-x-auto px-4">
            <TabsTrigger value="items" className="gap-1.5"><Package className="w-4 h-4" /> Items ({invoice.items?.length || 0})</TabsTrigger>
            <TabsTrigger value="payments" className="gap-1.5"><Banknote className="w-4 h-4" /> Payments ({invoice.payments?.length || 0})</TabsTrigger>
            {invoice.order && <TabsTrigger value="order" className="gap-1.5"><FileText className="w-4 h-4" /> Order</TabsTrigger>}
            <TabsTrigger value="activity" className="gap-1.5"><Clock className="w-4 h-4" /> Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Package className="w-4 h-4 text-primary" />
              Invoice Items
            </div>
            {(!invoice.items || invoice.items.length === 0) ? (
              <EmptyState
                icons={[<Package key="ii1" className="w-6 h-6" />, <FileText key="ii2" className="w-6 h-6" />]}
                title="No items"
                description="This invoice has no line items"
                size="sm"
              />
            ) : (
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {itemColumns.map((col) => (
                        <TableHead key={col.key}>{col.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item: any) => (
                      <TableRow key={item.id}>
                        {itemColumns.map((col) => (
                          <TableCell key={col.key}>
                            {col.render ? col.render(item) : String(item[col.key] ?? "")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="border-t border-border px-5 py-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-mono text-destructive">-{formatCurrency(invoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-mono">{formatCurrency(invoice.tax)}</span>
                  </div>
                  <div className="border-t border-border/60" />
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total</span>
                    <span className="font-mono">{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="payments" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Banknote className="w-4 h-4 text-primary" />
              Payment History
            </div>
            {(!invoice.payments || invoice.payments.length === 0) ? (
              <EmptyState
                icons={[<Banknote key="ph1" className="w-6 h-6" />, <DollarSign key="ph2" className="w-6 h-6" />]}
                title="No payments recorded"
                description="Payments will appear here once recorded"
                size="sm"
              />
            ) : (
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {paymentColumns.map((col) => (
                        <TableHead key={col.key}>{col.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.payments.map((item: any) => (
                      <TableRow key={item.id}>
                        {paymentColumns.map((col) => (
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

          {invoice.order && (
            <TabsContent value="order" className="pt-8 px-3 pb-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-medium">Linked Order</h3>
                  <p className="text-xs text-muted-foreground">Order #{invoice.order.number}</p>
                </div>
                <SemanticBadge semantic={invoice.order.status} category="status" className="" />
              </div>
              {(!invoice.order.items || invoice.order.items.length === 0) ? (
                <EmptyState
                  icons={[<FileText key="oi1" className="w-6 h-6" />, <Package key="oi2" className="w-6 h-6" />]}
                  title="No items"
                  description="This order has no items"
                  size="sm"
                />
              ) : (
                <div data-slot="frame">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {[
                          { key: "product", label: "Product" },
                          { key: "quantity", label: "Qty" },
                          { key: "unitPrice", label: "Unit Price" },
                          { key: "total", label: "Total" },
                        ].map((col) => (
                          <TableHead key={col.key}>{col.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.order.items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{item.product?.name}</p>
                              <p className="text-xs text-muted-foreground">{item.product?.sku}</p>
                            </div>
                          </TableCell>
                          <TableCell><span className="font-mono text-sm">{item.quantity}</span></TableCell>
                          <TableCell><span className="font-mono text-sm">{formatCurrency(item.unitPrice)}</span></TableCell>
                          <TableCell><span className="font-mono text-sm font-medium">{formatCurrency(item.total)}</span></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="activity" className="pt-8 px-3 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Clock className="w-4 h-4 text-primary" />
              Activity Log
            </div>
            {(!invoice.activities || invoice.activities.length === 0) ? (
              <EmptyState
                icons={[<Clock key="al1" className="w-6 h-6" />, <FileText key="al2" className="w-6 h-6" />]}
                title="No activity yet"
                description="Changes to this invoice will appear here"
                size="sm"
              />
            ) : (
              <div className="space-y-0 p-2">
                {invoice.activities.map((activity: any, i: number) => (
                  <div key={activity.id} className="flex gap-4 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-border mt-2 ring-4 ring-background" />
                      {i < invoice.activities.length - 1 && <div className="w-px flex-1 bg-border/50 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-muted-foreground">{activity.user}</span>
                        <span className="text-[11px] text-muted-foreground">·</span>
                        <span className="text-[11px] text-muted-foreground">{formatDate(new Date(activity.timestamp))}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-2xl flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>Update details for <span className="font-medium text-foreground">{invoice?.number}</span></DialogDescription>
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
                  <FieldGroup label="Invoice Number"><Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Status">
                    <Select options={[
                      { value: "draft", label: "Draft" },
                      { value: "sent", label: "Sent" },
                      { value: "paid", label: "Paid" },
                      { value: "overdue", label: "Overdue" },
                      { value: "cancelled", label: "Cancelled" },
                    ]} value={form.status} onChange={(e: any) => setForm({ ...form, status: e.target.value })} />
                  </FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Issue Date"><Input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Due Date"><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></FieldGroup>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Financial Details
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <FieldGroup label="Subtotal"><Input type="number" step="0.01" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Tax"><Input type="number" step="0.01" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Discount"><Input type="number" step="0.01" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /></FieldGroup>
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
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{invoice.number}</strong>? This action cannot be undone.</DialogDescription>
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
