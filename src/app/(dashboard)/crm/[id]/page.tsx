"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge, BadgeDot, SemanticBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Banknote, Building2, Calendar, ClipboardList, Clock, CreditCard, DollarSign, FileCode, FileSignature, FileText, Hash, HouseIcon, Mail, Package, Pencil, Phone, Receipt, ShoppingCart, Trash2, XCircle } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"

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
      <p className="text-[11px] text-muted-foreground font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </p>
      {children}
    </div>
  )
}

type FinancialSummary = {
  totalOrders: number
  totalOrderValue: number
  totalInvoiced: number
  totalPaid: number
  totalDue: number
  creditRemaining: number
}

type Order = { id: string; number: string; type: string; status: string; total: number; orderDate: string }
type Quotation = { id: string; number: string; status: string; total: number; validUntil: string; createdAt: string }
type Invoice = { id: string; number: string; status: string; total: number; paidAmount: number; dueDate: string; issueDate: string }
type Payment = { id: string; amount: number; date: string; method: string; reference: string; invoice?: { number: string; id: string }; order?: { number: string; id: string } }
type Customer = {
  id: string; name: string; email: string; phone: string; company: string; taxId: string
  creditLimit: number; notes: string; createdAt: string
  orders: Order[]; quotations: Quotation[]; invoices: Invoice[]; payments: Payment[]
  financialSummary: FinancialSummary
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [id, setId] = useState("")
  const [activeTab, setActiveTab] = useState("orders")
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm] = useState<any>({})
  const [searchOrders, setSearchOrders] = useState("")
  const [searchQuotations, setSearchQuotations] = useState("")
  const [searchInvoices, setSearchInvoices] = useState("")
  const [searchPayments, setSearchPayments] = useState("")
  const router = useRouter()

  useEffect(() => { params.then(({ id }) => setId(id)) }, [params])

  useEffect(() => {
    if (!id) return
    fetch(`/api/customers/${id}`).then(r => r.json()).then(r => { if (r?.success) setCustomer(r.data); else setError(r?.error || "Failed to load") }).catch((err) => { setError(err.message || "Failed to load data") }).finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Customer deleted")
      router.push("/crm")
    } catch {
      toast.error("Failed to delete customer")
      setDeleting(false)
    }
  }

  async function handleSave() {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          company: form.company,
          taxId: form.taxId,
          creditLimit: parseFloat(form.creditLimit) || 0,
          notes: form.notes,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      const updated = await res.json()
      setCustomer(prev => prev ? { ...prev, ...updated, financialSummary: prev.financialSummary } : prev)
      setShowEdit(false)
      toast.success("Customer updated")
    } catch {
      toast.error("Failed to update customer")
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

  if (loading) return <SkeletonDetail cards={6} hasChart={true} />

  if (!customer) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Customer not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The customer you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/crm")}>Back to CRM</Button>
      </div>
    )
  }

  const {
    orders = [],
    quotations = [],
    invoices = [],
    payments = [],
    financialSummary: {
      totalOrderValue = 0,
      totalOrders = 0,
      totalInvoiced = 0,
      totalPaid = 0,
      totalDue = 0,
      creditRemaining = 0,
    } = {},
  } = customer

  const orderColumns = [
    { key: "number", label: "Order #", render: (item: Order) => <span className="font-mono text-xs font-medium">{item.number}</span> },
    { key: "type", label: "Type", render: (item: Order) => <SemanticBadge semantic={item.type} category="type" className="text-[10px]" /> },
    { key: "status", label: "Status", render: (item: Order) => <SemanticBadge semantic={item.status} category="status" className="text-[10px]" /> },
    { key: "total", label: "Total", render: (item: Order) => <span className="font-mono text-xs font-medium">{formatCurrency(item.total)}</span> },
    { key: "orderDate", label: "Date", render: (item: Order) => <span className="text-xs text-muted-foreground">{formatDate(new Date(item.orderDate))}</span> },
  ]

  const quotationColumns = [
    { key: "number", label: "Quotation #", render: (item: Quotation) => <span className="font-mono text-xs font-medium">{item.number}</span> },
    { key: "status", label: "Status", render: (item: Quotation) => <SemanticBadge semantic={item.status} category="status" className="text-[10px]" /> },
    { key: "total", label: "Total", render: (item: Quotation) => <span className="font-mono text-xs font-medium">{formatCurrency(item.total)}</span> },
    { key: "validUntil", label: "Valid Until", render: (item: Quotation) => <span className="text-xs text-muted-foreground">{formatDate(new Date(item.validUntil))}</span> },
    { key: "createdAt", label: "Date", render: (item: Quotation) => <span className="text-xs text-muted-foreground">{formatDate(new Date(item.createdAt))}</span> },
  ]

  const invoiceColumns = [
    { key: "number", label: "Invoice #", render: (item: Invoice) => <span className="font-mono text-xs font-medium">{item.number}</span> },
    { key: "status", label: "Status", render: (item: Invoice) => <SemanticBadge semantic={item.status} category="status" className="text-[10px]" /> },
    { key: "total", label: "Total", render: (item: Invoice) => <span className="font-mono text-xs font-medium">{formatCurrency(item.total)}</span> },
    { key: "paidAmount", label: "Paid", render: (item: Invoice) => <span className="font-mono text-xs text-muted-foreground">{formatCurrency(item.paidAmount)}</span> },
    { key: "issueDate", label: "Issue Date", render: (item: Invoice) => <span className="text-xs text-muted-foreground">{formatDate(new Date(item.issueDate))}</span> },
    { key: "dueDate", label: "Due Date", render: (item: Invoice) => <span className="text-xs text-muted-foreground">{formatDate(new Date(item.dueDate))}</span> },
  ]

  const paymentColumns = [
    { key: "date", label: "Date", render: (item: Payment) => <span className="text-xs text-muted-foreground">{formatDateTime(new Date(item.date))}</span> },
    { key: "amount", label: "Amount", render: (item: Payment) => <span className="font-mono text-xs font-medium">{formatCurrency(item.amount)}</span> },
    { key: "method", label: "Method", render: (item: Payment) => {
      const labels: Record<string, string> = { bank_transfer: "Bank Transfer", cash: "Cash", credit_card: "Credit Card", cheque: "Cheque", promptpay: "PromptPay" }
      return <span className="text-xs capitalize">{labels[item.method] || item.method}</span>
    }},
    { key: "reference", label: "Reference", render: (item: Payment) => <span className="text-xs text-muted-foreground font-mono">{item.reference || "—"}</span> },
    { key: "linked", label: "Linked To", render: (item: Payment) => {
      const inv = item.invoice; const ord = item.order
      return <span className="text-xs text-muted-foreground">{inv ? `INV ${inv.number}` : ord ? `ORD ${ord.number}` : "—"}</span>
    }},
  ]

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      <Frame variant="ghost" className="w-fit">
        <FramePanel className="gap-2 px-3! py-2! border-0!">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/crm" className="flex items-center gap-1.5">
                  <HouseIcon className="size-4" aria-hidden="true" />
                  CRM
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">{customer.name}</BreadcrumbPage>
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
                  <h1 className="text-2xl font-bold">{customer.name}</h1>
                  {customer.company && (
                    <SemanticBadge semantic={customer.company} category="category" className="gap-1 text-[11px]"><Building2 className="w-3 h-3" />{customer.company}</SemanticBadge>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <SemanticBadge semantic={customer.email || "client"} category="id" className="gap-1 text-[11px]"><Mail className="w-3 h-3" />{customer.email || "—"}</SemanticBadge>
                  {customer.phone && <span className="flex items-center gap-1 text-sm text-muted-foreground"><Phone className="w-3 h-3" />{customer.phone}</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => router.push(`/orders/new?customerId=${customer.id}`)} className="gap-1.5 h-9 text-xs"><ShoppingCart className="w-3.5 h-3.5" /> New Order</Button>
                <MoreMenu actions={[
                  { label: "Edit", icon: <Pencil className="w-4 h-4" />, onClick: () => { setForm({ name: customer.name, email: customer.email || "", phone: customer.phone || "", company: customer.company || "", taxId: customer.taxId || "", creditLimit: String(customer.creditLimit || 0), notes: customer.notes || "" }); setShowEdit(true) } },
                  "separator",
                  { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDelete(true) },
                ]} />
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>Updated {formatDate(new Date(customer.createdAt))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Metrics Grid */}
        <div className="col-span-12 grid grid-cols-12 gap-3">
          <Card className="col-span-6 border-border/50">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><DollarSign className="w-4 h-4 text-primary" /></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Value</p>
                  <p className="text-base font-semibold font-mono mt-0.5">{formatCurrency(totalOrderValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-6 border-border/50">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><CreditCard className="w-4 h-4 text-primary" /></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Credit Remaining</p>
                  <p className="text-base font-semibold font-mono mt-0.5">{formatCurrency(creditRemaining)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-3 border-border/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0"><ShoppingCart className="w-3.5 h-3.5 text-primary" /></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Total Orders</p>
                  <p className="text-sm font-semibold font-mono">{totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-3 border-border/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0"><Receipt className="w-3.5 h-3.5 text-primary" /></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Total Invoiced</p>
                  <p className="text-sm font-semibold font-mono">{formatCurrency(totalInvoiced)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-3 border-border/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0"><CreditCard className="w-3.5 h-3.5 text-primary" /></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Total Paid</p>
                  <p className="text-sm font-semibold font-mono">{formatCurrency(totalPaid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-3 border-border/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0"><FileText className="w-3.5 h-3.5 text-primary" /></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Total Due</p>
                  <p className="text-sm font-semibold font-mono">{formatCurrency(totalDue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Left Column (8 cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="w-4 h-4 text-primary" />
                Profile Information
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-x-8 gap-y-4">
                <FieldGroup label="Email"><p className="text-sm font-medium flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />{customer.email || "—"}</p></FieldGroup>
                <FieldGroup label="Company"><p className="text-sm font-medium flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />{customer.company || "—"}</p></FieldGroup>
                <FieldGroup label="Credit Limit"><p className="text-sm font-medium font-mono">{formatCurrency(customer.creditLimit)}</p></FieldGroup>
                <FieldGroup label="Phone"><p className="text-sm font-medium">{customer.phone || "—"}</p></FieldGroup>
                <FieldGroup label="Tax ID"><p className="text-sm font-medium font-mono">{customer.taxId || "—"}</p></FieldGroup>
                <FieldGroup label="Customer Since"><p className="text-sm font-medium flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />{formatDate(new Date(customer.createdAt))}</p></FieldGroup>
              </div>
              {customer.notes && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-[11px] text-muted-foreground font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{customer.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Financial Overview */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <DollarSign className="w-4 h-4 text-primary" />
                Financial Overview
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">Total Order Value</span>
                <span className="text-lg font-semibold font-mono">{formatCurrency(totalOrderValue)}</span>
              </div>
              <Progress
                className="h-1.5"
                indicatorClassName="bg-success"
                value={customer.creditLimit > 0 ? Math.min(((totalOrderValue) / customer.creditLimit) * 100, 100) : 0}
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Credit Limit: {formatCurrency(customer.creditLimit)}</span>
                <span>Remaining: {formatCurrency(creditRemaining)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="text-center p-2 rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground">Orders</p>
                  <p className="text-sm font-semibold font-mono">{totalOrders}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground">Invoiced</p>
                  <p className="text-sm font-semibold font-mono">{formatCurrency(totalInvoiced)}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground">Paid</p>
                  <p className="text-sm font-semibold font-mono">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground">Due</p>
                  <p className="text-sm font-semibold font-mono">{formatCurrency(totalDue)}</p>
                </div>
              </div>
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
                <FieldDisplay label="Created" value={formatDate(new Date(customer.createdAt))} />
                <FieldDisplay label="Updated" value={customer.updatedAt ? formatDate(new Date(customer.updatedAt)) : "—"} />
                <FieldDisplay label="Tax ID" value={customer.taxId || "—"} mono />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unified Tab Module */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden pt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full overflow-x-auto px-4">
            <TabsTrigger value="orders" className="gap-1.5"><ShoppingCart className="w-4 h-4" /> Orders{orders.length > 0 && <span className="ml-1 text-[11px] text-muted-foreground">({orders.length})</span>}</TabsTrigger>
            <TabsTrigger value="quotations" className="gap-1.5"><FileSignature className="w-4 h-4" /> Quotations{quotations.length > 0 && <span className="ml-1 text-[11px] text-muted-foreground">({quotations.length})</span>}</TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1.5"><Receipt className="w-4 h-4" /> Invoices{invoices.length > 0 && <span className="ml-1 text-[11px] text-muted-foreground">({invoices.length})</span>}</TabsTrigger>
            <TabsTrigger value="payments" className="gap-1.5"><Banknote className="w-4 h-4" /> Payments{payments.length > 0 && <span className="ml-1 text-[11px] text-muted-foreground">({payments.length})</span>}</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="pt-8 px-3 pb-3">
            {(() => {
              if (orders.length === 0) {
                return (
                  <EmptyState
                    icons={[<ShoppingCart key="o1" className="w-6 h-6" />, <ClipboardList key="o2" className="w-6 h-6" />, <Package key="o3" className="w-6 h-6" />]}
                    title="No orders yet"
                    description="Orders placed by this customer will appear here"
                    size="sm"
                  />
                )
              }
              const filtered = !searchOrders ? orders : orders.filter((item: any) =>
                JSON.stringify(item).toLowerCase().includes(searchOrders.toLowerCase())
              )
              return (
                <>
                  <div className="flex items-center mb-3">
                    <input
                      className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Search orders..."
                      value={searchOrders}
                      onChange={(e) => setSearchOrders(e.target.value)}
                    />
                  </div>
                  {filtered.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-6">No orders match your search</div>
                  ) : (
                    <div data-slot="frame">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {orderColumns.map((col: any) => (
                              <TableHead key={col.key}>{col.label}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map((item: any) => (
                            <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/orders/${item.id}`)}>
                              {orderColumns.map((col: any) => (
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
                </>
              )
            })()}
          </TabsContent>

          <TabsContent value="quotations" className="pt-8 px-3 pb-3">
            {(() => {
              if (quotations.length === 0) {
                return (
                  <EmptyState
                    icons={[<FileSignature key="q1" className="w-6 h-6" />, <FileText key="q2" className="w-6 h-6" />, <FileCode key="q3" className="w-6 h-6" />]}
                    title="No quotations yet"
                    description="Quotations sent to this customer will appear here"
                    size="sm"
                  />
                )
              }
              const filtered = !searchQuotations ? quotations : quotations.filter((item: any) =>
                JSON.stringify(item).toLowerCase().includes(searchQuotations.toLowerCase())
              )
              return (
                <>
                  <div className="flex items-center mb-3">
                    <input
                      className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Search quotations..."
                      value={searchQuotations}
                      onChange={(e) => setSearchQuotations(e.target.value)}
                    />
                  </div>
                  {filtered.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-6">No quotations match your search</div>
                  ) : (
                    <div data-slot="frame">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {quotationColumns.map((col: any) => (
                              <TableHead key={col.key}>{col.label}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map((item: any) => (
                            <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/quotations/${item.id}`)}>
                              {quotationColumns.map((col: any) => (
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
                </>
              )
            })()}
          </TabsContent>

          <TabsContent value="invoices" className="pt-8 px-3 pb-3">
            {(() => {
              if (invoices.length === 0) {
                return (
                  <EmptyState
                    icons={[<Receipt key="i1" className="w-6 h-6" />, <FileText key="i2" className="w-6 h-6" />, <Banknote key="i3" className="w-6 h-6" />]}
                    title="No invoices yet"
                    description="Invoices issued to this customer will appear here"
                    size="sm"
                  />
                )
              }
              const filtered = !searchInvoices ? invoices : invoices.filter((item: any) =>
                JSON.stringify(item).toLowerCase().includes(searchInvoices.toLowerCase())
              )
              return (
                <>
                  <div className="flex items-center mb-3">
                    <input
                      className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Search invoices..."
                      value={searchInvoices}
                      onChange={(e) => setSearchInvoices(e.target.value)}
                    />
                  </div>
                  {filtered.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-6">No invoices match your search</div>
                  ) : (
                    <div data-slot="frame">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {invoiceColumns.map((col: any) => (
                              <TableHead key={col.key}>{col.label}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map((item: any) => (
                            <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/invoices/${item.id}`)}>
                              {invoiceColumns.map((col: any) => (
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
                </>
              )
            })()}
          </TabsContent>

          <TabsContent value="payments" className="pt-8 px-3 pb-3">
            {(() => {
              if (payments.length === 0) {
                return (
                  <EmptyState
                    icons={[<Banknote key="p1" className="w-6 h-6" />, <CreditCard key="p2" className="w-6 h-6" />, <DollarSign key="p3" className="w-6 h-6" />]}
                    title="No payments recorded"
                    description="Payments made by this customer will appear here"
                    size="sm"
                  />
                )
              }
              const filtered = !searchPayments ? payments : payments.filter((item: any) =>
                JSON.stringify(item).toLowerCase().includes(searchPayments.toLowerCase())
              )
              return (
                <>
                  <div className="flex items-center mb-3">
                    <input
                      className="h-8 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Search payments..."
                      value={searchPayments}
                      onChange={(e) => setSearchPayments(e.target.value)}
                    />
                  </div>
                  {filtered.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-6">No payments match your search</div>
                  ) : (
                    <div data-slot="frame">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {paymentColumns.map((col: any) => (
                              <TableHead key={col.key}>{col.label}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map((item: any) => (
                            <TableRow key={item.id}>
                              {paymentColumns.map((col: any) => (
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
                </>
              )
            })()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-lg flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update details for <span className="font-medium text-foreground">{customer?.name}</span></DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="w-4 h-4 text-primary" />
                  Profile Information
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Name" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Company"><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Tax ID"><Input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Credit Limit"><Input type="number" step="0.01" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} /></FieldGroup>
                </div>
                <FieldGroup label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></FieldGroup>
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
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{customer.name}</strong>? This action cannot be undone.</DialogDescription>
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
