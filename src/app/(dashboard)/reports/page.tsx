"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DataTable, type Column } from "@/components/ui/data-table"
import { formatCurrency, formatDate } from "@/lib/utils"
import { downloadCSV, downloadXLSX, downloadPDF, printReport } from "@/lib/export"
import { SkeletonChart, SkeletonTable } from "@/components/ui/skeleton"
import {
 AreaChart,
 Area,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 PieChart,
 Pie,
 Cell,
 Legend,
} from "recharts"
import { EmptyState } from "@/components/ui/empty-state"
import { Activity, AlertTriangle, BarChart3, Calendar, DollarSign, Download, FileText, Globe, Package, ShoppingCart, Tag, TrendingUp, Truck, Users } from "lucide-react"

type DashboardData = {
 totalRevenue: number
 totalProducts: number
 totalOrders: number
 totalCustomers: number
 lowStockProducts: number
 pendingOrders: number
 stockAlerts: { id: string; name: string; sku: string; stock: number; minStock: number }[]
 recentOrders: any[]
}

type Order = {
 id: string
 number: string
 status: string
 total: number
 orderDate: string
 type: string
 customer: { name: string } | null
 items: { id: string; quantity: number; unitPrice: number; product: { name: string; sku: string } }[]
}

type Product = {
 id: string
 name: string
 sku: string
 stock: number
 minStock: number
 unitPrice: number
 status: string
}

type TopProduct = {
 id: string
 name: string
 sku: string
 quantity: number
 revenue: number
}

type RevenuePoint = {
 date: string
 revenue: number
}

type StatusEntry = {
 name: string
 value: number
}

const DATE_PRESETS = [
 { value: "7d", label: "7 days" },
 { value: "30d", label: "30 days" },
 { value: "90d", label: "90 days" },
 { value: "custom", label: "Custom" },
] as const

const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#94a3b8"]

function formatChartDate(date: Date) {
 return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date)
}

function getDateRange(preset: string, customStart?: string, customEnd?: string) {
 const end = new Date()
 end.setHours(23, 59, 59, 999)
 let start: Date
 if (preset === "custom" && customStart && customEnd) {
 start = new Date(customStart)
 start.setHours(0, 0, 0, 0)
 const ce = new Date(customEnd)
 ce.setHours(23, 59, 59, 999)
 return { start, end: ce }
 }
 const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90
 start = new Date()
 start.setDate(start.getDate() - days)
 start.setHours(0, 0, 0, 0)
 return { start, end }
}

function isInRange(date: string | Date, rangeStart: Date, rangeEnd: Date) {
 const d = new Date(date)
 return d >= rangeStart && d <= rangeEnd
}

