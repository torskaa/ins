"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DataTable, statusBadge, type Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { toast } from "sonner"
import { Key, Settings2, ShieldAlert } from "lucide-react"
import { formatDate } from "@/lib/utils"

type ApiKey = {
 id: string
 name: string
 keyPrefix: string
 lastUsedAt: string | null
 expiresAt: string | null
 active: boolean
}

export default function ApiKeysPage() {
 const [keys, setKeys] = useState<ApiKey[]>([])
 const [loading, setLoading] = useState(true)
 const router = useRouter()
 const handleNew = useCallback(() => { window.location.href = "/settings/api-keys/new" }, [])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/api-keys")
 .then((res) => res.json())
 .then((data) => { if (Array.isArray(data)) setKeys(data) })
 .finally(() => setLoading(false))
 }, [])

 async function handleDelete(key: ApiKey) {
 if (!confirm(`Delete API key "${key.name}"?`)) return
 try {
 const res = await fetch(`/api/api-keys/${key.id}`, { method: "DELETE" })
 if (!res.ok) throw new Error()
 setKeys((prev) => prev.filter((k) => k.id !== key.id))
 toast.success("API key deleted")
 } catch { toast.error("Failed to delete API key") }
 }

 const columns: Column<ApiKey>[] = [
 { key: "name", label: "Name", render: (k) => <span className="font-medium">{k.name}</span> },
 { key: "keyPrefix", label: "Prefix", render: (k) => <span className="font-mono text-xs">{k.keyPrefix}...</span> },
 {
 key: "lastUsedAt", label: "Last Used",
 render: (k) => k.lastUsedAt ? <span className="text-sm text-muted-foreground">{formatDate(new Date(k.lastUsedAt))}</span>
 : <span className="text-sm text-muted-foreground/50">Never</span>,
 },
 {
 key: "expiresAt", label: "Expires",
 render: (k) => k.expiresAt ? <span className="text-sm text-muted-foreground">{formatDate(new Date(k.expiresAt))}</span>
 : <span className="text-sm text-muted-foreground/50">Never</span>,
 },
 {
 key: "active", label: "Status",
 render: (k) => k.active ? <span className={statusBadge({ variant: "success" })}>Active</span>
 : <span className={statusBadge({ variant: "secondary" })}>Inactive</span>,
 },
 {
 key: "actions", label: "",
 render: (k) => (
 <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(k) }}>
 </Button>
 ),
 },
 ]

 return (
 <div className="animate-fade-in">
 <div className="page-header flex items-center justify-between">
 <div><h1>API Keys</h1><p>Manage API keys for programmatic access</p></div>
 <Link href="/settings/api-keys/new"><Button className="gap-1.5">Create API Key <ShortcutBadge shortcut="⌘C" /></Button></Link>
 </div>
 <DataTable
 columns={columns} data={keys} searchable searchPlaceholder="Search API keys..." loading={loading}
 empty={{ icons: [<Key className="w-5 h-5" />, <ShieldAlert className="w-5 h-5" />, <Settings2 className="w-5 h-5" />], title: "No API keys yet", description: "Create an API key to enable programmatic access." }}
 />
 </div>
 )
}
