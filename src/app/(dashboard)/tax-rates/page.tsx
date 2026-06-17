"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"

type TaxRate = { id: string; name: string; rate: number; type: string; isDefault: boolean; isActive: boolean }

export default function TaxRatesPage() {
 const router = useRouter()
 const [rates, setRates] = useState<TaxRate[]>([])
 const [loading, setLoading] = useState(true)
 const handleNew = useCallback(() => router.push("/tax-rates/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/tax-rates").then(r => r.json()).then(d => { if (Array.isArray(d)) setRates(d) }).finally(() => setLoading(false))
 }, [])

 const columns: Column<TaxRate>[] = [
 { key: "name", label: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
 { key: "rate", label: "Rate", render: (r) => <span className="font-mono font-semibold">{r.rate}%</span> },
 { key: "type", label: "Type", render: (r) => <Badge variant="outline">{r.type === "vat" ? "VAT" : r.type === "withholding" ? "Withholding" : r.type}</Badge> },
 { key: "isDefault", label: "Default", render: (r) => r.isDefault ? <Badge className="bg-emerald-100 text-emerald-700 border-0">Default</Badge> : null },
 { key: "isActive", label: "Status", render: (r) => <Badge variant={r.isActive ? "default" : "secondary"}>{r.isActive ? "Active" : "Inactive"}</Badge> },
 ]

 return (
 <div className="animate-fade-in">
 <div className="page-header flex items-center justify-between">
 <div><h1>Tax Rates</h1><p>Manage VAT, withholding tax, and other tax rates</p></div>
 <div className="flex items-center gap-2">
 <Button variant="secondary" onClick={() => router.push("/tax-rates/reports")} className="gap-1.5">Tax Reports</Button>
 <Button onClick={handleNew} className="gap-1.5">New Tax Rate <ShortcutBadge shortcut="⌘C" /></Button>
 </div>
 </div>
 <DataTable columns={columns} data={rates} searchable searchPlaceholder="Search tax rates..." loading={loading}
 onRowClick={(item) => router.push(`/tax-rates/${item.id}/edit`)}
 empty={{ icons: [, , ], title: "No tax rates", description: "Add VAT and withholding tax rates." }}
 />
 </div>
 )
}
