"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge, BadgeDot, SemanticBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { AlertTriangle, Check, CheckCircle, Clock, Hash, Pencil, Shield, Trash2, Users, XCircle } from "lucide-react"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { SkeletonDetail } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { MoreMenu } from "@/components/ui/more-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"

const FALLBACK_ENTITIES = ["products", "orders", "invoices", "bom", "materials", "customers", "suppliers", "categories", "warehouses", "quotations", "payments", "accounts", "journal", "tax", "projects", "tasks", "workflows", "roles", "apiKeys", "auditLogs", "users", "settings"]
const ACTIONS = ["create", "read", "update", "delete"] as const

function FieldDisplay({ label, value, mono, badge }: { label: string; value: string; mono?: boolean; badge?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground font-medium mb-0.5 truncate">{label}</p>
      {badge ? (
        <SemanticBadge semantic={value} category="status">{value}</SemanticBadge>
      ) : (
        <p className={cn("text-sm truncate", mono ? "font-mono" : "font-medium")}>{value || "—"}</p>
      )}
    </div>
  )
}

function FieldGroup({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="min-w-0 space-y-1">
      <Label className="text-[11px] text-muted-foreground font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

export default function EditRolePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [role, setRole] = useState<any>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [permissions, setPermissions] = useState("{}")

  useEffect(() => {
    fetch(`/api/roles/${params.id}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json?.success) { toast.error(json?.error || "Failed to load"); return }
        setRole(json.data)
        setName(json.data.name || "")
        setDescription(json.data.description || "")
        setPermissions(JSON.stringify(typeof json.data.permissions === "string" ? JSON.parse(json.data.permissions) : json.data.permissions || {}, null, 2))
      })
      .catch((err) => { setError(err.message); setLoading(false) })
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleSave() {
    let parsed: any
    try { parsed = JSON.parse(permissions) } catch { toast.error("Invalid JSON"); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/roles/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(role?.isSystem ? {} : { name: name.trim() }), description: description.trim() || null, permissions: parsed }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to update") }
      const updated = await res.json()
      setRole(updated)
      setShowEdit(false)
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

  if (error) return (
    <div className="animate-fade-in pb-8 space-y-4">
      <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
    </div>
  )
  if (loading) return <SkeletonDetail cards={2} hasChart={false} />

  if (!role) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Role not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The role you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/settings/roles")}>Back to Roles</Button>
      </div>
    )
  }

  const displayPermissions: Record<string, Record<string, boolean>> = (() => {
    try {
      if (typeof role.permissions === "string") return JSON.parse(role.permissions)
      return role.permissions || {}
    } catch { return {} }
  })()

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button onClick={() => router.push("/settings/roles")}>Roles</button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{role.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 border border-border/60 rounded-lg bg-card p-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex gap-3 min-w-0 flex-1">
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{role.name}</h1>
                  {role.isSystem && (
                    <SemanticBadge semantic="system" category="status" className="gap-1 text-[11px]"><BadgeDot />System</SemanticBadge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{role.isSystem ? "System role — some fields are locked" : "Edit role details and permissions"}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {!role.isSystem && (
                  <MoreMenu actions={[
                    { label: "Edit", icon: <Pencil className="w-4 h-4" />, onClick: () => setShowEdit(true) },
                    "separator",
                    { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDelete(true) },
                  ]} />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Shield className="w-4 h-4 text-primary" />
                Role Details
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Name" value={role.name} />
                <FieldDisplay label="Description" value={role.description || "—"} />
                <FieldDisplay label="System Role" value={role.isSystem ? "Yes" : "No"} badge />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle className="w-4 h-4 text-primary" />
                Permission Summary
              </div>
            </CardHeader>
            <CardContent className="p-4">
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
                          const checked = displayPermissions[entity]?.[action] === true
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
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Shield className="w-4 h-4 text-primary" />
                Overview
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5"><Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Role ID</span><span className="text-sm font-medium ml-auto font-mono">{params.id}</span></div>
                <div className="flex items-center gap-2.5"><BadgeDot className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">System</span><span className="text-sm font-medium ml-auto">{role.isSystem ? "Yes" : "No"}</span></div>
                <div className="flex items-center gap-2.5"><Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Description</span><span className="text-sm font-medium ml-auto truncate">{role.description || "—"}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="w-4 h-4 text-primary" />
                Metadata
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Created" value={role.createdAt ? new Date(role.createdAt).toLocaleDateString() : "—"} />
                <FieldDisplay label="Updated" value={role.updatedAt ? new Date(role.updatedAt).toLocaleDateString() : "—"} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-2xl flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update details for <span className="font-medium text-foreground">{role?.name}</span></DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Shield className="w-4 h-4 text-primary" />
                  Basic Information
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <FieldGroup label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} disabled={role?.isSystem} /></FieldGroup>
                <FieldGroup label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the role's purpose" rows={3} /></FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Permissions
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground font-medium">Permissions (JSON)</Label>
                  <Textarea value={permissions} onChange={(e) => setPermissions(e.target.value)} className="font-mono text-xs min-h-[200px]" rows={10} />
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border/60">
            <Button variant="outline" onClick={() => setShowEdit(false)}><XCircle className="w-4 h-4" /> Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save Changes <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘↵</kbd></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{role.name}</strong>? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}><XCircle className="w-4 h-4" /> Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}><Trash2 className="w-4 h-4" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
