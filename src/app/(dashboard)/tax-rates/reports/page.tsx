"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { SemanticBadge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { AlertTriangle } from "lucide-react"

export default function TaxReportsPage() {
 const [period, setPeriod] = useState("monthly")
 const [year, setYear] = useState(String(new Date().getFullYear()))
 const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"))
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

 useEffect(() => {
 setLoading(true)
   fetch(`/api/tax-rates/reports?period=${period}&year=${year}&month=${month}`).then(r => r.json()).then((json) => { if (json?.success) setData(json.data); else throw new Error(json?.error || "Failed to load") }).catch((err) => { setError(err.message); setLoading(false) }).finally(() => setLoading(false))
 }, [period, year, month])

  if (error) return (
    <div className="animate-fade-in pb-8 space-y-4">
      <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
    </div>
  )

  return (
  <div className="animate-fade-in">
  <div className="page-header"><h1>Tax Reports</h1><p>VAT and withholding tax reports</p></div>

 <div className="flex items-center gap-4 mb-6">
 <Select options={[{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly" }]} value={period} onChange={(e: any) => setPeriod(e.target.value)} className="w-32" />
 <Select options={Array.from({ length: 5 }, (_, i) => ({ value: String(new Date().getFullYear() - i), label: String(new Date().getFullYear() - i) }))} value={year} onChange={(e: any) => setYear(e.target.value)} className="w-24" />
 {period === "monthly" && <Select options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1).padStart(2, "0"), label: new Date(2000, i).toLocaleString("en", { month: "long" }) }))} value={month} onChange={(e: any) => setMonth(e.target.value)} className="w-36" />}
 </div>

 {loading ? <Skeleton className="h-64 w-full rounded-xl" /> : (
 <div className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <Card><CardContent className="p-4"><p className="text-2xl font-semibold">{formatCurrency(data?.totalSales || 0)}</p><p className="text-xs text-muted-foreground">Total Sales (excl. VAT)</p></CardContent></Card>
 <Card><CardContent className="p-4"><p className="text-2xl font-semibold text-success">{formatCurrency(data?.totalVat || 0)}</p><p className="text-xs text-muted-foreground">VAT Collected</p></CardContent></Card>
 <Card><CardContent className="p-4"><p className="text-2xl font-semibold">{data?.totalInvoices || 0}</p><p className="text-xs text-muted-foreground">Total Invoices</p></CardContent></Card>
 </div>

 <Card><CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
 <CardContent>
 <table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground border-b border-border"><th className="pb-2 font-medium">Invoice</th><th className="pb-2 font-medium">Customer</th><th className="pb-2 font-medium">Date</th><th className="pb-2 font-medium text-right">Subtotal</th><th className="pb-2 font-medium text-right">VAT</th><th className="pb-2 font-medium text-right">Total</th><th className="pb-2 font-medium">Status</th></tr></thead>
 <tbody>{data?.invoices?.map((inv: any) => (
 <tr key={inv.id || inv.number} className="border-b border-border/50"><td className="py-2 font-mono text-xs">{inv.number}</td><td className="py-2">{inv.customer?.name || "—"}</td><td className="py-2 text-muted-foreground">{formatDate(new Date(inv.createdAt))}</td><td className="py-2 text-right font-mono">{formatCurrency(inv.subtotal)}</td><td className="py-2 text-right font-mono">{formatCurrency(inv.tax)}</td><td className="py-2 text-right font-mono font-medium">{formatCurrency(inv.total)}</td><td className="py-2"><SemanticBadge semantic={inv.status} category="status">{inv.status}</SemanticBadge></td></tr>
 ))}</tbody></table>
 </CardContent>
 </Card>
 </div>
 )}
 </div>
 )
}
