"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Trash2 } from "lucide-react"

type JournalEntry = { id: string; number: string; date: string; description: string; totalDebit: number; totalCredit: number; status: string; referenceType: string; referenceId: string; lines: { id: string; debit: number; credit: number; description: string; account: { code: string; name: string; type: string; group: { name: string } } }[] }

export default function JournalEntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const router = useRouter()
 const { id } = use(params)
 const [entry, setEntry] = useState<JournalEntry | null>(null)
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 fetch(`/api/finance/journal-entries/${id}`).then(r => r.json()).then(d => { if (d && !d.error) setEntry(d); else toast.error("Entry not found") }).finally(() => setLoading(false))
 }, [id])

 if (loading) return <Skeleton className="h-64 w-full rounded-xl" />
 if (!entry) return <div className="animate-fade-in"><p>Entry not found</p><Button variant="secondary" onClick={() => router.push("/finance/journal-entries")}>Back</Button></div>

 return (
 <div className="animate-fade-in">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">Back</button>
 <div className="page-header flex items-start justify-between">
 <div>
 <div className="flex items-center gap-2"><h1>Journal Entry #{entry.number}</h1><Badge>{entry.status}</Badge></div>
 <p className="text-muted-foreground text-sm">{formatDate(new Date(entry.date))}{entry.referenceType ? ` · ${entry.referenceType}` : ""}</p>
 </div>
 <Button variant="ghost" size="sm" onClick={() => { if (window.confirm("Delete this entry?")) fetch(`/api/finance/journal-entries/${id}`, { method: "DELETE" }).then(() => { toast.success("Deleted"); router.push("/finance/journal-entries") }).catch(() => toast.error("Failed")) }} className="gap-1.5 text-destructive"><Trash2 className="w-4 h-4" /> Delete</Button>
 </div>
 {entry.description && <p className="mb-6 text-sm">{entry.description}</p>}

 <Card><CardHeader><CardTitle>Journal Lines</CardTitle></CardHeader>
 <CardContent>
 <table className="w-full text-sm">
 <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="pb-2 font-medium">Account</th><th className="pb-2 font-medium">Type</th><th className="pb-2 font-medium text-right">Debit</th><th className="pb-2 font-medium text-right">Credit</th><th className="pb-2 font-medium">Description</th></tr></thead>
 <tbody>{entry.lines.map(line => (
 <tr key={line.id} className="border-b border-border/50"><td className="py-2.5"><span className="font-medium">{line.account.code}</span> {line.account.name}</td><td className="py-2.5 text-muted-foreground capitalize">{line.account.type.replace("_", " ")}</td><td className="py-2.5 text-right font-mono">{line.debit > 0 ? formatCurrency(line.debit) : "—"}</td><td className="py-2.5 text-right font-mono">{line.credit > 0 ? formatCurrency(line.credit) : "—"}</td><td className="py-2.5 text-muted-foreground">{line.description || "—"}</td></tr>
 ))}</tbody>
 <tfoot><tr className="font-medium text-sm"><td className="pt-3">Totals</td><td className="pt-3" /><td className="pt-3 text-right font-mono">{formatCurrency(entry.totalDebit)}</td><td className="pt-3 text-right font-mono">{formatCurrency(entry.totalCredit)}</td><td className="pt-3" /></tr></tfoot>
 </table>
 </CardContent>
 </Card>
 </div>
 )
}
