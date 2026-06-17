"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default function FinanceReportsPage() {
 const [reportType, setReportType] = useState("summary")
 const [data, setData] = useState<any>(null)
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 setLoading(true)
 fetch(`/api/finance/reports?type=${reportType}`).then(r => r.json()).then(setData).finally(() => setLoading(false))
 }, [reportType])

 if (loading) return <Skeleton className="h-96 w-full rounded-xl" />

 return (
 <div className="animate-fade-in">
 <div className="page-header"><h1>Financial Reports</h1><p>Balance Sheet, Profit & Loss, and Trial Balance</p></div>

 <Tabs value={reportType} onValueChange={setReportType} className="mb-6">
 <TabsList>
 <TabsTrigger value="summary">Summary</TabsTrigger>
 <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
 <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
 <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
 </TabsList>

 <TabsContent value="summary" className="mt-6 space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <Card><CardContent className="p-4"><p className="text-2xl font-semibold text-emerald-600">{formatCurrency(data?.totalRevenue || 0)}</p><p className="text-xs text-muted-foreground">Total Revenue</p></CardContent></Card>
 <Card><CardContent className="p-4"><p className="text-2xl font-semibold text-red-600">{formatCurrency(data?.totalExpenses || 0)}</p><p className="text-xs text-muted-foreground">Total Expenses</p></CardContent></Card>
 <Card><CardContent className="p-4"><p className={`text-2xl font-semibold ${(data?.netIncome || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(data?.netIncome || 0)}</p><p className="text-xs text-muted-foreground">Net Income</p></CardContent></Card>
 <Card><CardContent className="p-4"><p className="text-2xl font-semibold text-blue-600">{formatCurrency(data?.totalAssets || 0)}</p><p className="text-xs text-muted-foreground">Total Assets</p></CardContent></Card>
 </div>
 {(data?.revenueByMonth?.length > 0) && (
 <Card><CardHeader><CardTitle>Revenue vs Expenses</CardTitle></CardHeader>
 <CardContent>
 <table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground border-b border-border"><th className="pb-2 font-medium">Month</th><th className="pb-2 font-medium text-right">Revenue</th><th className="pb-2 font-medium text-right">Expenses</th></tr></thead>
 <tbody>{data.revenueByMonth.map((r: any, i: number) => {
 const exp = data.expenseByMonth?.find((e: any) => e.month === r.month)
 return <tr key={r.month} className="border-b border-border/50"><td className="py-2">{r.month}</td><td className="py-2 text-right font-mono text-emerald-600">{formatCurrency(r.amount)}</td><td className="py-2 text-right font-mono text-red-600">{formatCurrency(exp?.amount || 0)}</td></tr>
 })}</tbody></table>
 </CardContent>
 </Card>
 )}
 </TabsContent>

 <TabsContent value="balance-sheet" className="mt-6 space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <Card><CardContent className="p-4"><p className="text-2xl font-semibold text-blue-600">{formatCurrency(data?.totalAssets || 0)}</p><p className="text-xs text-muted-foreground">Total Assets</p></CardContent></Card>
 <Card><CardContent className="p-4"><p className="text-2xl font-semibold text-orange-600">{formatCurrency(data?.totalLiabilities || 0)}</p><p className="text-xs text-muted-foreground">Total Liabilities</p></CardContent></Card>
 <Card><CardContent className="p-4"><p className="text-2xl font-semibold text-purple-600">{formatCurrency(data?.totalEquity || 0)}</p><p className="text-xs text-muted-foreground">Total Equity</p></CardContent></Card>
 </div>
 {data?.assets?.length > 0 && (
 <Card><CardHeader><CardTitle>Assets</CardTitle></CardHeader>
 <CardContent><table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground border-b border-border"><th className="pb-2 font-medium">Account</th><th className="pb-2 font-medium text-right">Balance</th></tr></thead>
 <tbody>{data.assets.map((a: any) => <tr key={a.id} className="border-b border-border/50"><td className="py-2">{a.code} - {a.name}</td><td className="py-2 text-right font-mono">{formatCurrency(a.currentBalance)}</td></tr>)}</tbody></table></CardContent></Card>
 )}
 {data?.liabilities?.length > 0 && (
 <Card><CardHeader><CardTitle>Liabilities</CardTitle></CardHeader>
 <CardContent><table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground border-b border-border"><th className="pb-2 font-medium">Account</th><th className="pb-2 font-medium text-right">Balance</th></tr></thead>
 <tbody>{data.liabilities.map((a: any) => <tr key={a.id} className="border-b border-border/50"><td className="py-2">{a.code} - {a.name}</td><td className="py-2 text-right font-mono">{formatCurrency(a.currentBalance)}</td></tr>)}</tbody></table></CardContent></Card>
 )}
 </TabsContent>

 <TabsContent value="profit-loss" className="mt-6 space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <Card><CardContent className="p-4"><p className="text-2xl font-semibold text-emerald-600">{formatCurrency(data?.totalRevenue || 0)}</p><p className="text-xs text-muted-foreground">Total Revenue</p></CardContent></Card>
 <Card><CardContent className="p-4"><p className="text-2xl font-semibold text-red-600">{formatCurrency(data?.totalExpenses || 0)}</p><p className="text-xs text-muted-foreground">Total Expenses</p></CardContent></Card>
 <Card><CardContent className="p-4"><p className={`text-2xl font-semibold ${(data?.netIncome || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(data?.netIncome || 0)}</p><p className="text-xs text-muted-foreground">Net Income</p></CardContent></Card>
 </div>
 {data?.revenue?.length > 0 && (
 <Card><CardHeader><CardTitle>Revenue</CardTitle></CardHeader>
 <CardContent><table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground border-b border-border"><th className="pb-2 font-medium">Account</th><th className="pb-2 font-medium text-right">Amount</th></tr></thead>
 <tbody>{data.revenue.map((a: any) => <tr key={a.id} className="border-b border-border/50"><td className="py-2">{a.code} - {a.name}</td><td className="py-2 text-right font-mono">{formatCurrency(a.currentBalance)}</td></tr>)}</tbody></table></CardContent></Card>
 )}
 {data?.expenses?.length > 0 && (
 <Card><CardHeader><CardTitle>Expenses</CardTitle></CardHeader>
 <CardContent><table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground border-b border-border"><th className="pb-2 font-medium">Account</th><th className="pb-2 font-medium text-right">Amount</th></tr></thead>
 <tbody>{data.expenses.map((a: any) => <tr key={a.id} className="border-b border-border/50"><td className="py-2">{a.code} - {a.name}</td><td className="py-2 text-right font-mono">{formatCurrency(a.currentBalance)}</td></tr>)}</tbody></table></CardContent></Card>
 )}
 </TabsContent>

 <TabsContent value="trial-balance" className="mt-6">
 <Card><CardHeader><CardTitle>Trial Balance</CardTitle></CardHeader>
 <CardContent>
 <table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground border-b border-border"><th className="pb-2 font-medium">Account</th><th className="pb-2 font-medium">Type</th><th className="pb-2 font-medium text-right">Debit</th><th className="pb-2 font-medium text-right">Credit</th></tr></thead>
 <tbody>{data?.accounts?.map((a: any) => {
 const isDebit = a.currentBalance > 0
 return <tr key={a.id} className="border-b border-border/50"><td className="py-2">{a.code} - {a.name}</td><td className="py-2 capitalize text-muted-foreground">{a.type.replace("_", " ")}</td><td className="py-2 text-right font-mono">{isDebit ? formatCurrency(a.currentBalance) : "—"}</td><td className="py-2 text-right font-mono">{!isDebit ? formatCurrency(Math.abs(a.currentBalance)) : "—"}</td></tr>
 })}</tbody>
 <tfoot><tr className="font-medium"><td className="pt-3">Totals</td><td className="pt-3" /><td className="pt-3 text-right font-mono">{formatCurrency(data?.totalDebit || 0)}</td><td className="pt-3 text-right font-mono">{formatCurrency(data?.totalCredit || 0)}</td></tr></tfoot>
 </table>
 </CardContent>
 </Card>
 </TabsContent>
 </Tabs>
 </div>
 )
}
