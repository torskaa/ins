"use client"

import { useState, useEffect, useCallback } from "react"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Banknote, DollarSign, Receipt, Search, XCircle } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { toast } from "sonner"
import { downloadCSV, downloadPDF } from "@/lib/export"

type Payment = {
 id: string
 amount: number
 date: string
 method: string
 reference: string
 invoice?: { number: string }
 order?: { number: string }
}

const methodColors: Record<string, string> = {
 bank_transfer: "bg-blue-100 text-blue-800",
 cash: "bg-green-100 text-green-800",
 credit_card: "bg-purple-100 text-purple-800",
 cheque: "bg-orange-100 text-orange-800",
}

const PROPERTY_OPTIONS = [
 { key: "method", label: "Method" },
 { key: "reference", label: "Reference" },
 { key: "source", label: "Source" },
 { key: "date", label: "Date" },
]

const DEFAULT_PROPS = ["method", "reference", "source", "date"]

export default function PaymentsPage() {
 const [payments, setPayments] = useState<Payment[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("")
 const [view, setView] = useState<"cards" | "rows">("rows")
 const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
 const [showCreate, setShowCreate] = useState(false)
 const handleCreate = useCallback(() => setShowCreate(true), [])
 useHotkey("c", handleCreate)

 useEffect(() => {
 fetch("/api/payments").then(r => r.json()).then((data) => { if (Array.isArray(data)) setPayments(data) }).finally(() => setLoading(false))
 }, [])

 const filtered = payments.filter((p) =>
 !search || [p.method, p.reference, p.invoice?.number, p.order?.number]
 .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
 )

 const allColumns: Column<Payment>[] = [
 {
 key: "amount",
 label: "Amount",
 render: (p) => <span className="font-mono text-sm font-medium">{formatCurrency(p.amount)}</span>,
 },
 {
 key: "method",
 label: "Method",
 render: (p) => (
 <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${methodColors[p.method] || "bg-muted text-muted-foreground"}`}>
 {p.method.replace(/_/g, " ")}
 </span>
 ),
 },
 {
 key: "reference",
 label: "Reference",
 render: (p) => <span className="text-sm text-muted-foreground">{p.reference || "—"}</span>,
 },
 {
 key: "source",
 label: "Source",
 render: (p) => <span className="text-sm text-muted-foreground">{p.invoice?.number || p.order?.number || "—"}</span>,
 },
 {
 key: "date",
 label: "Date",
 render: (p) => <span className="text-sm text-muted-foreground">{formatDateTime(new Date(p.date))}</span>,
 },
 ]

 const columns = allColumns.filter((c) => props.includes(c.key))

 return (
 <div className="space-y-6 animate-fade-in">
 <div className="flex items-center justify-between flex-wrap gap-4">
 <div>
 <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
 <p className="text-sm text-muted-foreground mt-1">Track all incoming and outgoing payments</p>
 </div>
 <div className="flex items-center gap-3">
 {filtered.length > 0 && (
 <>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
<Input placeholder="Search payments..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
 </div>
 <ViewToggle view={view} onChange={setView} />
 <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
 </>
 )}
 <MoreMenu actions={[
 { label: "Import", icon: ActionIcons.AddNew },
 "separator",
 { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Date", "Source", "Amount", "Method", "Reference"], payments.map(p => [p.date, p.invoice?.number || p.order?.number || "", p.amount, p.method, p.reference]), "payments.csv") },
 { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Payments", []) },
 ]} />
 <Button size="sm" className="h-9 gap-1.5" onClick={handleCreate}>Record Payment <ShortcutBadge shortcut="⌘C" /></Button>
 </div>
 </div>

 <DataTable
 columns={columns}
 data={filtered}
 loading={loading}
 empty={{
 icons: [<DollarSign className="w-5 h-5" />, <Banknote className="w-5 h-5" />, <Receipt className="w-5 h-5" />],
 title: "No payments recorded",
 description: "Record your first payment to start tracking transactions.",
 action: { label: "Record Payment", onClick: () => setShowCreate(true) },
 }}
 />

 <Dialog open={showCreate} onOpenChange={setShowCreate}>
 <DialogContent>
 <DialogHeader><DialogTitle>Record Payment</DialogTitle><DialogDescription>Enter payment details</DialogDescription></DialogHeader>
 <div className="space-y-4">
 <div className="space-y-2"><Label>Amount</Label><Input type="number" step="0.01" /></div>
 <div className="space-y-2">
 <Label>Method</Label>
 <Select options={[
 { value: "bank_transfer", label: "Bank Transfer" },
 { value: "cash", label: "Cash" },
 { value: "credit_card", label: "Credit Card" },
 { value: "cheque", label: "Cheque" },
 ]} />
 </div>
 <div className="space-y-2"><Label>Reference</Label><Input placeholder="Transaction ID" /></div>
 </div>
 <DialogFooter><Button variant="secondary" onClick={() => setShowCreate(false)}><XCircle className="w-4 h-4" /> Cancel</Button><Button>Record</Button></DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 )
}
