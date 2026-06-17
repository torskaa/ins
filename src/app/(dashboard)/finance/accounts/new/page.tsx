"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const ACCOUNT_TYPES = [
 { value: "asset", label: "Asset" }, { value: "liability", label: "Liability" },
 { value: "equity", label: "Equity" }, { value: "revenue", label: "Revenue" },
 { value: "expense", label: "Expense" }, { value: "contra_asset", label: "Contra Asset" },
 { value: "contra_liability", label: "Contra Liability" }, { value: "contra_equity", label: "Contra Equity" },
]

export default function NewAccountPage() {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [groups, setGroups] = useState<{ id: string; name: string; type: string }[]>([])
 const [form, setForm] = useState({ code: "", name: "", type: "asset", groupId: "", openingBalance: "0" })

 useEffect(() => {
 fetch("/api/finance/accounts").then(r => r.json()).then(d => { if (d.groups) setGroups(d.groups) })
 }, [])

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!form.code || !form.name) { toast.error("Code and name are required"); return }
 setLoading(true)
 try {
 const res = await fetch("/api/finance/accounts", {
 method: "POST", headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ ...form, openingBalance: parseFloat(form.openingBalance) || 0 }),
 })
 if (!res.ok) throw new Error()
 toast.success("Account created"); router.push("/finance/accounts"); router.refresh()
 } catch { toast.error("Failed to create") } finally { setLoading(false) }
 }

 return (
 <div className="animate-fade-in max-w-2xl">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">Back</button>
 <div className="page-header"><h1>New Account</h1><p>Add a GL account to your chart of accounts</p></div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader className="pb-3"><h3 className="text-sm font-semibold flex items-center gap-2">Account Details</h3></CardHeader>
 <CardContent className="space-y-4 pt-0">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label>Code <span className="text-destructive">*</span></Label>
 <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="1000" />
 </div>
 <div className="space-y-2">
 <Label>Name <span className="text-destructive">*</span></Label>
 <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Cash" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label>Type</Label>
 <Select options={ACCOUNT_TYPES} value={form.type} onChange={(e: any) => setForm({ ...form, type: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label>Group</Label>
 <Select options={groups.filter(g => g.type === form.type).map(g => ({ value: g.id, label: g.name }))} value={form.groupId} onChange={(e: any) => setForm({ ...form, groupId: e.target.value })} placeholder="Select group" />
 </div>
 </div>
 <div className="space-y-2">
 <Label>Opening Balance (฿)</Label>
 <Input type="number" value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: e.target.value })} />
 </div>
 </CardContent>
 </Card>
 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
 <Button type="submit" loading={loading}>Create Account</Button>
 </div>
 </form>
 </div>
 )
}
