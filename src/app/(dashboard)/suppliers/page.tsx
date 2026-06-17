"use client"

import { useState, useEffect, useCallback } from "react"
import { DataTable, statusBadge, type Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Globe, Search } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { ViewToggle } from "@/components/ui/view-toggle"
import { PropertySelector } from "@/components/ui/property-selector"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { useRouter } from "next/navigation"
import { downloadCSV, downloadPDF } from "@/lib/export"

type Supplier = {
 id: string
 name: string
 email: string
 phone: string
 contactPerson: string
 rating: string
 _count: { products: number }
}

const PROPERTY_OPTIONS = [
 { key: "email", label: "Email" },
 { key: "phone", label: "Phone" },
 { key: "rating", label: "Rating" },
 { key: "products", label: "Products" },
]

const DEFAULT_PROPS = ["email", "phone", "rating", "products"]

export default function SuppliersPage() {
 const [suppliers, setSuppliers] = useState<Supplier[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("")
 const [view, setView] = useState<"cards" | "rows">("rows")
 const [props, setProps] = useState<string[]>(DEFAULT_PROPS)
 const router = useRouter()
 const handleNew = useCallback(() => router.push("/suppliers/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/suppliers").then(r => r.json()).then((data) => { if (Array.isArray(data)) setSuppliers(data) }).finally(() => setLoading(false))
 }, [])

 const filtered = suppliers.filter((s) =>
 !search || [s.name, s.email, s.phone, s.contactPerson, s.rating]
 .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
 )

 const allColumns: Column<Supplier>[] = [
 {
 key: "name",
 label: "Name",
 render: (s) => (
 <div>
 <p className="font-medium">{s.name}</p>
 {s.contactPerson && <p className="text-xs text-muted-foreground">Contact: {s.contactPerson}</p>}
 </div>
 ),
 },
 {
 key: "email",
 label: "Email",
 render: (s) => <span className="text-sm text-muted-foreground">{s.email || "—"}</span>,
 },
 {
 key: "phone",
 label: "Phone",
 render: (s) => <span className="text-sm text-muted-foreground">{s.phone || "—"}</span>,
 },
 {
 key: "rating",
 label: "Rating",
 render: (s) => s.rating ? <span className={statusBadge({ variant: s.rating === "premium" ? "success" : s.rating === "standard" ? "default" : "secondary" })}>{s.rating}</span> : <span className="text-sm text-muted-foreground">—</span>,
 },
 {
 key: "products",
 label: "Products",
 cellClassName: "font-mono text-sm text-muted-foreground",
 render: (s) => <span>{s._count?.products || 0}</span>,
 },
 ]

 const columns = allColumns.filter((c) => props.includes(c.key))

 return (
 <div className="space-y-6 animate-fade-in">
 <div className="flex items-center justify-between flex-wrap gap-4">
 <div>
 <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
 <p className="text-sm text-muted-foreground mt-1">Manage your product suppliers and vendors</p>
 </div>
 <div className="flex items-center gap-3">
 {filtered.length > 0 && (
 <>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
<Input placeholder="Search suppliers..." className="pl-9 h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
 </div>
 <ViewToggle view={view} onChange={setView} />
 <PropertySelector options={PROPERTY_OPTIONS} selected={props} onChange={setProps} />
 </>
 )}
 <MoreMenu actions={[
 { label: "Import", icon: ActionIcons.AddNew },
 "separator",
 { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Name", "Email", "Phone", "Contact Person", "Rating", "Products"], suppliers.map(s => [s.name, s.email, s.phone, s.contactPerson, s.rating, String(s._count?.products)]), "suppliers.csv") },
 { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Suppliers", []) },
 "separator",
 { label: "Refresh", icon: ActionIcons.Refresh },
 ]} />
 <Button size="sm" className="h-9 gap-1.5" onClick={handleNew}>Add Supplier <ShortcutBadge shortcut="⌘C" /></Button>
 </div>
 </div>

 <DataTable
 columns={columns}
 data={filtered}
 onRowClick={(item) => router.push(`/suppliers/${item.id}`)}
 loading={loading}
 empty={{
 icons: [, , <Globe className="w-5 h-5" />],
 title: "No suppliers yet",
 description: "Add your first supplier to start managing vendor relationships.",
 action: { label: "Add Supplier", onClick: () => router.push("/suppliers/new") },
 }}
 />
 </div>
 )
}
