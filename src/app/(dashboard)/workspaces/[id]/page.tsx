"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge, BadgeDot, SemanticBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { AlertTriangle, Building2, Clock, Hash, Pencil, Trash2, Users, XCircle } from "lucide-react"
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

export default function WorkspaceSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [workspace, setWorkspace] = useState<any>(null)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [role, setRole] = useState("")
  const [memberCount, setMemberCount] = useState(0)

  useEffect(() => { params.then(({ id }) => setId(id)) }, [params])

  useEffect(() => {
    if (!id) return
    fetch(`/api/workspaces/${id}`)
      .then((r) => r.json())
      .then((ws) => {
        if (ws?.name) {
          setWorkspace(ws)
          setName(ws.name)
          setSlug(ws.slug)
          setRole(ws.role)
          setMemberCount(ws.memberCount ?? 0)
        } else {
          setWorkspace(null)
        }
      })
      .catch((err) => { setError(err.message); setLoading(false) })
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave() {
    if (!name.trim()) { toast.error("Name is required"); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setWorkspace(updated)
      setShowEdit(false)
      toast.success("Workspace updated")
      router.refresh()
    } catch { toast.error("Failed to update") }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/workspaces/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Workspace deleted")
      router.push("/workspaces")
      router.refresh()
    } catch { toast.error("Failed to delete") }
    finally { setDeleting(false) }
  }

  if (error) return (
    <div className="animate-fade-in pb-8 space-y-4">
      <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
    </div>
  )

  if (loading) return <SkeletonDetail cards={2} hasChart={false} />

  if (!workspace) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Workspace not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The workspace you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/workspaces")}>Back to Workspaces</Button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button onClick={() => router.push("/workspaces")}>Workspaces</button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 border border-border/60 rounded-lg bg-card p-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex gap-3 min-w-0 flex-1">
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{name}</h1>
                  <SemanticBadge semantic={slug} category="id" className="gap-1 font-mono text-[11px]"><Hash className="w-3 h-3" />{slug}</SemanticBadge>
                  <SemanticBadge semantic={role} category="status" className="gap-1 text-[11px]"><BadgeDot />{role}</SemanticBadge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {memberCount} member{memberCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <MoreMenu actions={[
                  ...(role === "owner" ? [{ label: "Edit", icon: <Pencil className="w-4 h-4" />, onClick: () => setShowEdit(true) }] : []),
                  ...(role === "owner" ? (["separator" as const, { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDelete(true) }] as const) : []),
                ]} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="w-4 h-4 text-primary" />
                Workspace Info
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Name" value={name} />
                <FieldDisplay label="Slug" value={slug} mono />
                <FieldDisplay label="Role" value={role} />
                <FieldDisplay label="Members" value={String(memberCount)} />
                <FieldDisplay label="Workspace ID" value={id} mono />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Users className="w-4 h-4 text-primary" />
                Overview
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5"><Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Slug</span><span className="text-sm font-medium ml-auto font-mono">{slug || "—"}</span></div>
                <div className="flex items-center gap-2.5"><BadgeDot className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Role</span><span className="text-sm font-medium ml-auto capitalize">{role || "—"}</span></div>
                <div className="flex items-center gap-2.5"><Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Members</span><span className="text-sm font-medium ml-auto">{memberCount}</span></div>
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
                <FieldDisplay label="Created" value="—" />
                <FieldDisplay label="Updated" value="—" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-lg flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>Edit Workspace</DialogTitle>
            <DialogDescription>Update details for <span className="font-medium text-foreground">{name}</span></DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="w-4 h-4 text-primary" />
                  Workspace Details
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <FieldGroup label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Workspace name" /></FieldGroup>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border/60">
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save Changes <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘↵</kbd></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workspace</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{name}</strong>? All data will be permanently lost.</DialogDescription>
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
