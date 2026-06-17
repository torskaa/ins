"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { Plus, BookOpen, DollarSign, FileText } from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"

type JournalEntry = { id: string; number: string; date: string; description: string; totalDebit: number; totalCredit: number; status: string; referenceType: string; lines: { account: { name: string } }[] }

export default function JournalEntriesPage() {
 const router = useRouter()
 const [entries, setEntries] = useState<JournalEntry[]>([])
 const [loading, setLoading] = useState(true)
 const handleNew = useCallback(() => router.push("/finance/journal-entries/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/finance/journal-entries").then(r => r.json()).then(d => { if (d.entries) setEntries(d.entries) }).finally(() => setLoading(false))
 }, [])

 const columns: Column<JournalEntry>[] = [
 { key: "number", label: "Number", cellClassName: "font-mono text-xs w-28" },
 { key: "date", label: "Date", render: (e) => <span className="text-sm">{formatDate(new Date(e.date))}</span> },
 { key: "description", label: "Description", render: (e) => <span className="text-sm truncate max-w-[200px] block">{e.description || "—"}</span> },
 { key: "referenceType", label: "Reference", render: (e) => e.referenceType ? <Badge variant="outline" className="text-xs">{e.referenceType}</Badge> : <span className="text-muted-foreground">—</span> },
 { key: "totalDebit", label: "Debit", render: (e) => <span className="font-mono text-sm">{formatCurrency(e.totalDebit)}</span> },
 { key: "totalCredit", label: "Credit", render: (e) => <span className="font-mono text-sm">{formatCurrency(e.totalCredit)}</span> },
 { key: "status", label: "Status", render: (e) => <Badge variant={e.status === "posted" ? "default" : "secondary"}>{e.status}</Badge> },
 ]

 return (
 <div className="animate-fade-in">
 <div className="page-header flex items-center justify-between">
 <div><h1>Journal Entries</h1><p>Record and manage general ledger entries</p></div>
 <Button onClick={handleNew} className="gap-1.5"><Plus className="w-4 h-4" /> New Entry <ShortcutBadge shortcut="⌘C" /></Button>
 </div>
 <DataTable columns={columns} data={entries} searchable searchPlaceholder="Search entries..." loading={loading}
 onRowClick={(item) => router.push(`/finance/journal-entries/${item.id}`)}
 empty={{ icons: [, , ], title: "No journal entries yet", description: "Create your first journal entry." }}
 />
 </div>
 )
}
