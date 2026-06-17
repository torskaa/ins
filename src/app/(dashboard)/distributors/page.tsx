"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Building2, Globe, Phone, Users } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { Badge } from "@/components/ui/badge"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { downloadCSV, downloadPDF } from "@/lib/export"

type Distributor = {
 id: string
 name: string
 email: string | null
 phone: string | null
 territory: string | null
 status: string
 contactPerson: string | null
 _count: { deliveries: number }
}

const statusColors: Record<string, string> = {
 active: "bg-emerald-100 text-emerald-700",
 inactive: "bg-slate-100 text-slate-600",
 suspended: "bg-red-100 text-red-700",
}

export default function DistributorsPage() {
 const [distributors, setDistributors] = useState<Distributor[]>([])
 const [loading, setLoading] = useState(true)
 const router = useRouter()
 const handleNew = useCallback(() => router.push("/distributors/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/distributors")
 .then(r => r.json())
 .then((data) => { if (Array.isArray(data)) setDistributors(data) })
 .finally(() => setLoading(false))
 }, [])

 const columns: Column<Distributor>[] = [
 {
 key: "name",
 label: "Name",
 render: (d) => (
 <button onClick={() => router.push(`/distributors/${d.id}`)} className="font-medium text-left hover:text-primary transition-colors">
 {d.name}
 </button>
 ),
 },
 {
 key: "contactPerson",
 label: "Contact",
 render: (d) => (
 <div className="text-sm text-muted-foreground">
 {d.contactPerson && <span>{d.contactPerson}</span>}
 {d.email && <span className="block text-xs">{d.email}</span>}
 </div>
 ),
 },
 {
 key: "phone",
 label: "Phone",
 render: (d) => <span className="text-sm font-mono text-muted-foreground">{d.phone || "—"}</span>,
 },
 {
 key: "territory",
 label: "Territory",
 render: (d) => (
 <span className="flex items-center gap-1.5 text-sm">
 {d.territory || "—"}
 </span>
 ),
 },
 {
 key: "status",
 label: "Status",
 render: (d) => (
 <Badge className={`${statusColors[d.status] || "bg-slate-100 text-slate-600"} border-0 font-medium`}>
 {d.status}
 </Badge>
 ),
 },
 {
 key: "deliveries",
 label: "Deliveries",
 cellClassName: "font-mono text-sm text-muted-foreground",
 render: (d) => <span>{d._count?.deliveries || 0}</span>,
 },
 ]

 return (
 <div className="animate-fade-in">
 <div className="page-header flex items-center justify-between">
 <div>
 <h1>Distributors</h1>
 <p>Manage your distribution network</p>
 </div>
 <div className="flex items-center gap-2">
 <Button onClick={handleNew} className="gap-1.5">New Distributor <ShortcutBadge shortcut="⌘C" />
 </Button>
 <MoreMenu actions={[
 { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Name", "Contact", "Phone", "Territory", "Status", "Deliveries"], distributors.map(d => [d.name, d.contactPerson || "", d.phone || "", d.territory || "", d.status, d._count?.deliveries]), "distributors.csv") },
 { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Distributors", []) },
 ]} />
 </div>
 </div>

 <DataTable
 columns={columns}
 data={distributors}
 searchable
 searchPlaceholder="Search distributors..."
 loading={loading}
 empty={{
 icons: [<Building2 className="w-5 h-5" />, <Users className="w-5 h-5" />, <Globe className="w-5 h-5" />],
 title: "No distributors yet",
 description: "Add your first distributor to start managing distribution.",
 }}
 />
 </div>
 )
}
