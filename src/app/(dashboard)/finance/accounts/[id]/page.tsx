"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { DataTable, type Column } from "@/components/ui/data-table"
import { formatDate } from "@/lib/utils"

type Account = { id: string; code: string; name: string; type: string; currentBalance: number; openingBalance: number; isActive: boolean; group: { name: string; type: string } }
type JournalLine = { id: string; debit: number; credit: number; description: string; entry: { number: string; date: string } }

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const router = useRouter()
 const { id } = use(params)
 const [account, setAccount] = useState<Account | null>(null)
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 fetch(`/api/finance/accounts/${id}`).then(r => r.json()).then(d => { if (d && !d.error) setAccount(d); else toast.error("Account not found") }).finally(() => setLoading(false))
 }, [id])

 if (loading) return <Skeleton className="h-64 w-full rounded-xl" />
 if (!account) return <div className="animate-fade-in"><p>Account not found</p><Button variant="secondary" onClick={() => router.push("/finance/accounts")}>Back</Button></div>

 return (
 <div className="animate-fade-in">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">Back</button>
 <div className="page-header flex items-start justify-between">
 <div>
 <div className="flex items-center gap-2">
 <h1>{account.code} - {account.name}</h1>
 <Badge variant={account.isActive ? "default" : "secondary"}>{account.isActive ? "Active" : "Inactive"}</Badge>
 </div>
 <p className="text-muted-foreground text-sm capitalize">{account.type.replace("_", " ")} · {account.group?.name}</p>
 </div>
 <div className="flex items-center gap-2">
 <Button variant="secondary" size="sm" onClick={() => router.push(`/finance/accounts/${id}/edit`)} className="gap-1.5">Edit</Button>
 <Button variant="ghost" size="sm" onClick={() => { if (window.confirm("Delete this account?")) fetch(`/api/finance/accounts/${id}`, { method: "DELETE" }).then(() => { toast.success("Deleted"); router.push("/finance/accounts") }).catch(() => toast.error("Failed")) }} className="gap-1.5 text-destructive">Delete</Button>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
 <Card><CardContent className="p-4 text-center"><p className={`text-2xl font-semibold ${account.currentBalance >= 0 ? "text-emerald-600" : "text-red-600"}`}>฿{account.currentBalance.toLocaleString()}</p><p className="text-xs text-muted-foreground">Current Balance</p></CardContent></Card>
 <Card><CardContent className="p-4 text-center"><p className="text-2xl font-semibold">฿{account.openingBalance.toLocaleString()}</p><p className="text-xs text-muted-foreground">Opening Balance</p></CardContent></Card>
 <Card><CardContent className="p-4 text-center"><p className="text-2xl font-semibold capitalize">{account.type.replace("_", " ")}</p><p className="text-xs text-muted-foreground">Account Type</p></CardContent></Card>
 </div>
 <Card><CardHeader><CardTitle>Details</CardTitle></CardHeader>
 <CardContent className="space-y-3">
 <div className="grid grid-cols-2 gap-4 text-sm">
 <div><span className="text-muted-foreground">Code</span><p className="font-mono">{account.code}</p></div>
 <div><span className="text-muted-foreground">Name</span><p>{account.name}</p></div>
 <div><span className="text-muted-foreground">Type</span><p className="capitalize">{account.type.replace("_", " ")}</p></div>
 <div><span className="text-muted-foreground">Group</span><p>{account.group?.name || "—"}</p></div>
 </div>
 </CardContent>
 </Card>
 </div>
 )
}
