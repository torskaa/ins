"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Layers, XCircle } from "lucide-react"

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

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
    <div className="animate-fade-in pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5">Back</button>
      <div className="page-header mb-5"><h1>New Account Group</h1><p>Add a group to organize GL accounts</p></div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span className="text-sm font-semibold">Group Details</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field id="code" label="Code" required>
                    <Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="1000" />
                  </Field>
                  <Field id="name" label="Name" required>
                    <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Current Assets" />
                  </Field>
                </div>
                <Field id="type" label="Type">
                  <Select id="type" options={GROUP_TYPES} value={form.type} onChange={(e: any) => setForm({ ...form, type: e.target.value })} />
                </Field>
                <Field id="description" label="Description">
                  <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
                </Field>
              </CardContent>
            </Card>
            <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
              <Button type="submit" loading={loading}>Create Group</Button>
            </div>
          </div>
          <div className="col-span-4 flex flex-col gap-4" />
        </div>
      </form>
    </div>
  )
}
