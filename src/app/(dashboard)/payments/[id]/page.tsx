"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, CreditCard, DollarSign, Edit, FileText, Hash, Landmark, Receipt, ShoppingCart, Trash2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import { SkeletonDetail } from "@/components/ui/skeleton"

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

const invoiceStatusColors: Record<string, "default" | "secondary" | "success" | "destructive" | "warning" | "outline"> = {
 draft: "secondary",
 sent: "default",
 paid: "success",
 overdue: "destructive",
 cancelled: "warning",
}

const orderStatusColors: Record<string, "default" | "secondary" | "success" | "destructive" | "warning" | "outline"> = {
 draft: "secondary",
 confirmed: "default",
 processing: "warning",
 shipped: "default",
 delivered: "success",
 cancelled: "destructive",
}

export default function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const [payment, setPayment] = useState<Payment | null>(null)
 const [loading, setLoading] = useState(true)
 const [id, setId] = useState("")
 const [activeTab, setActiveTab] = useState("info")
 const [editing, setEditing] = useState(false)
 const [editAmount, setEditAmount] = useState("")
 const [editMethod, setEditMethod] = useState("")
 const [editReference, setEditReference] = useState("")
 const [editDate, setEditDate] = useState("")
 const [editNotes, setEditNotes] = useState("")
 const [deleteOpen, setDeleteOpen] = useState(false)
 const [deleting, setDeleting] = useState(false)
 const router = useRouter()

 useEffect(() => { params.then(({ id }) => setId(id)) }, [params])
 useEffect(() => {
 if (!id) return
 fetch(`/api/payments/${id}`)
 .then(r => r.json())
 .then(setPayment)
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
 setEditing(false)
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

 if (loading) return <SkeletonDetail cards={5} hasChart={true} />

 if (!payment) return <p>Payment not found</p>

 const summaryCards = [
 { label: "Amount", value: formatCurrency(payment.amount), icon: DollarSign, color: "text-emerald-600 bg-emerald-100" },
 { label: "Method", value: formatMethod(payment.method), icon: CreditCard, color: "text-blue-600 bg-blue-100" },
 { label: "Date", value: formatDate(new Date(payment.date)), icon: Calendar, color: "text-violet-600 bg-violet-100" },
 { label: "Reference", value: payment.reference || "—", icon: Hash, color: "text-amber-600 bg-amber-100" },
 { label: "Notes", value: payment.notes || "—", icon: FileText, color: "text-rose-600 bg-rose-100" },
 ]

 return (
 <div className="animate-fade-in space-y-6">
 <button
 onClick={() => router.push("/payments")}
 className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
 >
 Back to Payments
 </button>

 <div className="flex items-start justify-between">
 <div className="flex items-start gap-4">
 <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
 </div>
 <div>
 <div className="flex items-center gap-3 mb-1">
 {editing ? (
 <Input value={editReference} onChange={(e) => setEditReference(e.target.value)} className="text-2xl font-semibold h-auto py-1 w-64" />
 ) : (
 <h1 className="text-2xl font-semibold">{payment.reference || "Payment"}</h1>
 )}
 <Badge variant="outline" className="text-xs capitalize">
 {payment.method.replace(/_/g, " ")}
 </Badge>
 </div>
 <p className="text-sm text-muted-foreground">
 {formatCurrency(payment.amount)} &middot; {formatDate(new Date(payment.date))}
 </p>
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
 <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => { setEditing(true); setEditAmount(String(payment.amount)); setEditMethod(payment.method); setEditReference(payment.reference || ""); setEditDate(payment.date.split("T")[0]); setEditNotes(payment.notes || "") }}>
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
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <p className="text-xs text-muted-foreground">Amount</p>
 <Input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
 </div>
 <div className="space-y-2">
 <p className="text-xs text-muted-foreground">Method</p>
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
 </div>
 <div className="space-y-2">
 <p className="text-xs text-muted-foreground">Reference</p>
 <Input value={editReference} onChange={(e) => setEditReference(e.target.value)} />
 </div>
 <div className="space-y-2">
 <p className="text-xs text-muted-foreground">Date</p>
 <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
 </div>
 </div>
 <div className="space-y-2">
 <p className="text-xs text-muted-foreground">Notes</p>
 <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} />
 </div>
 </CardContent>
 </Card>
 )}

 <Card>
 <CardContent className="p-0">
 <Tabs value={activeTab} onValueChange={setActiveTab}>
 <div className="px-5 pt-4 pb-0 border-b border-border">
 <TabsList>
  <TabsTrigger value="info" className="gap-1.5">
   <CreditCard className="w-4 h-4" />
   Info
  </TabsTrigger>
 <TabsTrigger value="invoice" className="gap-1.5">
 <Receipt className="w-4 h-4" />
 Linked Invoice
 </TabsTrigger>
  <TabsTrigger value="order" className="gap-1.5">
   <ShoppingCart className="w-4 h-4" />
   Linked Order
  </TabsTrigger>
 </TabsList>
 </div>

 <TabsContent value="info" className="p-5 m-0">
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

 <TabsContent value="invoice" className="p-5 m-0">
 {payment.invoice ? (
 <div className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <p className="text-xs text-muted-foreground mb-1">Invoice #</p>
 <p className="text-sm font-medium font-mono">{payment.invoice.number}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1">Status</p>
 <Badge variant={invoiceStatusColors[payment.invoice.status] || "default"} className="capitalize">
 {payment.invoice.status}
 </Badge>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1">Total</p>
 <p className="text-sm font-medium font-mono">{formatCurrency(payment.invoice.total)}</p>
 </div>
 </div>
 <Button size="sm" variant="secondary" onClick={() => router.push(`/invoices/${payment.invoice!.id}`)}>
 View Invoice
 </Button>
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
 <Receipt className="w-8 h-8 mb-2" />
 <p className="text-sm">No linked invoice</p>
 </div>
 )}
 </TabsContent>

 <TabsContent value="order" className="p-5 m-0">
 {payment.order ? (
 <div className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <p className="text-xs text-muted-foreground mb-1">Order #</p>
 <p className="text-sm font-medium font-mono">{payment.order.number}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1">Status</p>
 <Badge variant={orderStatusColors[payment.order.status] || "default"} className="capitalize">
 {payment.order.status}
 </Badge>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1">Total</p>
 <p className="text-sm font-medium font-mono">{formatCurrency(payment.order.total)}</p>
 </div>
 </div>
 <Button size="sm" variant="secondary" onClick={() => router.push(`/orders/${payment.order!.id}`)}>
 View Order
 </Button>
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
 <p className="text-sm">No linked order</p>
 </div>
 )}
 </TabsContent>
 </Tabs>
 </CardContent>
 </Card>

 <ConfirmDialog
 open={deleteOpen}
 onOpenChange={setDeleteOpen}
 title="Delete Payment"
 description="Are you sure you want to delete this payment? This action cannot be undone."
 onConfirm={handleDelete}
 loading={deleting}
 />
 </div>
 )
}
