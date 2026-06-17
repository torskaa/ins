"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { BookOpen, Building2, DollarSign } from "lucide-react"
import { useHotkey } from "@/hooks/use-hotkey"

type Account = { id: string; code: string; name: string; type: string; currentBalance: number; isActive: boolean; group: { name: string } }

const TYPE_COLORS: Record<string, string> = { asset: "bg-blue-100 text-blue-700", liability: "bg-orange-100 text-orange-700", equity: "bg-purple-100 text-purple-700", revenue: "bg-emerald-100 text-emerald-700", expense: "bg-red-100 text-red-700" }

export default function ChartOfAccountsPage() {
 const router = useRouter()
 const [accounts, setAccounts] = useState<Account[]>([])
 const [loading, setLoading] = useState(true)
 const handleNew = useCallback(() => router.push("/finance/accounts/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/finance/accounts").then(r => r.json()).then(d => { if (d.accounts) setAccounts(d.accounts) }).finally(() => setLoading(false))
 }, [])

 const columns: Column<Account>[] = [
 { key: "code", label: "Code", cellClassName: "font-mono text-xs text-muted-foreground w-20" },
 { key: "name", label: "Name", render: (a) => <span className="font-medium">{a.name}</span> },
 { key: "type", label: "Type", render: (a) => <Badge className={TYPE_COLORS[a.type] || ""}>{a.type.replace("_", " ")}</Badge> },
 { key: "group", label: "Group", render: (a) => <span className="text-sm text-muted-foreground">{a.group?.name || "—"}</span> },
 { key: "currentBalance", label: "Balance", render: (a) => <span className={`font-mono text-sm ${a.currentBalance >= 0 ? "text-emerald-600" : "text-red-600"}`}>฿{Math.abs(a.currentBalance).toLocaleString()}</span> },
 { key: "isActive", label: "Status", render: (a) => <Badge variant={a.isActive ? "default" : "secondary"}>{a.isActive ? "Active" : "Inactive"}</Badge> },
 ]

 return (
 <div className="animate-fade-in">
 <div className="page-header flex items-center justify-between">
 <div><h1>Chart of Accounts</h1><p>Manage your GL accounts and groups</p></div>
 <Button onClick={handleNew} className="gap-1.5">New Account <ShortcutBadge shortcut="⌘C" /></Button>
 </div>
 <DataTable columns={columns} data={accounts} searchable searchPlaceholder="Search accounts..." loading={loading}
 onRowClick={(item) => router.push(`/finance/accounts/${item.id}`)}
 empty={{ icons: [<BookOpen className="w-5 h-5" />, <Building2 className="w-5 h-5" />, <DollarSign className="w-5 h-5" />], title: "No accounts yet", description: "Add your first GL account to start tracking finances." }}
 />
 </div>
 )
}
