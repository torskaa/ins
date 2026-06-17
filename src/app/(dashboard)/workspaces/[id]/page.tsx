"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { ArrowLeft, Building2, Save, Trash2, Hash, Users, Shield } from "lucide-react"

type FieldGroupProps = { label: string; children: React.ReactNode }
function FieldGroup({ label, children }: FieldGroupProps) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground font-medium mb-1">{label}</p>
      {children}
    </div>
  )
}

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
        setMemberCount(ws.memberCount ?? 0)
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
    <div className="animate-fade-in pb-8 space-y-4">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 -mx-6 -mt-6 px-6 pt-6 pb-3 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <h1 className="text-lg font-semibold">{name || "Workspace Settings"}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            {role === "owner" && (
              <Button variant="secondary" size="sm" className="gap-1.5 h-8 text-xs text-destructive hover:text-destructive" onClick={handleDelete}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Column — Form (8 cols) */}
        <div className="col-span-8 flex flex-col gap-4">
          <form onSubmit={handleSave}>
            <Card className="border-border/50">
              <CardHeader className="px-4 pt-4 pb-0">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Workspace Info
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs text-muted-foreground font-medium">Workspace Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Workspace name" required className="h-9 text-sm" />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" loading={saving} className="gap-1.5 h-9 text-xs"><Save className="w-3.5 h-3.5" /> Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Right Column — Details (4 cols) */}
        <div className="col-span-4 flex flex-col gap-4">
          <Card className="border-border/50">
            <CardHeader className="px-4 pt-4 pb-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <FieldGroup label="Slug">
                <p className="text-xs font-mono text-muted-foreground">{slug || "—"}</p>
              </FieldGroup>
              <FieldGroup label="Role">
                <p className="text-xs font-medium capitalize flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-muted-foreground" />{role || "—"}
                </p>
              </FieldGroup>
              <FieldGroup label="Members">
                <p className="text-xs font-medium flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-muted-foreground" />{memberCount}
                </p>
              </FieldGroup>
              <FieldGroup label="Workspace ID">
                <p className="text-xs font-mono text-muted-foreground">{id}</p>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
