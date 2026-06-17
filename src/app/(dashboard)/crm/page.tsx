"use client"

import { useState, useEffect, useCallback } from "react"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Building2, Mail, Phone, Search } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { formatDate } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { downloadCSV, downloadPDF } from "@/lib/export"

type Customer = {
 id: string
 name: string
 email: string
 phone: string
 company: string
 _count: { orders: number; invoices: number }
 createdAt: string
}

const PROPERTY_OPTIONS = [
 { key: "email", label: "Email" },
 { key: "phone", label: "Phone" },
 { key: "orders", label: "Orders" },
 { key: "createdAt", label: "Created" },
]

const DEFAULT_PROPS = ["email", "phone", "orders", "createdAt"]

export default function CRMPage() {
 const [customers, setCustomers] = useState<Customer[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("")
 const [view, setView] = useState<"cards" | "rows">("rows")
 const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
 const router = useRouter()
 const handleNew = useCallback(() => router.push("/crm/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/customers")
 .then(r => r.json())
 .then((data) => { if (Array.isArray(data)) setCustomers(data) })
 .finally(() => setLoading(false))
 }, [])

 const filtered = customers.filter((c) =>
 !search || [c.name, c.email, c.phone, c.company]
 .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
 )

 const allColumns: Column<Customer>[] = [
 {
 key: "name",
 label: "Name",
 render: (c) => (
 <div>
 <p className="font-medium">{c.name}</p>
 {c.company && <p className="text-xs text-muted-foreground">{c.company}</p>}
 </div>
 ),
 },
 {
 key: "email",
 label: "Email",
 render: (c) => <span className="text-sm text-muted-foreground">{c.email || "—"}</span>,
 },
 {
 key: "phone",
 label: "Phone",
 render: (c) => <span className="text-sm text-muted-foreground">{c.phone || "—"}</span>,
 },
 {
 key: "orders",
 label: "Orders",
 cellClassName: "font-mono text-sm",
 render: (c) => <span>{c._count?.orders || 0}</span>,
 },
 {
 key: "createdAt",
 label: "Created",
 render: (c) => <span className="text-sm text-muted-foreground">{formatDate(new Date(c.createdAt))}</span>,
 },
 ]

 const columns = allColumns.filter((c) => props.includes(c.key))

 return (
 <div className="space-y-6 animate-fade-in">
 <div className="flex items-center justify-between flex-wrap gap-4">
 <div>
 <h1 className="text-2xl font-semibold tracking-tight">CRM</h1>
 <p className="text-sm text-muted-foreground mt-1">Manage your customers and relationships</p>
 </div>
 <div className="flex items-center gap-3">
 {filtered.length > 0 && (
 <>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
<Input placeholder="Search customers..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
 </div>
 <ViewToggle view={view} onChange={setView} />
 <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
 </>
 )}
 <MoreMenu actions={[
 { label: "Import", icon: ActionIcons.AddNew },
 "separator",
 { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Name", "Email", "Phone", "Company", "Total Orders"], customers.map(c => [c.name, c.email || "", c.phone || "", c.company || "", String(c._count?.orders || 0)]), "customers.csv") },
 { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Customers", []) },
 "separator",
 { label: "Refresh", icon: ActionIcons.Refresh },
 ]} />
 <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>Add Customer <ShortcutBadge shortcut="⌘C" />
 </Button>
 </div>
 </div>

 <DataTable
 columns={columns}
 data={filtered}
 onRowClick={(item) => router.push(`/crm/${item.id}`)}
 loading={loading}
 empty={{
 icons: [<Users className="w-5 h-5" />, <Building2 className="w-5 h-5" />, <Mail className="w-5 h-5" />],
 title: "No customers yet",
 description: "Add your first customer to start tracking relationships.",
 action: { label: "Add Customer", onClick: () => router.push("/crm/new") },
 }}
 />
 </div>
 )
}
