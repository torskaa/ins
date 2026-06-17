"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { Wrench, Activity, Settings2 } from "lucide-react"
import { useHotkey } from "@/hooks/use-hotkey"

type WorkCenter = {
 id: string
 code: string
 name: string
 costPerHour: number
 capacity: number
 location: string | null
 isActive: boolean
}

export default function WorkCentersPage() {
 const [data, setData] = useState<WorkCenter[]>([])
 const [loading, setLoading] = useState(true)
 const router = useRouter()
 const handleNew = useCallback(() => router.push("/production/work-centers/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/work-centers")
 .then(r => r.json())
 .then((d) => { if (Array.isArray(d)) setData(d) })
 .finally(() => setLoading(false))
 }, [])

 const columns: Column<WorkCenter>[] = [
 { key: "code", label: "Code", render: (w) => (
 <button onClick={() => router.push(`/production/orders?workCenter=${w.id}`)} className="font-mono text-xs text-muted-foreground">{w.code}</button>
 )},
 { key: "name", label: "Name", render: (w) => (
 <span className="font-medium">{w.name}</span>
 )},
 { key: "costPerHour", label: "Cost/hr", render: (w) => (
 <span className="font-mono text-sm">฿{w.costPerHour.toLocaleString()}</span>
 )},
 { key: "capacity", label: "Capacity", cellClassName: "font-mono text-sm", render: (w) => <span>{w.capacity}</span> },
 { key: "location", label: "Location", render: (w) => (
 <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
 {w.location || "—"}
 </span>
 )},
 { key: "isActive", label: "Status", render: (w) => (
 <Badge className={w.isActive ? "bg-emerald-100 text-emerald-700 border-0" : "bg-slate-100 text-slate-600 border-0"}>
 {w.isActive ? "Active" : "Inactive"}
 </Badge>
 )},
 ]

 return (
 <div className="animate-fade-in">
 <div className="page-header flex items-center justify-between">
 <div>
 <h1>Work Centers</h1>
 <p>Manage production work centers and cost rates</p>
 </div>
 <Button onClick={handleNew} className="gap-1.5">New Work Center <ShortcutBadge shortcut="⌘C" /></Button>
 </div>
 <DataTable columns={columns} data={data} searchable searchPlaceholder="Search work centers..." loading={loading}
 onRowClick={(item) => router.push(`/production/work-centers/${item.id}`)}
 empty={{ icons: [<Wrench className="w-5 h-5" />, <Activity className="w-5 h-5" />, <Settings2 className="w-5 h-5" />], title: "No work centers yet", description: "Add your first work center to start production planning." }}
 />
 </div>
 )
}
