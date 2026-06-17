"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Check, CheckCircle, Save, XCircle } from "lucide-react"
import { SkeletonPageHeader, SkeletonForm } from "@/components/ui/skeleton"

const FALLBACK_ENTITIES = ["products", "orders", "invoices", "bom", "materials", "customers", "suppliers", "categories", "warehouses", "quotations", "payments", "accounts", "journal", "tax", "projects", "tasks", "workflows", "roles", "apiKeys", "auditLogs", "users", "settings"]
const ACTIONS = ["create", "read", "update", "delete"] as const

export default function EditRolePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
 const params = use(paramsPromise)
 const router = useRouter()
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const [deleting, setDeleting] = useState(false)
 const [confirmDelete, setConfirmDelete] = useState(false)
 const [role, setRole] = useState<any>(null)
 const [name, setName] = useState("")
 const [description, setDescription] = useState("")
 const [permissions, setPermissions] = useState("{}")

 useEffect(() => {
 fetch(`/api/roles/${params.id}`)
 .then((res) => res.json())
 .then((data) => {
 if (data?.error) { toast.error(data.error); return }
 setRole(data)
 setName(data.name || "")
 setDescription(data.description || "")
 setPermissions(JSON.stringify(typeof data.permissions === "string" ? JSON.parse(data.permissions) : data.permissions || {}, null, 2))
 })
 .finally(() => setLoading(false))
 }, [params.id])

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 let parsed: any
 try { parsed = JSON.parse(permissions) } catch { toast.error("Invalid JSON"); return }
 setSaving(true)
 try {
 const res = await fetch(`/api/roles/${params.id}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ ...(role?.isSystem ? {} : { name: name.trim() }), description: description.trim() || null, permissions: parsed })})
 if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to update") }
 toast.success("Role updated")
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Failed to update role")
 } finally { setSaving(false) }
 }

 async function handleDelete() {
 setDeleting(true)
 try {
 const res = await fetch(`/api/roles/${params.id}`, { method: "DELETE" })
 if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to delete") }
 toast.success("Role deleted")
 router.push("/settings/roles")
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Failed to delete role")
 } finally { setDeleting(false) }
 }

 if (loading) return <div className="animate-fade-in space-y-6"><SkeletonPageHeader /><SkeletonForm fields={3} /></div>
 if (!role) return <div className="text-muted-foreground text-sm p-6">Role not found</div>

 const parsedPermissions: Record<string, Record<string, boolean>> = (() => { try { return JSON.parse(permissions) } catch { return {} } })()

 return (
 <div className="animate-fade-in max-w-2xl pb-28">
 <div className="page-header flex items-center gap-4">
 <Button variant="ghost" size="icon" onClick={() => router.back()}></Button>
 <div><h1>{role.name}</h1><p>{role.isSystem ? "System role — some fields are locked" : "Edit role details and permissions"}</p></div>
 </div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader>
 <div className="flex items-center gap-2">
 <CardTitle>Role Details</CardTitle>
 {role.isSystem && <Badge variant="success" className="ml-auto">System</Badge>}
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="name">Name</Label>
 <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={role.isSystem} required />
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
 <Card>
 <CardHeader><CardTitle>Permission Summary</CardTitle></CardHeader>
 <CardContent>
 <div className="overflow-x-auto">
 <table className="w-full text-xs">
 <thead>
 <tr className="border-b border-border">
 <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">Entity</th>
 {ACTIONS.map((a) => <th key={a} className="text-center py-2 px-2 font-semibold text-muted-foreground uppercase">{a}</th>)}
 </tr>
 </thead>
 <tbody>
 {FALLBACK_ENTITIES.map((entity) => (
 <tr key={entity} className="border-b border-border/50 last:border-0">
 <td className="py-2 pr-4 font-medium capitalize">{entity.replace("_", " ")}</td>
 {ACTIONS.map((action) => {
 const checked = parsedPermissions[entity]?.[action] === true
 return (
 <td key={action} className="text-center py-2 px-2">
 <span className={`inline-flex items-center justify-center w-5 h-5 rounded ${checked ? "bg-success/15 text-success" : "bg-muted text-muted-foreground/50"}`}>
 {checked ? <Check className="w-3 h-3" /> : "—"}
 </span>
 </td>
 )
 })}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </CardContent>
 </Card>
 <div className="flex items-center justify-between">
 <div>
 {!role.isSystem && (
 confirmDelete ? (
 <div className="flex items-center gap-2">
 <span className="text-xs text-destructive">Are you sure?</span>
 <Button variant="destructive" size="sm" loading={deleting} onClick={handleDelete} className="gap-1"><CheckCircle className="w-4 h-4" /> Confirm</Button>
 <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}><XCircle className="w-4 h-4" /> Cancel</Button>
 </div>
 ) : (
 <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDelete(true)} className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10">
 Delete Role
 </Button>
 )
 )}
 </div>
 <div className="flex items-center gap-3">
 <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
 <Button loading={saving}><Save className="w-4 h-4" /> Save Changes</Button>
 </div>
 </div>
 </form>
 </div>
 )
}
