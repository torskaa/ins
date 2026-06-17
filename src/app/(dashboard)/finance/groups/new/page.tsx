"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FolderOpen } from "lucide-react"
import { toast } from "sonner"

const GROUP_TYPES = [
 { value: "asset", label: "Asset" }, { value: "liability", label: "Liability" },
 { value: "equity", label: "Equity" }, { value: "revenue", label: "Revenue" },
 { value: "expense", label: "Expense" }, { value: "contra_asset", label: "Contra Asset" },
 { value: "contra_liability", label: "Contra Liability" }, { value: "contra_equity", label: "Contra Equity" },
]

export default function NewGroupPage() {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [form, setForm] = useState({ name: "", code: "", type: "asset", description: "" })

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!form.name || !form.code) { toast.error("Name and code are required"); return }
 setLoading(true)
 try {
 const res = await fetch("/api/finance/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
 if (!res.ok) throw new Error()
 toast.success("Group created"); router.push("/finance/groups"); router.refresh()
 } catch { toast.error("Failed") } finally { setLoading(false) }
 }

 return (
 <div className="animate-fade-in max-w-2xl">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">Back</button>
 <div className="page-header"><h1>New Account Group</h1><p>Add a group to organize GL accounts</p></div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card><CardHeader className="pb-3"><h3 className="text-sm font-semibold flex items-center gap-2">Group Details</h3></CardHeader>
 <CardContent className="space-y-4 pt-0">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2"><Label>Code <span className="text-destructive">*</span></Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="1000" /></div>
 <div className="space-y-2"><Label>Name <span className="text-destructive">*</span></Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Current Assets" /></div>
 </div>
 <div className="space-y-2"><Label>Type</Label><Select options={GROUP_TYPES} value={form.type} onChange={(e: any) => setForm({ ...form, type: e.target.value })} /></div>
 <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
 </CardContent>
 </Card>
 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
 <Button type="submit" loading={loading}>Create Group</Button>
 </div>
 </form>
 </div>
 )
}
