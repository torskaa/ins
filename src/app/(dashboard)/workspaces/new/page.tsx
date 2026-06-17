"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Building2, Plus } from "lucide-react"
import { toast } from "sonner"

export default function NewWorkspacePage() {
 const router = useRouter()
 const { update } = useSession()
 const [loading, setLoading] = useState(false)
 const [name, setName] = useState("")

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!name.trim()) { toast.error("Workspace name is required"); return }
 setLoading(true)
 try {
 const res = await fetch("/api/workspaces", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ name: name.trim() }),
 })
 if (!res.ok) throw new Error()
 const data = await res.json()
 await update({ activeOrganizationId: data.id })
 toast.success(`Workspace "${data.name}" created`)
 router.push("/dashboard")
 router.refresh()
 } catch { toast.error("Failed to create workspace") }
 finally { setLoading(false) }
 }

 return (
 <div className="animate-fade-in max-w-2xl">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
 Back
 </button>
 <div className="page-header"><h1>New Workspace</h1></div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Workspace Info</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="name">Workspace Name</Label>
 <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. My Brand" required />
 </div>
 </CardContent>
 </Card>
 <div className="flex gap-3">
 <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
 <Button type="submit" loading={loading} className="gap-1.5"><Plus className="w-4 h-4" /> Create Workspace
</Button>
 </div>
 </form>
 </div>
 )
}
