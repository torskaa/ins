"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { ArrowLeft, Shield, Plus } from "lucide-react"

export default function NewRolePage() {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [name, setName] = useState("")
 const [description, setDescription] = useState("")
 const [permissions, setPermissions] = useState("{}")

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!name.trim()) { toast.error("Role name is required"); return }
 let parsed: Record<string, unknown>
 try { parsed = JSON.parse(permissions) } catch { toast.error("Invalid JSON"); return }
 setLoading(true)
 try {
 const res = await fetch("/api/roles", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ name: name.trim(), description: description.trim() || null, permissions: parsed }),
 })
 if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to create") }
 toast.success("Role created")
 router.push("/settings/roles")
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Failed to create role")
 } finally { setLoading(false) }
 }

 return (
 <div className="animate-fade-in max-w-2xl pb-28">
 <div className="page-header flex items-center gap-4">
 <Button variant="ghost" size="icon" onClick={() => router.back()}></Button>
 <div><h1>Create Role</h1><p>Define a new access control role</p></div>
 </div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader><div className="flex items-center gap-2"><CardTitle>Role Details</CardTitle></div></CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
 <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Editor" required />
 </div>
 <div className="space-y-2">
 <Label htmlFor="description">Description</Label>
 <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the role's purpose" rows={3} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="permissions">Permissions (JSON)</Label>
 <Textarea id="permissions" value={permissions} onChange={(e) => setPermissions(e.target.value)} className="font-mono text-xs min-h-[200px]" rows={10} />
 </div>
 </CardContent>
 </Card>
 <div className="flex items-center justify-end gap-3">
 <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
 <Button loading={loading}><Plus className="w-4 h-4" /> Create Role</Button>
 </div>
 </form>
 </div>
 )
}
