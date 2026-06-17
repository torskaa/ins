"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { Layers } from "lucide-react"

type Group = { id: string; name: string; code: string; type: string; description: string; _count: { accounts: number } }

const TYPE_COLORS: Record<string, string> = { asset: "bg-blue-100 text-blue-700", liability: "bg-orange-100 text-orange-700", equity: "bg-purple-100 text-purple-700", revenue: "bg-emerald-100 text-emerald-700", expense: "bg-red-100 text-red-700" }

export default function AccountGroupsPage() {
 const router = useRouter()
 const [groups, setGroups] = useState<Group[]>([])
 const [loading, setLoading] = useState(true)
 const handleNew = useCallback(() => router.push("/finance/groups/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/finance/groups").then(r => r.json()).then(d => { if (Array.isArray(d)) setGroups(d) }).finally(() => setLoading(false))
 }, [])

 const columns: Column<Group>[] = [
 { key: "code", label: "Code", cellClassName: "font-mono text-xs w-20 text-muted-foreground" },
 { key: "name", label: "Name", render: (g) => <span className="font-medium">{g.name}</span> },
 { key: "type", label: "Type", render: (g) => <Badge className={TYPE_COLORS[g.type] || ""}>{g.type.replace("_", " ")}</Badge> },
 { key: "description", label: "Description", render: (g) => <span className="text-sm text-muted-foreground">{g.description || "—"}</span> },
 { key: "_count", label: "Accounts", render: (g) => <span className="text-sm">{g._count?.accounts || 0}</span> },
 ]

 return (
 <div className="animate-fade-in">
 <div className="page-header flex items-center justify-between">
 <div><h1>Account Groups</h1><p>Organize accounts into groups for reporting</p></div>
 <Button onClick={handleNew} className="gap-1.5">New Group <ShortcutBadge shortcut="⌘C" /></Button>
 </div>
 <DataTable columns={columns} data={groups} searchable searchPlaceholder="Search groups..." loading={loading}
 empty={{ icons: [, <Layers className="w-5 h-5" />, ], title: "No groups yet", description: "Account groups help organize your chart of accounts." }}
 />
 </div>
 )
}