export default function ReportsPage() {
 const [preset, setPreset] = useState("30d")
 const [customStart, setCustomStart] = useState("")
 const [customEnd, setCustomEnd] = useState("")
 const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
 const [orders, setOrders] = useState<Order[]>([])
 const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
  setLoading(true)
  setError(null)
  try {
  const [dashRes, ordersRes, productsRes] = await Promise.all([
  fetch("/api/dashboard"),
  fetch("/api/orders?type=sales"),
  fetch("/api/products"),
  ])
  const raw = await Promise.all([
  dashRes.json(),
  ordersRes.json(),
  productsRes.json(),
  ])
  const dashJson = raw[0]
  const ordsJson = raw[1]
  const prodsJson = raw[2]
  if (!dashJson?.success) throw new Error(dashJson?.error || "Failed to load dashboard")
  if (!ordsJson?.success) throw new Error(ordsJson?.error || "Failed to load orders")
  if (!prodsJson?.success) throw new Error(prodsJson?.error || "Failed to load products")
  const dash: DashboardData = dashJson.data
  const ords = ordsJson.data
  const prods = prodsJson.data
  setDashboardData(dash)
  if (Array.isArray(ords)) setOrders(ords as Order[])
  if (Array.isArray(prods)) setProducts(prods as Product[])
  } catch (err) {
  setError((err as Error).message || "Failed to load data")
  } finally {
  setLoading(false)
  }
  }, [])

 useEffect(() => {
 fetchAll()
 }, [fetchAll])

 const { start, end } = getDateRange(preset, customStart, customEnd)

 const filteredOrders = useMemo(
 () => orders.filter((o) => isInRange(o.orderDate, start, end)),
 [orders, start, end],
 )

 const revenueTrend: RevenuePoint[] = useMemo(() => {
 const daily: Record<string, number> = {}
 filteredOrders
 .filter((o) => o.status === "delivered")
 .forEach((o) => {
 const day = formatChartDate(new Date(o.orderDate))
 daily[day] = (daily[day] || 0) + o.total
 })
 return Object.entries(daily)
 .map(([date, revenue]) => ({ date, revenue }))
 .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
 }, [filteredOrders])

 const orderStatusBreakdown: StatusEntry[] = useMemo(() => {
 const counts: Record<string, number> = {}
 filteredOrders.forEach((o) => {
 counts[o.status] = (counts[o.status] || 0) + 1
 })
 return Object.entries(counts).map(([name, value]) => ({ name, value }))
 }, [filteredOrders])

 const topProducts: TopProduct[] = useMemo(() => {
 const sales: Record<string, TopProduct> = {}
 let idx = 0
 filteredOrders
 .filter((o) => o.status === "delivered")
 .forEach((o) =>
 o.items?.forEach((item) => {
 const key = item.product?.name || "Unknown"
 if (!sales[key]) {
 sales[key] = {
 id: `prod-${idx++}`,
 name: key,
 sku: item.product?.sku || "",
 quantity: 0,
 revenue: 0,
 }
 }
 sales[key].quantity += item.quantity
 sales[key].revenue += item.quantity * item.unitPrice
 }),
 )
 return Object.values(sales)
 .sort((a, b) => b.revenue - a.revenue)
 .slice(0, 10)
 }, [filteredOrders])

 const lowStockProducts = useMemo(
 () =>
 products
 .filter((p) => p.stock <= p.minStock && p.status === "active")
 .sort((a, b) => a.stock - b.stock),
 [products],
 )

 const topColumns: Column<TopProduct>[] = [
 {
 key: "name",
 label: "Product",
 render: (p) => <span className="font-medium">{p.name}</span>,
 },
 {
 key: "sku",
 label: "SKU",
 render: (p) => <span className="font-mono text-xs text-muted-foreground">{p.sku}</span>,
 },
 {
 key: "quantity",
 label: "Units Sold",
 className: "text-right",
 cellClassName: "font-mono text-right",
 render: (p) => p.quantity.toLocaleString(),
 },
 {
 key: "revenue",
 label: "Revenue",
 className: "text-right",
 cellClassName: "font-mono text-right",
 render: (p) => formatCurrency(p.revenue),
 },
 ]

 function exportTopProducts() {
 downloadCSV(
 ["Product", "SKU", "Units Sold", "Revenue"],
 topProducts.map((p) => [p.name, p.sku, p.quantity, p.revenue]),
 "top-products.csv",
 )
 }

 function exportLowStock() {
 downloadCSV(
 ["Product", "SKU", "Stock", "Min Stock"],
 lowStockProducts.map((p) => [p.name, p.sku, p.stock, p.minStock]),
 "low-stock.csv",
 )
 }

 function exportRevenueTrend() {
 downloadCSV(
 ["Date", "Revenue"],
 revenueTrend.map((r) => [r.date, r.revenue]),
 "revenue-trend.csv",
 )
 }

 function exportOrdersReport() {
 downloadCSV(
 ["Order #", "Customer", "Status", "Total", "Date"],
 filteredOrders.map((o) => [o.number, o.customer?.name || "", o.status, o.total, o.orderDate]),
 "orders-report.csv",
 )
 }

 function handleExportPDF() {
 downloadPDF("Reports & Analytics", [
 { title: "Revenue Trend", headers: ["Date", "Revenue"], rows: revenueTrend.map((r) => [r.date, r.revenue]) },
 { title: "Order Status Breakdown", headers: ["Status", "Count"], rows: orderStatusBreakdown.map((s) => [s.name, s.value]) },
 { title: "Top Selling Products", headers: ["Product", "SKU", "Units Sold", "Revenue"], rows: topProducts.map((p) => [p.name, p.sku, p.quantity, p.revenue]) },
 ])
 }

 function handleExportXLSX() {
 downloadXLSX(
 ["Product", "SKU", "Units Sold", "Revenue"],
 topProducts.map((p) => [p.name, p.sku, p.quantity, p.revenue]),
 "top-products.xlsx",
 )
 }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Failed to load data"
        description={error}
        actions={[{ label: "Try again", onClick: () => window.location.reload() }]}
      />
    )
  }

  return (
  <div className="animate-fade-in">
  <div className="page-header flex items-center justify-between">
  <div>
  <h1>Reports & Analytics</h1>
  <p>Actionable insights for your business</p>
  </div>
 <div className="flex items-center gap-2">
 <Button variant="secondary" size="sm" onClick={handleExportXLSX}>
 Excel
 </Button>
 <Button variant="secondary" size="sm" onClick={handleExportPDF}>
 Export PDF
 </Button>
 <Button variant="outline" size="sm" onClick={() => printReport("Reports & Analytics")}>
 Print
 </Button>
 </div>
 </div>

 {/* Date Range Filter */}
 <div className="flex flex-wrap items-center gap-2 mb-6">
 <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
 {DATE_PRESETS.map((p) => (
 <Button
 key={p.value}
 variant={preset === p.value ? "default" : "secondary"}
 size="sm"
 onClick={() => setPreset(p.value)}
 >
 {p.label}
 </Button>
 ))}
 {preset === "custom" && (
 <div className="flex items-center gap-2 ml-1">
 <Input
 type="date"
 value={customStart}
 onChange={(e) => setCustomStart(e.target.value)}
 className="h-9 w-40"
 />
 <span className="text-muted-foreground text-sm">–</span>
 <Input
 type="date"
 value={customEnd}
 onChange={(e) => setCustomEnd(e.target.value)}
 className="h-9 w-40"
 />
 </div>
 )}
 </div>

 {/* KPI Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
 <Card>
 <CardContent className="p-5">
 <div className="flex items-center justify-between mb-3">
 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
 Total Revenue
 </span>
 </div>
 <span className="text-2xl font-semibold font-mono">
 {formatCurrency(dashboardData?.totalRevenue || 0)}
 </span>
 <p className="text-xs text-muted-foreground mt-1">Lifetime revenue</p>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="p-5">
 <div className="flex items-center justify-between mb-3">
 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
 Total Orders
 </span>
 </div>
 <span className="text-2xl font-semibold font-mono">
 {dashboardData?.totalOrders || 0}
 </span>
 <p className="text-xs text-muted-foreground mt-1">
 {dashboardData?.pendingOrders || 0} pending
 </p>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="p-5">
 <div className="flex items-center justify-between mb-3">
 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
 Products
 </span>
 </div>
 <span className="text-2xl font-semibold font-mono">
 {dashboardData?.totalProducts || 0}
 </span>
 <p className="text-xs text-muted-foreground mt-1">Active products</p>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="p-5">
 <div className="flex items-center justify-between mb-3">
 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
 Low Stock
 </span>
 <AlertTriangle className="w-4 h-4 text-destructive" />
 </div>
 <span className="text-2xl font-semibold font-mono">
 {dashboardData?.lowStockProducts || 0}
 </span>
 <p className="text-xs text-muted-foreground mt-1">Need reordering</p>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="p-5">
 <div className="flex items-center justify-between mb-3">
 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
 Customers
 </span>
 </div>
 <span className="text-2xl font-semibold font-mono">
 {dashboardData?.totalCustomers || 0}
 </span>
 <p className="text-xs text-muted-foreground mt-1">Active customers</p>
 </CardContent>
 </Card>
 </div>

 {/* Charts Row */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
 {/* Revenue Trend */}
 <Card className="lg:col-span-2">
 <CardHeader className="flex flex-row items-center justify-between space-y-0">
 <div>
 <CardTitle>Revenue Trend</CardTitle>
 <CardDescription>Daily revenue over the selected period</CardDescription>
 </div>
 <Button
 variant="ghost"
 size="iconSm"
 onClick={exportRevenueTrend}
 title="Export CSV"
 >
 </Button>
 </CardHeader>
 <CardContent>
 {loading ? (
 <SkeletonChart />
 ) : revenueTrend.length === 0 ? (
 <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
 No revenue data for this period
 </div>
 ) : (
 <ResponsiveContainer width="100%" height={280}>
 <AreaChart data={revenueTrend}>
 <defs>
 <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
 <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
 <XAxis
 dataKey="date"
 tick={{ fontSize: 11 }}
 stroke="hsl(var(--muted-foreground))"
 />
 <YAxis
 tick={{ fontSize: 11 }}
 stroke="hsl(var(--muted-foreground))"
 tickFormatter={(v: number) => `฿${(v / 1000).toFixed(0)}k`}
 />
 <Tooltip
 contentStyle={{
 backgroundColor: "hsl(var(--card))",
 border: "1px solid hsl(var(--border))",
 borderRadius: 8,
 fontSize: 13,
 }}
 formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
 />
 <Area
 type="monotone"
 dataKey="revenue"
 stroke="#22c55e"
 strokeWidth={2}
 fill="url(#revenueGradient)"
 />
 </AreaChart>
 </ResponsiveContainer>
 )}
 </CardContent>
 </Card>

 {/* Order Status Breakdown */}
 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0">
 <div>
 <CardTitle>Order Status</CardTitle>
 <CardDescription>Breakdown by status</CardDescription>
 </div>
 <Button
 variant="ghost"
 size="iconSm"
 onClick={exportOrdersReport}
 title="Export CSV"
 >
 </Button>
 </CardHeader>
 <CardContent>
 {loading ? (
 <SkeletonChart />
 ) : orderStatusBreakdown.length === 0 ? (
 <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
 No orders for this period
 </div>
 ) : (
 <ResponsiveContainer width="100%" height={280}>
 <PieChart>
 <Pie
 data={orderStatusBreakdown}
 cx="50%"
 cy="50%"
 innerRadius={60}
 outerRadius={90}
 paddingAngle={2}
 dataKey="value"
 >
 {orderStatusBreakdown.map((entry) => (
 <Cell
 key={entry.name}
 fill={PIE_COLORS[orderStatusBreakdown.indexOf(entry) % PIE_COLORS.length]}
 />
 ))}
 </Pie>
 <Tooltip
 contentStyle={{
 backgroundColor: "hsl(var(--card))",
 border: "1px solid hsl(var(--border))",
 borderRadius: 8,
 fontSize: 13,
 }}
 />
 <Legend
 verticalAlign="bottom"
 formatter={(value: string) => (
 <span className="text-xs capitalize">{value}</span>
 )}
 />
 </PieChart>
 </ResponsiveContainer>
 )}
 </CardContent>
 </Card>
 </div>

 {/* Top Selling Products */}
 <Card className="mb-8">
 <CardHeader className="flex flex-row items-center justify-between space-y-0">
 <div>
 <CardTitle>Top Selling Products</CardTitle>
 <CardDescription>Best performing products by revenue</CardDescription>
 </div>
 <Button variant="secondary" size="sm" onClick={exportTopProducts}>
 Export CSV
 </Button>
 </CardHeader>
 <CardContent>
 <DataTable
 columns={topColumns}
 data={topProducts}
 loading={loading}
 empty={{
 icons: [<BarChart3 className="w-5 h-5" />, <FileText className="w-5 h-5" />, <Activity className="w-5 h-5" />],
 title: "No sales data",
 description: "Delivered orders will appear here.",
 }}
 />
 </CardContent>
 </Card>

 {/* Low Stock Alerts */}
 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0">
 <div>
 <CardTitle>Low Stock Alerts</CardTitle>
 <CardDescription>Products that need to be reordered soon</CardDescription>
 </div>
 <Button variant="secondary" size="sm" onClick={exportLowStock}>
 Export CSV
 </Button>
 </CardHeader>
 <CardContent>
 {loading ? (
 <SkeletonTable rows={4} columns={3} />
 ) : lowStockProducts.length > 0 ? (
 <div className="space-y-2">
 {lowStockProducts.map((p) => (
 <div
 key={p.id}
 className="flex items-center justify-between p-3 rounded-lg bg-surface/50"
 >
 <div className="flex items-center gap-3">
 <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
 <div>
 <p className="text-sm font-medium">{p.name}</p>
 <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>
 </div>
 </div>
 <div className="text-right">
 <Badge variant="destructive" className="font-mono">
 {p.stock} left
 </Badge>
 <p className="text-xs text-muted-foreground mt-0.5">Min: {p.minStock}</p>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-8">
 <p className="text-sm text-muted-foreground">All stock levels are healthy</p>
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 )
}
