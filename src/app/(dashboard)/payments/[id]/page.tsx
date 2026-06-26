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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, Clock, CreditCard, DollarSign, FileText, Hash, Landmark, Pencil, Receipt, ShoppingCart, Trash2, XCircle } from "lucide-react"
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

type Invoice = {
  id: string
  number: string
  total: number
  status: string
}

type Order = {
  id: string
  number: string
  total: number
  status: string
}

type Payment = {
  id: string
  amount: number
  date: string
  method: string
  reference: string
  notes: string
  invoice: Invoice | null
  order: Order | null
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

export default function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [id, setId] = useState("")
  const [activeTab, setActiveTab] = useState("info")
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editAmount, setEditAmount] = useState("")
  const [editMethod, setEditMethod] = useState("")
  const [editReference, setEditReference] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const router = useRouter()

  useEffect(() => { params.then(({ id }) => setId(id)) }, [params])
  useEffect(() => {
    if (!id) return
    fetch(`/api/payments/${id}`)
      .then(r => r.json())
      .then(r => { if (r?.success) setPayment(r.data); else setError(r?.error || "Failed to load") })
      .catch((err) => { setError(err.message || "Failed to load data") })
      .finally(() => setLoading(false))
  }, [id])

  function formatMethod(method: string) {
    const labels: Record<string, string> = {
      bank_transfer: "Bank Transfer",
      cash: "Cash",
      credit_card: "Credit Card",
      cheque: "Cheque",
      promptpay: "PromptPay",
    }
    return labels[method] || method
  }

  async function handleSave() {
    try {
      const res = await fetch(`/api/payments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(editAmount),
          method: editMethod,
          reference: editReference,
          date: editDate || undefined,
          notes: editNotes,
        }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setPayment(prev => prev ? { ...prev, ...updated } : prev)
      setShowEdit(false)
      toast.success("Payment updated")
    } catch {
      toast.error("Failed to update payment")
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/payments/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Payment deleted")
      router.push("/payments")
    } catch {
      toast.error("Failed to delete payment")
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

  if (loading) return <SkeletonDetail cards={5} hasChart={true} />

  if (!payment) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Payment not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The payment you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/payments")}>Back to Payments</Button>
      </div>
    )
  }

  const summaryCards = [
    { label: "Amount", value: formatCurrency(payment.amount), icon: DollarSign, color: "text-primary bg-primary/10" },
    { label: "Method", value: formatMethod(payment.method), icon: CreditCard, color: "text-primary bg-primary/10" },
    { label: "Date", value: formatDate(new Date(payment.date)), icon: Calendar, color: "text-primary bg-primary/10" },
    { label: "Reference", value: payment.reference || "—", icon: Hash, color: "text-primary bg-primary/10" },
    { label: "Notes", value: payment.notes || "—", icon: FileText, color: "text-primary bg-primary/10" },
  ]

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button onClick={() => router.push("/payments")}>
                <CreditCard className="size-4" />
                Payments
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{payment.reference || "Payment"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-12 gap-4">
        {/* Page Header — bento card */}
        <div className="col-span-12 border border-border/60 rounded-lg bg-card p-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex gap-3 min-w-0 flex-1">
              <Avatar className="size-14 rounded-lg shrink-0">
                <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent("payment-" + payment.method)}`} alt={payment.method} />
                <AvatarFallback className="rounded-lg text-lg bg-primary/10 text-primary">
                  {payment.method === "bank_transfer" ? "BT" : payment.method === "credit_card" ? "CC" : payment.method[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{payment.reference || "Payment"}</h1>
                  <SemanticBadge semantic={payment.method} category="method" className="gap-1 text-[11px]"><CreditCard className="w-3 h-3" />{payment.method.replace(/_/g, " ")}</SemanticBadge>
                  <SemanticBadge semantic={payment.reference || payment.id} category="id" className="gap-1 font-mono text-[11px]"><Hash className="w-3 h-3" />{payment.reference || payment.id}</SemanticBadge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="font-mono font-medium">{formatCurrency(payment.amount)}</span>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(new Date(payment.date))}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <MoreMenu actions={[
                  { label: "Edit", icon: <Pencil className="w-4 h-4" />, onClick: () => { setShowEdit(true); setEditAmount(String(payment.amount)); setEditMethod(payment.method); setEditReference(payment.reference || ""); setEditDate(payment.date.split("T")[0]); setEditNotes(payment.notes || "") } },
                  "separator",
                  { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDelete(true) },
                ]} />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="col-span-12 grid grid-cols-2 lg:grid-cols-5 gap-4">
          {summaryCards.map((card) => (
            <Card key={card.label} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                    <card.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">{card.label}</p>
                    <p className="text-sm font-semibold font-mono mt-0.5 truncate">{card.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Left Column (8 cols) — Primary Information */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          {/* Payment Details */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CreditCard className="w-4 h-4 text-primary" />
                Payment Details
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Amount" value={formatCurrency(payment.amount)} mono />
                <FieldDisplay label="Method" value={formatMethod(payment.method)} />
                <FieldDisplay label="Reference" value={payment.reference || "—"} mono />
                <FieldDisplay label="Date" value={formatDate(new Date(payment.date))} />
                {payment.notes && <div className="col-span-2"><FieldDisplay label="Notes" value={payment.notes} /></div>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols) — Contextual / Meta */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Metadata */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="w-4 h-4 text-primary" />
                Metadata
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <FieldDisplay label="Date" value={formatDate(new Date(payment.date))} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unified Tab Module */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden pt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full overflow-x-auto px-4">
            <TabsTrigger value="info" className="gap-1.5"><CreditCard className="w-4 h-4" /> Info</TabsTrigger>
            <TabsTrigger value="invoice" className="gap-1.5"><Receipt className="w-4 h-4" /> Linked Invoice</TabsTrigger>
            <TabsTrigger value="order" className="gap-1.5"><ShoppingCart className="w-4 h-4" /> Linked Order</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="pt-8 px-3 pb-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Amount</p>
                  <p className="text-sm font-medium font-mono">{formatCurrency(payment.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Method</p>
                  <p className="text-sm font-medium capitalize">{payment.method.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Reference</p>
                  <p className="text-sm font-medium font-mono">{payment.reference || "—"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Date</p>
                  <p className="text-sm font-medium">{formatDate(new Date(payment.date))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{payment.notes || "—"}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="invoice" className="pt-8 px-3 pb-3">
            {payment.invoice ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Invoice #</p>
                    <p className="text-sm font-medium font-mono">{payment.invoice.number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <SemanticBadge semantic={payment.invoice.status} category="status" className="">{payment.invoice.status}</SemanticBadge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total</p>
                    <p className="text-sm font-medium font-mono">{formatCurrency(payment.invoice.total)}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => router.push(`/invoices/${payment.invoice!.id}`)}>
                  View Invoice
                </Button>
              </div>
            ) : (
              <EmptyState
                icons={[<Receipt key="pi1" className="w-6 h-6" />, <FileText key="pi2" className="w-6 h-6" />, <DollarSign key="pi3" className="w-6 h-6" />]}
                title="No linked invoice"
                description="This payment is not linked to any invoice"
                size="sm"
              />
            )}
          </TabsContent>

          <TabsContent value="order" className="pt-8 px-3 pb-3">
            {payment.order ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Order #</p>
                    <p className="text-sm font-medium font-mono">{payment.order.number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <SemanticBadge semantic={payment.order.status} category="status" className="">{payment.order.status}</SemanticBadge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total</p>
                    <p className="text-sm font-medium font-mono">{formatCurrency(payment.order.total)}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => router.push(`/orders/${payment.order!.id}`)}>
                  View Order
                </Button>
              </div>
            ) : (
              <EmptyState
                icons={[<ShoppingCart key="po1" className="w-6 h-6" />, <FileText key="po2" className="w-6 h-6" />, <DollarSign key="po3" className="w-6 h-6" />]}
                title="No linked order"
                description="This payment is not linked to any order"
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
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>Update details for <span className="font-medium text-foreground">{payment?.reference || "Payment"}</span></DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Payment Details
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Amount"><Input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} /></FieldGroup>
                  <FieldGroup label="Method">
                    <Select
                      value={editMethod}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditMethod(e.target.value)}
                      options={[
                        { value: "bank_transfer", label: "Bank Transfer" },
                        { value: "cash", label: "Cash" },
                        { value: "credit_card", label: "Credit Card" },
                        { value: "cheque", label: "Cheque" },
                        { value: "promptpay", label: "PromptPay" },
                      ]}
                    />
                  </FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Reference"><Input value={editReference} onChange={(e) => setEditReference(e.target.value)} /></FieldGroup>
                  <FieldGroup label="Date"><Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} /></FieldGroup>
                </div>
                <FieldGroup label="Notes"><Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} /></FieldGroup>
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
            <DialogTitle>Delete Payment</DialogTitle>
            <DialogDescription>Are you sure you want to delete this payment? This action cannot be undone.</DialogDescription>
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
