"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/utils"
import {
 TrendingUp, TrendingDown, Minus, Package, Save,
 BarChart3, AlertCircle, Calendar
} from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { SkeletonKPICard, SkeletonChart } from "@/components/ui/skeleton"
import {
 AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
 ResponsiveContainer, Legend
} from "recharts"
import { toast } from "sonner"
import { downloadCSV, downloadPDF } from "@/lib/export"

interface Product {
 id: string
 name: string
 sku: string
 unitPrice: number
 stock: number
}

interface ForecastPoint {
 week: string
 demand?: number
 predicted?: number
}

interface ForecastData {
 product: Product
 history: { week: string; demand: number }[]
 forecast: { week: string; predicted: number }[]
 avgWeekly: number
 trend: number
 nextMonthDemand: number
}



export default function ForecastPage() {
 const [products, setProducts] = useState<Product[]>([])
 const [productId, setProductId] = useState("")
 const [period, setPeriod] = useState("30")
 const [data, setData] = useState<ForecastData | null>(null)
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState("")
 const [saving, setSaving] = useState(false)
 const [notes, setNotes] = useState("")

 useEffect(() => {
 fetch("/api/products")
 .then((r) => r.json())
 .then((data) => { if (Array.isArray(data)) setProducts(data) })
 .catch(() => {})
 }, [])

 const loadForecast = useCallback(async () => {
 if (!productId) return
 setLoading(true)
 setError("")
 try {
 const res = await fetch(`/api/forecast?productId=${productId}&period=${period}`)
 if (!res.ok) throw new Error("Failed to load forecast")
 const json = await res.json()
 setData(json)
 } catch (e) {
 setError((e as Error).message)
 setData(null)
 } finally {
 setLoading(false)
 }
 }, [productId, period])

 useEffect(() => {
 loadForecast()
 }, [loadForecast])

 const chartData = data
 ? [
 ...data.history.map((h) => ({ week: h.week, demand: h.demand, predicted: null })),
 ...data.forecast.map((f) => ({ week: f.week, demand: null, predicted: f.predicted })),
 ]
 : []

 const tableData = data
 ? data.history.map((h) => {
 const fc = data.forecast.find((f) => f.week === h.week)
 const variance = fc ? h.demand - fc.predicted : null
 const variancePct = fc && fc.predicted ? ((h.demand - fc.predicted) / fc.predicted) * 100 : null
 return { week: h.week, actual: h.demand, forecast: fc?.predicted ?? null, variance, variancePct }
 })
 : []

 const handleSave = async () => {
 if (!data) return
 setSaving(true)
 try {
 const res = await fetch("/api/forecast", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ productId, period, notes, forecast: data.forecast }),
 })
 if (!res.ok) throw new Error("Failed to save forecast")
 toast.success("Forecast saved successfully")
 } catch (e) {
 toast.error((e as Error).message)
 } finally {
 setSaving(false)
 }
 }

 const trendBadge = () => {
 if (!data) return null
 if (data.trend > 0)
 return <Badge variant="success">Growing</Badge>
 if (data.trend < 0)
 return <Badge variant="destructive"><TrendingDown className="w-3 h-3 mr-1" />Declining</Badge>
 return <Badge variant="warning"><Minus className="w-3 h-3 mr-1" />Stable</Badge>
 }

 const CustomTooltip = ({ active, payload, label }: any) => {
 if (!active || !payload?.length) return null
 return (
 <div className="rounded-lg border border-border bg-card p-3 shadow-sm text-xs">
 <p className="font-medium mb-1">{label}</p>
 {payload.map((entry: any, idx: number) => (
 <p key={idx} style={{ color: entry.color }}>
 {entry.name}: {entry.value != null ? entry.value.toLocaleString() : "—"}
 </p>
 ))}
 </div>
 )
 }

 return (
 <div className="animate-fade-in">
 <div className="page-header flex items-center justify-between">
 <div>
 <h1>Forecasting</h1>
 <p>Demand prediction and trend analysis</p>
 </div>
 <MoreMenu actions={[
 { label: "Import", icon: ActionIcons.AddNew },
 "separator",
 { label: "Export CSV", icon: ActionIcons.ExportCSV, onClick: () => downloadCSV(["Week", "Forecast"], tableData.map((d: any) => [d.week, d.forecast]), "forecast.csv") },
 { label: "Export PDF", icon: ActionIcons.ExportPDF, onClick: () => downloadPDF("Forecast", []) },
 "separator",
 { label: "Refresh Forecast", icon: ActionIcons.Refresh },
 ]} />
 </div>

 <div className="flex flex-wrap items-end gap-4 mb-8">
 <div className="space-y-1.5">
 <Label htmlFor="product">Product</Label>
 <Select
 id="product"
 value={productId}
 onChange={(e) => setProductId(e.target.value)}
 options={[
 ...products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` })),
 ]}
 placeholder="Select a product"
 className="w-64"
 />
 </div>
 <div className="space-y-1.5">
 <Label htmlFor="period">Period</Label>
 <Select
 id="period"
 value={period}
 onChange={(e) => setPeriod(e.target.value)}
 options={[
 { value: "7", label: "7 days" },
 { value: "30", label: "30 days" },
 { value: "90", label: "90 days" },
 ]}
 className="w-36"
 />
 </div>
 </div>

 {!productId && (
 <EmptyState
 icons={[, , <Calendar className="w-5 h-5" />]}
 title="Select a product"
 description="Choose a product above to view its demand forecast and trends."
 />
 )}

 {error && (
 <Card className="mb-8 border-destructive/30">
 <CardContent className="p-5 flex items-center gap-3">
 <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
 <p className="text-sm text-destructive">{error}</p>
 <Button variant="outline" size="sm" onClick={loadForecast} className="ml-auto">
 Retry
 </Button>
 </CardContent>
 </Card>
 )}

 {loading && productId && (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
 <SkeletonKPICard />
 <SkeletonKPICard />
 <SkeletonKPICard />
 <SkeletonKPICard />
 </div>
 )}

 {loading && <SkeletonChart className="mb-8" />}

 {data && !loading && (
 <>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
 <Card>
 <CardContent className="p-5">
 <div className="flex items-center justify-between mb-3">
 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
 Avg Weekly Demand
 </span>
 </div>
 <span className="text-2xl font-semibold font-mono">
 {data.avgWeekly.toLocaleString(undefined, { maximumFractionDigits: 1 })}
 </span>
 <p className="text-xs text-muted-foreground mt-1">Units per week</p>
 </CardContent>
 </Card>

 <Card>
 <CardContent className="p-5">
 <div className="flex items-center justify-between mb-3">
 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
 Next {period} Days Forecast
 </span>
 <Calendar className="w-4 h-4 text-info" />
 </div>
 <span className="text-2xl font-semibold font-mono">
 {data.nextMonthDemand.toLocaleString(undefined, { maximumFractionDigits: 0 })}
 </span>
 <p className="text-xs text-muted-foreground mt-1">Predicted demand</p>
 </CardContent>
 </Card>

 <Card>
 <CardContent className="p-5">
 <div className="flex items-center justify-between mb-3">
 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
 Trend
 </span>
 </div>
 <div className="mb-1">{trendBadge()}</div>
 <p className="text-xs text-muted-foreground mt-1">
 {data.trend > 0 ? `${(data.trend * 100).toFixed(1)}% increase` :
 data.trend < 0 ? `${(Math.abs(data.trend) * 100).toFixed(1)}% decline` :
 "No significant change"}
 </p>
 </CardContent>
 </Card>

 <Card>
 <CardContent className="p-5">
 <div className="flex items-center justify-between mb-3">
 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
 Current Stock
 </span>
 </div>
 <span className="text-2xl font-semibold font-mono">
 {data.product.stock.toLocaleString()}
 </span>
 <div className="flex items-center gap-2 mt-1">
 <Badge variant={data.product.stock > data.avgWeekly ? "success" : "destructive"}>
 {data.product.stock > data.avgWeekly ? "Sufficient" : "Low"}
 </Badge>
 <p className="text-xs text-muted-foreground">vs {data.avgWeekly.toFixed(0)}/wk avg</p>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card className="mb-8">
 <CardHeader>
 <CardTitle>Demand vs Forecast</CardTitle>
 <CardDescription>
 Historical demand and predicted demand for {data.product.name}
 </CardDescription>
 </CardHeader>
 <CardContent>
 <ResponsiveContainer width="100%" height={350}>
 <AreaChart data={chartData}>
 <defs>
 <linearGradient id="demandGradient" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
 <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
 </linearGradient>
 <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
 <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
 <XAxis dataKey="week" className="text-xs text-muted-foreground" tickLine={false} />
 <YAxis className="text-xs text-muted-foreground" tickLine={false} />
 <Tooltip content={<CustomTooltip />} />
 <Legend />
 <Area
 type="monotone"
 dataKey="demand"
 name="Actual Demand"
 stroke="hsl(var(--primary))"
 fill="url(#demandGradient)"
 strokeWidth={2}
 connectNulls
 dot={{ r: 3 }}
 activeDot={{ r: 5 }}
 />
 <Area
 type="monotone"
 dataKey="predicted"
 name="Forecast"
 stroke="#f59e0b"
 fill="url(#forecastGradient)"
 strokeWidth={2}
 strokeDasharray="6 3"
 connectNulls
 dot={{ r: 3 }}
 activeDot={{ r: 5 }}
 />
 </AreaChart>
 </ResponsiveContainer>
 </CardContent>
 </Card>

 <Card className="mb-8">
 <CardHeader>
 <CardTitle>Weekly Data</CardTitle>
 <CardDescription>Historical demand and forecast comparison</CardDescription>
 </CardHeader>
 <CardContent>
 {tableData.length > 0 ? (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-border">
 <th className="text-left py-3 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">Week</th>
 <th className="text-right py-3 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actual Demand</th>
 <th className="text-right py-3 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">Forecast</th>
 <th className="text-right py-3 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">Variance</th>
 <th className="text-right py-3 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">Variance %</th>
 </tr>
 </thead>
 <tbody>
 {tableData.map((row) => (
 <tr key={row.week} className="border-b border-border/50 last:border-0 hover:bg-surface/40 transition-colors">
 <td className="py-3 px-2 font-medium">{row.week}</td>
 <td className="py-3 px-2 text-right font-mono">{row.actual.toLocaleString()}</td>
 <td className="py-3 px-2 text-right font-mono">
 {row.forecast != null ? row.forecast.toLocaleString() : "—"}
 </td>
 <td className={`py-3 px-2 text-right font-mono ${
 row.variance != null
 ? row.variance > 0
 ? "text-success"
 : row.variance < 0
 ? "text-destructive"
 : ""
 : ""
 }`}>
 {row.variance != null
 ? `${row.variance > 0 ? "+" : ""}${row.variance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
 : "—"}
 </td>
 <td className={`py-3 px-2 text-right font-mono ${
 row.variancePct != null
 ? row.variancePct > 0
 ? "text-success"
 : row.variancePct < 0
 ? "text-destructive"
 : ""
 : ""
 }`}>
 {row.variancePct != null
 ? `${row.variancePct > 0 ? "+" : ""}${row.variancePct.toFixed(1)}%`
 : "—"}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 ) : (
 <p className="text-sm text-muted-foreground text-center py-8">
 No historical data available for comparison.
 </p>
 )}
 </CardContent>
 </Card>

 <Card>
 <CardHeader>
 <CardTitle>Forecast Controls</CardTitle>
 <CardDescription>Save the current forecast for reporting</CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-1.5">
 <Label htmlFor="notes">Notes</Label>
 <Textarea
 id="notes"
 placeholder="Add notes about this forecast..."
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 rows={3}
 />
 </div>
 <Button onClick={handleSave} loading={saving}>
 Save Forecast
 </Button>
 </CardContent>
 </Card>
 </>
 )}
 </div>
 )
}
