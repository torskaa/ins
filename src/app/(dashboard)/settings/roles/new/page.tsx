"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Shield, XCircle } from "lucide-react"

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

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
    <div className="animate-fade-in pb-28">
      <div className="page-header flex items-center gap-4 mb-5">
        <Button variant="ghost" size="icon" onClick={() => router.back()}></Button>
        <div><h1>Create Role</h1><p>Define a new access control role</p></div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-semibold">Role Details</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Field id="name" label="Name" required>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Editor" required />
                </Field>
                <Field id="description" label="Description">
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the role's purpose" rows={3} />
                </Field>
                <Field id="permissions" label="Permissions (JSON)">
                  <Textarea id="permissions" value={permissions} onChange={(e) => setPermissions(e.target.value)} className="font-mono text-xs min-h-[200px]" rows={10} />
                </Field>
              </CardContent>
            </Card>
            <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
              <Button loading={loading}>Create Role</Button>
            </div>
          </div>
          <div className="col-span-4 flex flex-col gap-4" />
        </div>
      </form>
    </div>
  )
}
