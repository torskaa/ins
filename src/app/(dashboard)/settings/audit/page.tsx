"use client"

import { useState, useEffect } from "react"
import { DataTable, statusBadge, type Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Search, Activity } from "lucide-react"
import { formatDateTime } from "@/lib/utils"

type AuditEntry = {
 id: string
 action: string
 entity: string
 entityId: string
 description: string | null
 userName: string
 createdAt: string
}

const ACTION_COLORS: Record<string, "success" | "destructive" | "warning" | "default" | "secondary"> = {
 created: "success",
 updated: "warning",
 deleted: "destructive",
}

export default function AuditPage() {
 const [entries, setEntries] = useState<AuditEntry[]>([])
 const [loading, setLoading] = useState(true)
 const [page, setPage] = useState(1)
 const [total, setTotal] = useState(0)
 const [actionFilter, setActionFilter] = useState("")
 const [entityFilter, setEntityFilter] = useState("")
 const [userFilter, setUserFilter] = useState("")

 const limit = 50

 useEffect(() => {
 setLoading(true)
 const params = new URLSearchParams({ page: String(page), limit: String(limit) })
 if (actionFilter) params.set("action", actionFilter)
 if (entityFilter) params.set("entity", entityFilter)
 if (userFilter) params.set("userId", userFilter)
 fetch(`/api/audit-entries?${params}`)
 .then((res) => res.json())
 .then((data) => {
 if (data.entries) setEntries(data.entries)
 if (data.total !== undefined) setTotal(data.total)
 })
 .finally(() => setLoading(false))
 }, [page, actionFilter, entityFilter, userFilter])

 const totalPages = Math.max(1, Math.ceil(total / limit))

 const columns: Column<AuditEntry>[] = [
 {
 key: "action", label: "Action",
 render: (e) => <span className={statusBadge({ variant: ACTION_COLORS[e.action] || "default" })}>{e.action}</span>,
 },
 { key: "entity", label: "Entity", render: (e) => <span className="font-medium capitalize">{e.entity}</span> },
 { key: "entityId", label: "ID", render: (e) => <span className="font-mono text-xs text-muted-foreground">{e.entityId?.slice(0, 12)}</span> },
 { key: "description", label: "Description", render: (e) => <span className="text-sm">{e.description || "—"}</span> },
 { key: "userName", label: "User", render: (e) => <span className="text-sm text-muted-foreground">{e.userName}</span> },
 {
 key: "createdAt", label: "Timestamp",
 render: (e) => <span className="text-sm text-muted-foreground whitespace-nowrap">{formatDateTime(new Date(e.createdAt))}</span>,
 },
 ]

 return (
 <div className="animate-fade-in">
 <div className="page-header"><div><h1>Audit Log</h1><p>Track all changes and activities across the system</p></div></div>

 <div className="flex items-center gap-3 mb-4 flex-wrap">
 <div className="w-44">
 <Select options={[{ value: "", label: "All Entities" }, { value: "Role", label: "Role" }, { value: "ApiKey", label: "API Key" }, { value: "OrganizationMember", label: "User" }, { value: "system", label: "System" }]} placeholder="All Entities" value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1) }} />
 </div>
 <div className="w-36">
 <Select options={[{ value: "", label: "All Actions" }, { value: "created", label: "Created" }, { value: "updated", label: "Updated" }, { value: "deleted", label: "Deleted" }]} placeholder="All Actions" value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1) }} />
 </div>
 <div className="relative flex-1 max-w-xs">
 <input placeholder="Filter by user ID..." value={userFilter} onChange={(e) => { setUserFilter(e.target.value); setPage(1) }}
 className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-150" />
 </div>
 </div>

 <DataTable columns={columns} data={entries} loading={loading}
 empty={{ icons: [, , <Activity className="w-5 h-5" />], title: "No audit entries found", description: "Activity will appear here as users interact with the system." }} />

 {total > limit && (
 <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
 <span className="text-xs text-muted-foreground">Page {page} of {totalPages} ({total} entries)</span>
 <div className="flex items-center gap-2">
 <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="gap-1">Prev</Button>
 <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="gap-1">Next </Button>
 </div>
 </div>
 )}
 </div>
 )
}
