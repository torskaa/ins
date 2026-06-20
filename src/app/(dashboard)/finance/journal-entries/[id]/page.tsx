"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge, BadgeDot, SemanticBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { AlertTriangle, Clock, DollarSign, FileText, Hash, Pencil, Trash2, XCircle, Banknote } from "lucide-react"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
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

export default function JournalEntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [entry, setEntry] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [tab, setTab] = useState("lines")
  const [form, setForm] = useState<any>({})
  const [id, setId] = useState<string>("")

  useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  useEffect(() => {
    if (!id) return
    fetch(`/api/finance/journal-entries/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json?.success && json.data) {
          const data = json.data
          setEntry(data)
          setForm({
            number: data.number,
            date: data.date?.split("T")[0] || "",
            description: data.description || "",
            status: data.status,
            referenceType: data.referenceType || "",
            referenceId: data.referenceId || "",
          })
        } else {
          toast.error(json?.error || "Entry not found")
        }
      })
      .catch((err) => { setError(err.message); setLoading(false) })
      .finally(() => setLoading(false))
  }, [id])

  if (error) return (
    <div className="animate-fade-in pb-8 space-y-4">
      <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
    </div>
  )
  if (loading) return <SkeletonDetail cards={3} hasChart={true} />

  if (!entry) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Journal Entry not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The journal entry you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/finance/journal-entries")}>Back to Journal Entries</Button>
      </div>
    )
  }

  const isBalanced = Math.abs(entry.totalDebit - entry.totalCredit) < 0.01

  async function handleSave() {
    try {
      const res = await fetch(`/api/finance/journal-entries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date: form.date ? new Date(form.date).toISOString() : null,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      const updated = await res.json()
      setEntry(updated)
      setShowEdit(false)
      toast.success("Journal entry updated")
    } catch {
      toast.error("Failed to update journal entry")
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/finance/journal-entries/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      toast.success("Journal entry deleted")
      router.push("/finance/journal-entries")
      router.refresh()
    } catch {
      toast.error("Failed to delete journal entry")
      setDeleting(false)
    }
  }

  const lineColumns = [
    { key: "account", label: "Account", render: (item: any) => (
      <div>
        <span className="font-medium">{item.account.code}</span>
        <span className="text-muted-foreground ml-1">{item.account.name}</span>
      </div>
    )},
    { key: "type", label: "Type", render: (item: any) => <span className="text-muted-foreground capitalize text-sm">{item.account.type.replace("_", " ")}</span> },
    { key: "debit", label: "Debit", render: (item: any) => <span className="font-mono">{item.debit > 0 ? formatCurrency(item.debit) : "—"}</span> },
    { key: "credit", label: "Credit", render: (item: any) => <span className="font-mono">{item.credit > 0 ? formatCurrency(item.credit) : "—"}</span> },
    { key: "description", label: "Description", render: (item: any) => <span className="text-muted-foreground text-sm">{item.description || "—"}</span> },
  ]

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button onClick={() => router.push("/finance/journal-entries")}>Journal Entries</button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Journal Entry #{entry.number}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 border border-border/60 rounded-lg bg-card p-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">Journal Entry #{entry.number}</h1>
                <SemanticBadge semantic={entry.status} category="status" className="gap-1 text-[11px]"><BadgeDot />{entry.status}</SemanticBadge>
                <SemanticBadge semantic={`#${entry.number}`} category="id" className="gap-1 font-mono text-[11px]"><Hash className="w-3 h-3" />#{entry.number}</SemanticBadge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{formatDate(new Date(entry.date))}{entry.referenceType ? ` · ${entry.referenceType}` : ""}</span>
              </div>
              {entry.description && <p className="text-sm text-muted-foreground">{entry.description}</p>}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <MoreMenu actions={[
                  { label: "Edit", icon: <Pencil className="w-4 h-4" />, onClick: () => setShowEdit(true) },
                  "separator",
                  { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDelete(true) },
                ]} />
              </div>
              {entry.updatedAt && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Updated {formatDate(new Date(entry.updatedAt))}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="w-4 h-4 text-primary" />
                Entry Details
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Entry Number" value={`#${entry.number}`} mono />
                <FieldDisplay label="Date" value={formatDate(new Date(entry.date))} />
                <FieldDisplay label="Reference Type" value={entry.referenceType || "—"} />
                <FieldDisplay label="Reference ID" value={entry.referenceId || "—"} mono />
                <FieldDisplay label="Status" value={entry.status} badge />
                {entry.description && (
                  <div className="col-span-2">
                    <p className="text-[11px] text-muted-foreground font-medium mb-0.5">Description</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{entry.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Banknote className="w-4 h-4 text-primary" />
                Totals
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium mb-0.5">Total Debit</p>
                  <p className="text-xl font-semibold font-mono">{formatCurrency(entry.totalDebit)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium mb-0.5">Total Credit</p>
                  <p className="text-xl font-semibold font-mono">{formatCurrency(entry.totalCredit)}</p>
                </div>
                {!isBalanced && (
                  <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2 border border-destructive/10">
                    Entry is not balanced
                  </div>
                )}
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
                <FieldDisplay label="Created" value={entry.createdAt ? formatDate(new Date(entry.createdAt)) : "—"} />
                <FieldDisplay label="Updated" value={entry.updatedAt ? formatDate(new Date(entry.updatedAt)) : "—"} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full overflow-x-auto px-4">
            <TabsTrigger value="lines" className="gap-1.5"><FileText className="w-4 h-4" /> Journal Lines ({entry.lines?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="lines" className="p-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <FileText className="w-4 h-4 text-primary" />
              Journal Lines
            </div>
            {(entry.lines || []).length === 0 ? (
              <EmptyState
                icons={[<FileText key="jl1" className="w-6 h-6" />, <Banknote key="jl2" className="w-6 h-6" />]}
                title="No lines"
                description="This journal entry has no lines"
                size="sm"
              />
            ) : (
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {lineColumns.map((col) => (
                        <TableHead key={col.key}>{col.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entry.lines.map((item: any) => (
                      <TableRow key={item.id}>
                        {lineColumns.map((col) => (
                          <TableCell key={col.key}>
                            {col.render ? col.render(item) : String(item[col.key] ?? "")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="border-t border-border px-5 py-3">
              <div className="flex justify-between text-sm font-medium">
                <span>Totals</span>
                <div className="flex gap-6">
                  <span className="font-mono">{formatCurrency(entry.totalDebit)}</span>
                  <span className="font-mono">{formatCurrency(entry.totalCredit)}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-2xl flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>Edit Journal Entry</DialogTitle>
            <DialogDescription>Update details for <span className="font-medium text-foreground">Journal Entry #{entry?.number}</span></DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <FileText className="w-4 h-4 text-primary" />
                  Basic Information
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Entry Number"><Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Reference Type"><Input value={form.referenceType} onChange={(e) => setForm({ ...form, referenceType: e.target.value })} placeholder="e.g. Invoice" /></FieldGroup>
                  <FieldGroup label="Reference ID"><Input value={form.referenceId} onChange={(e) => setForm({ ...form, referenceId: e.target.value })} /></FieldGroup>
                </div>
                <FieldGroup label="Status">
                  <Select options={[
                    { value: "draft", label: "Draft" },
                    { value: "posted", label: "Posted" },
                    { value: "cancelled", label: "Cancelled" },
                  ]} value={form.status} onChange={(e: any) => setForm({ ...form, status: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></FieldGroup>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border/60">
            <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes <ShortcutBadge shortcut="⌘↵" /></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Journal Entry</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>Journal Entry #{entry.number}</strong>? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowDelete(false)}><XCircle className="w-4 h-4" /> Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}><Trash2 className="w-4 h-4" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
