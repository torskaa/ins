"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Building2, Save } from "lucide-react"

export default function WorkspaceSettingsPage() {
 const router = useRouter()
 const params = useParams()
 const id = params.id as string
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const [name, setName] = useState("")
 const [slug, setSlug] = useState("")
 const [role, setRole] = useState("")
 const [memberCount, setMemberCount] = useState(0)

 useEffect(() => {
 Promise.all([
 fetch(`/api/workspaces/${id}`).then((r) => r.json()),
 ]).then(([ws]) => {
 if (ws?.name) {
 setName(ws.name)
 setSlug(ws.slug)
 setRole(ws.role)
 }
 }).catch(() => toast.error("Failed to load workspace"))
 .finally(() => setLoading(false))
 }, [id])

 async function handleSave(e: React.FormEvent) {
 e.preventDefault()
 if (!name.trim()) { toast.error("Name is required"); return }
 setSaving(true)
 try {
 const res = await fetch(`/api/workspaces/${id}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ name: name.trim() }),
 })
 if (!res.ok) throw new Error()
 toast.success("Workspace updated")
 router.refresh()
 } catch { toast.error("Failed to update") }
 finally { setSaving(false) }
 }

 async function handleDelete() {
 if (!confirm("Delete this workspace? All data will be permanently lost.")) return
 setSaving(true)
 try {
 const res = await fetch(`/api/workspaces/${id}`, { method: "DELETE" })
 if (!res.ok) throw new Error()
 toast.success("Workspace deleted")
 router.push("/workspaces")
 router.refresh()
 } catch { toast.error("Failed to delete") }
 finally { setSaving(false) }
 }

 if (loading) return <div className="animate-fade-in p-8 text-center text-muted-foreground">Loading...</div>

 return (
 <div className="animate-fade-in max-w-2xl pb-28">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
 Back
 </button>
 <div className="page-header"><h1>Workspace Settings</h1></div>

 <form onSubmit={handleSave} className="space-y-5">
 <Card>
 <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Workspace Info</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="name">Workspace Name</Label>
 <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Workspace name" required />
 </div>
 <div className="space-y-2">
 <Label htmlFor="slug">Slug</Label>
 <Input id="slug" value={slug} disabled className="text-muted-foreground font-mono" />
 </div>
 <div className="flex items-center gap-2 text-sm text-muted-foreground">
 Role: <span className="capitalize font-medium text-foreground">{role}</span>
 </div>
 </CardContent>
 </Card>

 <div className="flex gap-3">
 <Button type="submit" loading={saving} className="gap-1.5">Save Changes</Button>
 {role === "owner" && (
 <Button type="button" variant="destructive" onClick={handleDelete} className="gap-1.5 ml-auto">Delete</Button>
 )}
 </div>
 </form>
 </div>
 )
}
