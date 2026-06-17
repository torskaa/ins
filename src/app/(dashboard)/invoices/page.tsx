"use client"

import { useState, useEffect, useCallback } from "react"
import { DataTable, statusBadge, type Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, Search } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { downloadCSV, downloadPDF } from "@/lib/export"

const invoiceStatusColors: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
 draft: "secondary",
 sent: "default",
 paid: "success",
 overdue: "destructive",
 cancelled: "warning",
}

type Invoice = {
 id: string
 number: string
 status: string
 total: number
 paidAmount: number
 issueDate: string
 dueDate: string
 customer: { name: string }
}

const PROPERTY_OPTIONS = [
 { key: "total", label: "Total" },
 { key: "paidAmount", label: "Paid" },
 { key: "status", label: "Status" },
 { key: "dueDate", label: "Due Date" },
]

const DEFAULT_PROPS = ["total", "paidAmount", "status", "dueDate"]

export default function InvoicesPage() {
 const [invoices, setInvoices] = useState<Invoice[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("")
 const [view, setView] = useState<"cards" | "rows">("rows")
 const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
 const router = useRouter()
 const handleCreate = useCallback(() => router.push("/invoices/new"), [router])
 useHotkey("c", handleCreate)

 useEffect(() => {
 fetch("/api/invoices").then(r => r.json()).then((data) => { if (Array.isArray(data)) setInvoices(data) }).finally(() => setLoading(false))
 }, [])

 const filtered = invoices.filter((inv) =>
 !search || [inv.number, inv.status, inv.customer?.name]
 .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
 )

 const allColumns: Column<Invoice>[] = [
 {
 key: "number",
 label: "Invoice #",
 render: (inv) => <span className="font-mono text-xs font-medium">{inv.number}</span>,
 },
 {
 key: "customer",
 label: "Customer",
 render: (inv) => <span className="font-medium">{inv.customer?.name}</span>,
 },
 {
 key: "total",
 label: "Total",
 render: (inv) => <span className="font-mono text-sm font-medium">{formatCurrency(inv.total)}</span>,
 },
 {
 key: "paidAmount",
 label: "Paid",
 render: (inv) => <span className="font-mono text-sm text-muted-foreground">{formatCurrency(inv.paidAmount)}</span>,
 },
 {
 key: "status",
 label: "Status",
 render: (inv) => (
 <span className={statusBadge({ variant: invoiceStatusColors[inv.status] || "default" })}>
 {inv.status}
 </span>
 ),
 },
 {
 key: "dueDate",
 label: "Due Date",
 render: (inv) => <span className="text-sm text-muted-foreground">{formatDate(new Date(inv.dueDate))}</span>,
 },
 ]

 const columns = allColumns.filter((c) => props.includes(c.key))

 return (
 <div className="space-y-6 animate-fade-in">
 <div className="flex items-center justify-between flex-wrap gap-4">
 <div>
 <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
 <p className="text-sm text-muted-foreground mt-1">Manage your customer invoices</p>
 </div>
 <div className="flex items-center gap-3">
 {filtered.length > 0 && (
 <>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
<Input placeholder="Search invoices..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
 </div>
 <ViewToggle view={view} onChange={setView} />
 <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
 </>
 )}
 <MoreMenu actions={[
 { label: "Import", icon: ActionIcons.AddNew },
 "separator",
 { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Invoice #", "Customer", "Status", "Total", "Date"], invoices.map(i => [i.number, i.customer?.name, i.status, i.total, i.issueDate]), "invoices.csv") },
 { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Invoices", []) },
 "separator",
 { label: "Record Payment", href: "/payments", icon: ActionIcons.AddNew },
 ]} />
 <Button size="sm" className="h-9 gap-1.5" onClick={handleCreate}>Create Invoice <ShortcutBadge shortcut="⌘C" /></Button>
 </div>
 </div>

 <DataTable
 columns={columns}
 data={filtered}
 onRowClick={(item) => router.push(`/invoices/${item.id}`)}
 loading={loading}
 empty={{
 icons: [, , <Calendar className="w-5 h-5" />],
 title: "No invoices yet",
 description: "Create your first invoice to start tracking payments.",
 action: { label: "Create Invoice", onClick: () => router.push("/invoices/new") },
 }}
 />
 </div>
 )
}
