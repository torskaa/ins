"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { SkeletonForm } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { AlertTriangle, BookOpen, XCircle } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

const ACCOUNT_TYPES = [
  { value: "asset", label: "Asset" }, { value: "liability", label: "Liability" },
  { value: "equity", label: "Equity" }, { value: "revenue", label: "Revenue" },
  { value: "expense", label: "Expense" }, { value: "contra_asset", label: "Contra Asset" },
  { value: "contra_liability", label: "Contra Liability" }, { value: "contra_equity", label: "Contra Equity" },
]

export default function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groups, setGroups] = useState<{ id: string; name: string; type: string }[]>([])
  const [form, setForm] = useState({ code: "", name: "", type: "asset", groupId: "", isActive: true })

  useEffect(() => {
    Promise.all([
      fetch(`/api/finance/accounts/${id}`).then(r => r.json()),
      fetch("/api/finance/accounts").then(r => r.json()),
    ]).then(([acc, d]) => {
      if (acc.error) { toast.error("Not found"); router.push("/finance/accounts"); return }
      setForm({ code: acc.code || "", name: acc.name || "", type: acc.type || "asset", groupId: acc.groupId || "", isActive: acc.isActive ?? true })
      if (d.groups) setGroups(d.groups)
    }).catch((err) => { setError(err.message); setFetching(false) }).finally(() => setFetching(false))
  }, [id, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code || !form.name) { toast.error("Code and name are required"); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/finance/accounts/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error()
      toast.success("Account updated"); router.push(`/finance/accounts/${id}`); router.refresh()
    } catch { toast.error("Failed to update") } finally { setSaving(false) }
  }

  if (error) return (
    <div className="animate-fade-in pb-8 space-y-4">
      <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
    </div>
  )
  if (fetching) return <SkeletonForm fields={5} />

  return (
    <div className="animate-fade-in pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">Back</button>
      <div className="page-header mb-5"><h1>Edit Account</h1><p>{form.code} - {form.name}</p></div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <h3 className="text-sm font-semibold">Account Details</h3>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field id="code" label="Code" required>
                    <Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                  </Field>
                  <Field id="name" label="Name" required>
                    <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field id="type" label="Type">
                    <Select id="type" options={ACCOUNT_TYPES} value={form.type} onChange={(e: any) => setForm({ ...form, type: e.target.value })} />
                  </Field>
                  <Field id="groupId" label="Group">
                    <Select id="groupId" options={groups.filter(g => g.type === form.type).map(g => ({ value: g.id, label: g.name }))} value={form.groupId} onChange={(e: any) => setForm({ ...form, groupId: e.target.value })} placeholder="Select group" />
                  </Field>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-border" />
                  <span className="text-sm">Active</span>
                </label>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-4 flex flex-col gap-4">
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" loading={saving}>Update Account</Button>
        </div>
      </form>
    </div>
  )
}
