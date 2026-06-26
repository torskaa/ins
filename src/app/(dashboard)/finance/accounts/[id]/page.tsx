"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge, BadgeDot, SemanticBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { AlertTriangle, Building2, Clock, DollarSign, FileText, Hash, Landmark, Layers, Pencil, Tag, Trash2, Wallet, XCircle } from "lucide-react"
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

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [account, setAccount] = useState<any>(null)
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
    fetch(`/api/finance/accounts/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json?.success && json.data) {
          const data = json.data
          setAccount(data)
          setForm({
            code: data.code,
            name: data.name,
            type: data.type,
            openingBalance: String(data.openingBalance || 0),
            isActive: data.isActive ?? true,
          })
        } else {
          toast.error(json?.error || "Account not found")
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

  if (!account) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Account not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The account you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/finance/accounts")}>Back to Accounts</Button>
      </div>
    )
  }

  async function handleSave() {
    try {
      const res = await fetch(`/api/finance/accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          openingBalance: parseFloat(form.openingBalance) || 0,
          isActive: form.isActive === true || form.isActive === "true",
        }),
      })
      if (!res.ok) throw new Error("Failed")
      const updated = await res.json()
      setAccount(updated)
      setShowEdit(false)
      toast.success("Account updated")
    } catch {
      toast.error("Failed to update account")
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/finance/accounts/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      toast.success("Account deleted")
      router.push("/finance/accounts")
      router.refresh()
    } catch {
      toast.error("Failed to delete account")
      setDeleting(false)
    }
  }

  const journalLineColumns = [
    { key: "entryNumber", label: "Entry", render: (item: any) => (
      <span className="font-mono text-xs font-medium">{item.entry?.number || "—"}</span>
    )},
    { key: "date", label: "Date", render: (item: any) => (
      <span className="text-muted-foreground text-sm">{item.entry?.date ? formatDate(new Date(item.entry.date)) : "—"}</span>
    )},
    { key: "description", label: "Description", render: (item: any) => <span className="text-muted-foreground">{item.description || "—"}</span> },
    { key: "debit", label: "Debit", render: (item: any) => <span className="font-mono">{item.debit > 0 ? formatCurrency(item.debit) : "—"}</span> },
    { key: "credit", label: "Credit", render: (item: any) => <span className="font-mono">{item.credit > 0 ? formatCurrency(item.credit) : "—"}</span> },
  ]

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button onClick={() => router.push("/finance/accounts")}>
                  <Landmark className="size-4" />
                  Accounts
                </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{account.code} - {account.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 border border-border/60 rounded-lg bg-card p-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{account.code} - {account.name}</h1>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <SemanticBadge semantic={account.isActive ? "active" : "inactive"} category="status" className="gap-1 text-[11px]"><BadgeDot />{account.isActive ? "Active" : "Inactive"}</SemanticBadge>
                <SemanticBadge semantic={account.code} category="id" className="gap-1 font-mono text-[11px]"><Hash className="w-3 h-3" />{account.code}</SemanticBadge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="capitalize">{account.type.replace("_", " ")} · {account.group?.name}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <MoreMenu actions={[
                  { label: "Edit", icon: <Pencil className="w-4 h-4" />, onClick: () => setShowEdit(true) },
                  "separator",
                  { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDelete(true) },
                ]} />
              </div>
              {account.updatedAt && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Updated {formatDate(new Date(account.updatedAt))}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Wallet className="w-4 h-4 text-primary" />
                Account Details
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Code" value={account.code} mono />
                <FieldDisplay label="Name" value={account.name} />
                <FieldDisplay label="Type" value={account.type.replace("_", " ")} />
                <FieldDisplay label="Group" value={account.group?.name || "—"} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <DollarSign className="w-4 h-4 text-primary" />
                Balance Overview
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className={`text-2xl font-semibold font-mono ${account.currentBalance >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatCurrency(account.currentBalance)}
                </span>
                <span className="text-xs text-muted-foreground">current balance</span>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground mt-3">
                <span>Opening: {formatCurrency(account.openingBalance)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Tag className="w-4 h-4 text-primary" />
                Classification
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5"><Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Type</span><span className="text-sm font-medium ml-auto capitalize">{account.type.replace("_", " ")}</span></div>
                <div className="flex items-center gap-2.5"><Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Group</span><span className="text-sm font-medium ml-auto">{account.group?.name || "—"}</span></div>
                <div className="flex items-center gap-2.5"><Layers className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Group Type</span><span className="text-sm font-medium ml-auto capitalize">{account.group?.type?.replace("_", " ") || "—"}</span></div>
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
                <FieldDisplay label="Created" value={account.createdAt ? formatDate(new Date(account.createdAt)) : "—"} />
                <FieldDisplay label="Updated" value={account.updatedAt ? formatDate(new Date(account.updatedAt)) : "—"} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full overflow-x-auto px-4">
            <TabsTrigger value="lines" className="gap-1.5"><FileText className="w-4 h-4" /> Journal Lines</TabsTrigger>
          </TabsList>

          <TabsContent value="lines" className="p-3">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <FileText className="w-4 h-4 text-primary" />
              Account Transactions
            </div>
            {(!account.journalLines || account.journalLines.length === 0) ? (
              <EmptyState
                icons={[<FileText key="jl1" className="w-6 h-6" />, <Wallet key="jl2" className="w-6 h-6" />]}
                title="No transactions"
                description="No journal entries recorded for this account"
                size="sm"
              />
            ) : (
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {journalLineColumns.map((col) => (
                        <TableHead key={col.key}>{col.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {account.journalLines.map((item: any) => (
                      <TableRow key={item.id}>
                        {journalLineColumns.map((col) => (
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
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-2xl flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>Update details for <span className="font-medium text-foreground">{account?.code} - {account?.name}</span></DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Wallet className="w-4 h-4 text-primary" />
                  Basic Information
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Code" required><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Name" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Type">
                    <Select options={[
                      { value: "asset", label: "Asset" },
                      { value: "liability", label: "Liability" },
                      { value: "equity", label: "Equity" },
                      { value: "revenue", label: "Revenue" },
                      { value: "expense", label: "Expense" },
                    ]} value={form.type} onChange={(e: any) => setForm({ ...form, type: e.target.value })} />
                  </FieldGroup>
                  <FieldGroup label="Opening Balance"><Input type="number" step="0.01" value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: e.target.value })} /></FieldGroup>
                </div>
                <FieldGroup label="Active">
                  <Select options={[
                    { value: "true", label: "Active" },
                    { value: "false", label: "Inactive" },
                  ]} value={String(form.isActive)} onChange={(e: any) => setForm({ ...form, isActive: e.target.value === "true" })} />
                </FieldGroup>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border/60">
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘↵</kbd></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{account.code} - {account.name}</strong>? This action cannot be undone.</DialogDescription>
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
