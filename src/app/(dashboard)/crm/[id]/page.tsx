"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DataTable, type Column } from "@/components/ui/data-table"
import { ArrowLeft, Mail, Phone, Building2, Edit, Trash2, ShoppingCart, FileText, FileSignature, DollarSign, Receipt, CreditCard, Hash, FileCode, Calendar, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import { SkeletonDetail } from "@/components/ui/skeleton"

type FinancialSummary = {
 totalOrders: number
 totalOrderValue: number
 totalInvoiced: number
 totalPaid: number
 totalDue: number
 creditRemaining: number
}

type Order = {
 id: string
 number: string
 type: string
 status: string
 total: number
 orderDate: string
}

type Quotation = {
 id: string
 number: string
 status: string
 total: number
 validUntil: string
 createdAt: string
}

type Invoice = {
 id: string
 number: string
 status: string
 total: number
 paidAmount: number
 dueDate: string
 issueDate: string
}

type Payment = {
 id: string
 amount: number
 date: string
 method: string
 reference: string
 invoice?: { number: string; id: string }
 order?: { number: string; id: string }
}

type Customer = {
 id: string
 name: string
 email: string
 phone: string
 company: string
 taxId: string
 creditLimit: number
 notes: string
 createdAt: string
 orders: Order[]
 quotations: Quotation[]
 invoices: Invoice[]
 payments: Payment[]
 financialSummary: FinancialSummary
}

const orderStatusColors: Record<string, "default" | "secondary" | "success" | "destructive" | "warning" | "outline"> = {
 draft: "secondary",
 confirmed: "default",
 processing: "warning",
 shipped: "default",
 delivered: "success",
 cancelled: "destructive",
}

const quotationStatusColors: Record<string, "default" | "secondary" | "success" | "destructive" | "warning" | "outline"> = {
 draft: "secondary",
 sent: "default",
 accepted: "success",
 rejected: "destructive",
 expired: "warning",
 converted: "outline",
}

const invoiceStatusColors: Record<string, "default" | "secondary" | "success" | "destructive" | "warning" | "outline"> = {
 draft: "secondary",
 sent: "default",
 paid: "success",
 overdue: "destructive",
 cancelled: "warning",
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const [customer, setCustomer] = useState<Customer | null>(null)
 const [loading, setLoading] = useState(true)
 const [id, setId] = useState("")
 const [activeTab, setActiveTab] = useState("info")
 const [deleting, setDeleting] = useState(false)
 const router = useRouter()

 useEffect(() => { params.then(({ id }) => setId(id)) }, [params])
 useEffect(() => {
 if (!id) return
 fetch(`/api/customers/${id}`)
 .then(r => r.json())
 .then(setCustomer)
 .finally(() => setLoading(false))
 }, [id])

 async function handleDelete() {
 if (!confirm("Are you sure you want to delete this customer?")) return
 setDeleting(true)
 try {
 const res = await fetch(`/api/customers/${id}`, { method: "DELETE" })
 if (!res.ok) throw new Error()
 toast.success("Customer deleted")
 router.push("/crm")
 } catch { toast.error("Failed to delete") }
 finally { setDeleting(false) }
 }

 if (loading) return <SkeletonDetail cards={6} hasChart={true} />

 if (!customer) return <p>Customer not found</p>

 const { orders, quotations, invoices, payments, financialSummary: fs } = customer

 const summaryCards = [
 { label: "Total Orders", value: fs.totalOrders, icon: ShoppingCart, color: "text-blue-600 bg-blue-100" },
 { label: "Total Value", value: formatCurrency(fs.totalOrderValue), icon: DollarSign, color: "text-emerald-600 bg-emerald-100" },
 { label: "Total Invoiced", value: formatCurrency(fs.totalInvoiced), icon: Receipt, color: "text-violet-600 bg-violet-100" },
 { label: "Total Paid", value: formatCurrency(fs.totalPaid), icon: CreditCard, color: "text-green-600 bg-green-100" },
 { label: "Total Due", value: formatCurrency(fs.totalDue), icon: FileText, color: "text-rose-600 bg-rose-100" },
 { label: "Credit Remaining", value: formatCurrency(fs.creditRemaining), icon: CreditCard, color: "text-amber-600 bg-amber-100" },
 ]

 const orderColumns: Column<Order>[] = [
 { key: "number", label: "Order #", render: (item) => <span className="font-mono text-xs font-medium">{item.number}</span> },
 { key: "type", label: "Type", render: (item) => (
 <Badge variant="outline" className="capitalize">
 {item.type === "sales" ? "Sales" : "Purchase"}
 </Badge>
 )},
 { key: "status", label: "Status", render: (item) => (
 <Badge variant={orderStatusColors[item.status] || "default"} className="capitalize">
 {item.status}
 </Badge>
 )},
 { key: "total", label: "Total", render: (item) => <span className="font-mono text-sm font-medium">{formatCurrency(item.total)}</span> },
 { key: "orderDate", label: "Date", render: (item) => <span className="text-sm text-muted-foreground">{formatDate(new Date(item.orderDate))}</span> },
 ]

 const quotationColumns: Column<Quotation>[] = [
 { key: "number", label: "Quotation #", render: (item) => <span className="font-mono text-xs font-medium">{item.number}</span> },
 { key: "status", label: "Status", render: (item) => (
 <Badge variant={quotationStatusColors[item.status] || "default"} className="capitalize">
 {item.status}
 </Badge>
 )},
 { key: "total", label: "Total", render: (item) => <span className="font-mono text-sm font-medium">{formatCurrency(item.total)}</span> },
 { key: "validUntil", label: "Valid Until", render: (item) => <span className="text-sm text-muted-foreground">{formatDate(new Date(item.validUntil))}</span> },
 { key: "createdAt", label: "Date", render: (item) => <span className="text-sm text-muted-foreground">{formatDate(new Date(item.createdAt))}</span> },
 ]

 const invoiceColumns: Column<Invoice>[] = [
 { key: "number", label: "Invoice #", render: (item) => <span className="font-mono text-xs font-medium">{item.number}</span> },
 { key: "status", label: "Status", render: (item) => (
 <Badge variant={invoiceStatusColors[item.status] || "default"} className="capitalize">
 {item.status}
 </Badge>
 )},
 { key: "total", label: "Total", render: (item) => <span className="font-mono text-sm font-medium">{formatCurrency(item.total)}</span> },
 { key: "paidAmount", label: "Paid", render: (item) => <span className="font-mono text-sm text-muted-foreground">{formatCurrency(item.paidAmount)}</span> },
 { key: "issueDate", label: "Issue Date", render: (item) => <span className="text-sm text-muted-foreground">{formatDate(new Date(item.issueDate))}</span> },
 { key: "dueDate", label: "Due Date", render: (item) => <span className="text-sm text-muted-foreground">{formatDate(new Date(item.dueDate))}</span> },
 ]

 const paymentColumns: Column<Payment>[] = [
 { key: "date", label: "Date", render: (item) => <span className="text-sm text-muted-foreground">{formatDateTime(new Date(item.date))}</span> },
 { key: "amount", label: "Amount", render: (item) => <span className="font-mono text-sm font-medium">{formatCurrency(item.amount)}</span> },
 { key: "method", label: "Method", render: (item) => {
 const labels: Record<string, string> = {
 bank_transfer: "Bank Transfer",
 cash: "Cash",
 credit_card: "Credit Card",
 cheque: "Cheque",
 promptpay: "PromptPay",
 }
 return <span className="text-sm capitalize">{labels[item.method] || item.method}</span>
 }},
 { key: "reference", label: "Reference", render: (item) => <span className="text-sm text-muted-foreground font-mono">{item.reference || "—"}</span> },
 { key: "linked", label: "Linked To", render: (item) => {
 const inv = item.invoice
 const ord = item.order
 return (
 <span className="text-sm text-muted-foreground">
 {inv ? `INV ${inv.number}` : ord ? `ORD ${ord.number}` : "—"}
 </span>
 )
 }},
 ]

 return (
 <div className="animate-fade-in space-y-6">
 <button
 onClick={() => router.push("/crm")}
 className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
 >
 Back to CRM
 </button>

 <div className="flex items-start justify-between">
 <div className="flex items-start gap-4">
 <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
 <Building2 className="w-7 h-7 text-primary-dark" />
 </div>
 <div>
 <div className="flex items-center gap-3 mb-1">
 <h1 className="text-2xl font-semibold">{customer.name}</h1>
 <Badge variant="destructive" className="text-xs gap-1">
 <AlertCircle className="w-3 h-3" />
 Due {formatCurrency(fs.totalDue)}
 </Badge>
 </div>
 <div className="flex items-center gap-4 text-sm text-muted-foreground">
 {customer.company && (
 <span className="flex items-center gap-1.5">
 <Building2 className="w-3.5 h-3.5" />
 {customer.company}
 </span>
 )}
 {customer.email && (
 <span className="flex items-center gap-1.5">
 <Mail className="w-3.5 h-3.5" />
 {customer.email}
 </span>
 )}
 {customer.phone && (
 <span className="flex items-center gap-1.5">
 {customer.phone}
 </span>
 )}
 </div>
 <p className="text-xs text-muted-foreground mt-1">
 Credit Limit: {formatCurrency(customer.creditLimit)}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => router.push(`/crm/${id}/edit`)}>
 Edit
 </Button>
 <Button variant="secondary" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={handleDelete} loading={deleting}>Delete</Button>
 <Button size="sm" className="gap-1.5" onClick={() => router.push(`/orders/new?customerId=${customer.id}`)}>
 New Order
 </Button>
 </div>
 </div>

 <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
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
 <p className="text-sm font-semibold font-mono mt-0.5">{card.value}</p>
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>

 <Tabs value={activeTab} onValueChange={setActiveTab}>
 <div className="px-5 pt-4 pb-0 border-b border-border">
 <TabsList>
 <TabsTrigger value="info" className="gap-1.5">
 <Building2 className="w-4 h-4" />
 Info
 </TabsTrigger>
 <TabsTrigger value="orders" className="gap-1.5">
 Orders
 {orders.length > 0 && (
 <span className="ml-1 text-[11px] text-muted-foreground">({orders.length})</span>
 )}
 </TabsTrigger>
 <TabsTrigger value="quotations" className="gap-1.5">
 <FileSignature className="w-4 h-4" />
 Quotations
 {quotations.length > 0 && (
 <span className="ml-1 text-[11px] text-muted-foreground">({quotations.length})</span>
 )}
 </TabsTrigger>
 <TabsTrigger value="invoices" className="gap-1.5">
 <Receipt className="w-4 h-4" />
 Invoices
 {invoices.length > 0 && (
 <span className="ml-1 text-[11px] text-muted-foreground">({invoices.length})</span>
 )}
 </TabsTrigger>
 <TabsTrigger value="payments" className="gap-1.5">
 Payments
 {payments.length > 0 && (
 <span className="ml-1 text-[11px] text-muted-foreground">({payments.length})</span>
 )}
 </TabsTrigger>
 </TabsList>
 </div>

 <TabsContent value="info" className="p-5 m-0">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="space-y-4">
 <div>
 <p className="text-xs text-muted-foreground mb-1">Email</p>
 <p className="text-sm font-medium flex items-center gap-1.5">
 <Mail className="w-3.5 h-3.5 text-muted-foreground" />
 {customer.email || "—"}
 </p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1">Phone</p>
 <p className="text-sm font-medium flex items-center gap-1.5">
 {customer.phone || "—"}
 </p>
 </div>
 </div>
 <div className="space-y-4">
 <div>
 <p className="text-xs text-muted-foreground mb-1">Company</p>
 <p className="text-sm font-medium flex items-center gap-1.5">
 <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
 {customer.company || "—"}
 </p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1">Tax ID</p>
 <p className="text-sm font-medium flex items-center gap-1.5">
 {customer.taxId || "—"}
 </p>
 </div>
 </div>
 <div className="space-y-4">
 <div>
 <p className="text-xs text-muted-foreground mb-1">Credit Limit</p>
 <p className="text-sm font-medium font-mono">{formatCurrency(customer.creditLimit)}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground mb-1">Customer Since</p>
 <p className="text-sm font-medium flex items-center gap-1.5">
 <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
 {formatDate(new Date(customer.createdAt))}
 </p>
 </div>
 </div>
 </div>
 {customer.notes && (
 <div className="mt-6 pt-5 border-t border-border">
 <p className="text-xs text-muted-foreground mb-2">Notes</p>
 <p className="text-sm">{customer.notes}</p>
 </div>
 )}
 </TabsContent>

 <TabsContent value="orders" className="p-5 m-0">
 {orders.length > 0 ? (
 <DataTable
 columns={orderColumns}
 data={orders}
 searchable
 searchPlaceholder="Search orders..."
 onRowClick={(item: any) => router.push(`/orders/${item.id}`)}
 />
 ) : (
 <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
 <p className="text-sm">No orders yet</p>
 </div>
 )}
 </TabsContent>

 <TabsContent value="quotations" className="p-5 m-0">
 {quotations.length > 0 ? (
 <DataTable
 columns={quotationColumns}
 data={quotations}
 searchable
 searchPlaceholder="Search quotations..."
 onRowClick={(item: any) => router.push(`/quotations/${item.id}`)}
 />
 ) : (
 <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
 <FileSignature className="w-8 h-8 mb-2" />
 <p className="text-sm">No quotations yet</p>
 </div>
 )}
 </TabsContent>

 <TabsContent value="invoices" className="p-5 m-0">
 {invoices.length > 0 ? (
 <DataTable
 columns={invoiceColumns}
 data={invoices}
 searchable
 searchPlaceholder="Search invoices..."
 onRowClick={(item: any) => router.push(`/invoices/${item.id}`)}
 />
 ) : (
 <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
 <Receipt className="w-8 h-8 mb-2" />
 <p className="text-sm">No invoices yet</p>
 </div>
 )}
 </TabsContent>

 <TabsContent value="payments" className="p-5 m-0">
 {payments.length > 0 ? (
 <DataTable
 columns={paymentColumns}
 data={payments}
 searchable
 searchPlaceholder="Search payments..."
 />
 ) : (
 <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
 <p className="text-sm">No payments recorded</p>
 </div>
 )}
 </TabsContent>
 </Tabs>
 </div>
 )
}
