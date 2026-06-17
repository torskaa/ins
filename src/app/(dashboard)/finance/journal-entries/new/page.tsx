"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

type Line = { key: string; accountId: string; debit: string; credit: string; description: string }
type AccountOption = { id: string; code: string; name: string; type: string }

export default function NewJournalEntryPage() {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [accounts, setAccounts] = useState<AccountOption[]>([])
 const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), description: "", referenceType: "" })
 const [lines, setLines] = useState<Line[]>([createLine()])

 useEffect(() => {
 fetch("/api/finance/accounts").then(r => r.json()).then(d => { if (d.accounts) setAccounts(d.accounts) })
 }, [])

 function createLine(): Line { return { key: crypto.randomUUID(), accountId: "", debit: "0", credit: "0", description: "" } }

 const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0)
 const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0)
 const balanced = Math.abs(totalDebit - totalCredit) < 0.01

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!balanced) { toast.error("Debit and credit must balance"); return }
 if (lines.some(l => !l.accountId)) { toast.error("All lines need an account"); return }
 setLoading(true)
 try {
 const res = await fetch("/api/finance/journal-entries", {
 method: "POST", headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ date: form.date, description: form.description, referenceType: form.referenceType || undefined, lines: lines.map(l => ({ accountId: l.accountId, debit: parseFloat(l.debit) || 0, credit: parseFloat(l.credit) || 0, description: l.description })) }),
 })
 if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
 toast.success("Journal entry posted"); router.push("/finance/journal-entries"); router.refresh()
 } catch (e: any) { toast.error(e.message || "Failed") } finally { setLoading(false) }
 }

 return (
 <div className="animate-fade-in max-w-4xl">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">Back</button>
 <div className="page-header"><h1>New Journal Entry</h1><p>Create a general ledger entry with balanced debits and credits</p></div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card><CardHeader><CardTitle className="flex items-center gap-2">Entry Info</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
 <div className="space-y-2"><Label>Reference Type</Label><Select options={[{ value: "", label: "None" }, { value: "invoice", label: "Invoice" }, { value: "payment", label: "Payment" }, { value: "order", label: "Order" }, { value: "adjustment", label: "Adjustment" }]} value={form.referenceType} onChange={(e: any) => setForm({ ...form, referenceType: e.target.value })} /></div>
 </div>
 <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
 </CardContent>
 </Card>

 <Card><CardHeader className="flex flex-row items-center justify-between">
 <CardTitle>Journal Lines</CardTitle>
 <Button type="button" variant="secondary" size="sm" onClick={() => setLines([...lines, createLine()])} className="gap-1">Add Line</Button>
 </CardHeader>
 <CardContent className="space-y-2">
 <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium px-1 mb-1">
 <div className="col-span-5">Account</div>
 <div className="col-span-2 text-right">Debit</div>
 <div className="col-span-2 text-right">Credit</div>
 <div className="col-span-2">Description</div>
 <div className="col-span-1" />
 </div>
 {lines.map((line, i) => (
 <div key={line.key} className="grid grid-cols-12 gap-2 items-center">
 <div className="col-span-5">
 <Select options={accounts.map(a => ({ value: a.id, label: `${a.code} - ${a.name}` }))} value={line.accountId} onChange={(e: any) => setLines(lines.map(l => l.key === line.key ? { ...l, accountId: e.target.value } : l))} placeholder="Select account" />
 </div>
 <div className="col-span-2"><Input type="number" min="0" value={line.debit} onChange={(e) => setLines(lines.map(l => l.key === line.key ? { ...l, debit: e.target.value, credit: e.target.value !== "0" && l.credit === "0" ? "0" : l.credit } : l))} className="text-right" /></div>
 <div className="col-span-2"><Input type="number" min="0" value={line.credit} onChange={(e) => setLines(lines.map(l => l.key === line.key ? { ...l, credit: e.target.value, debit: e.target.value !== "0" && l.debit === "0" ? "0" : l.debit } : l))} className="text-right" /></div>
 <div className="col-span-2"><Input value={line.description} onChange={(e) => setLines(lines.map(l => l.key === line.key ? { ...l, description: e.target.value } : l))} placeholder="Note" /></div>
 <div className="col-span-1"><Button type="button" variant="ghost" size="icon" disabled={lines.length <= 1} onClick={() => setLines(lines.filter(l => l.key !== line.key))}></Button></div>
 </div>
 ))}
 <div className="grid grid-cols-12 gap-2 items-center pt-3 border-t border-border text-sm font-medium">
 <div className="col-span-5 text-right">Totals</div>
 <div className="col-span-2 text-right font-mono">{formatCurrency(totalDebit)}</div>
 <div className="col-span-2 text-right font-mono">{formatCurrency(totalCredit)}</div>
 <div className="col-span-3"><span className={balanced ? "text-emerald-600" : "text-red-600"}>{balanced ? "✓ Balanced" : `Diff: ${formatCurrency(Math.abs(totalDebit - totalCredit))}`}</span></div>
 </div>
 </CardContent>
 </Card>

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
 <Button type="submit" loading={loading} disabled={!balanced}>Post Entry</Button>
 </div>
 </form>
 </div>
 )
}
