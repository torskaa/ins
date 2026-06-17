"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { Settings2, Shield, Users } from "lucide-react"
import { useHotkey } from "@/hooks/use-hotkey"

type Role = {
 id: string
 name: string
 description: string | null
 isSystem: boolean
 permissions: string
}

export default function RolesPage() {
 const [roles, setRoles] = useState<Role[]>([])
 const [loading, setLoading] = useState(true)
 const router = useRouter()
 const handleNew = useCallback(() => { window.location.href = "/settings/roles/new" }, [])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/roles")
 .then((res) => res.json())
 .then((data) => { if (Array.isArray(data)) setRoles(data) })
 .finally(() => setLoading(false))
 }, [])

 const columns: Column<Role>[] = [
 { key: "name", label: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
 {
 key: "description", label: "Description",
 render: (r) => <span className="text-muted-foreground">{r.description || "—"}</span>,
 },
 {
 key: "isSystem", label: "System",
 render: (r) =>
 r.isSystem
 ? <Badge variant="success">System</Badge>
 : <Badge variant="secondary">Custom</Badge>,
 },
 {
 key: "actions", label: "",
 render: (r) => (
 <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/settings/roles/${r.id}`) }}>
 Edit
 </Button>
 ),
 },
 ]

 return (
 <div className="animate-fade-in">
 <div className="page-header flex items-center justify-between">
 <div>
 <h1>Roles</h1>
 <p>Manage access control roles and permissions</p>
 </div>
 <Link href="/settings/roles/new"><Button className="gap-1.5">Create Role <ShortcutBadge shortcut="⌘C" /></Button></Link>
 </div>
 <DataTable
 columns={columns} data={roles} searchable searchPlaceholder="Search roles..."
 onRowClick={(item) => router.push(`/settings/roles/${item.id}`)}
 loading={loading}
 empty={{ icons: [<Shield className="w-5 h-5" />, <Users className="w-5 h-5" />, <Settings2 className="w-5 h-5" />], title: "No roles yet", description: "Create your first role to define access permissions." }}
 />
 </div>
 )
}
