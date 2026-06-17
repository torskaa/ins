"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { 
 AlertTriangle, Package, ShoppingCart, Truck, TrendingUp, 
 AlertCircle, CheckCircle2, Clock, DollarSign, ArrowRight,
 Layers3, FileText, BarChart3
} from "lucide-react"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { SkeletonCard } from "@/components/ui/skeleton"

type DashboardData = {
 lowStock: { id: string; name: string; sku: string; stock: number; minStock: number }[]
 pendingOrders: { id: string; number: string; type: string; status: string; total: number }[]
 pendingApprovals: { entity: string; count: number; link: string }[]
 recentTransactions: { id: string; description: string; amount: number; date: string }[]
 supplierAlerts: { id: string; name: string; issue: string }[]
 metrics: {
 totalProducts: number
 totalOrders: number
 revenueMonth: number
 lowStockCount: number
 pendingOrderCount: number
 pendingApprovalCount: number
 }
}

export function ActionCenter() {
 const [data, setData] = useState<DashboardData | null>(null)
 const [loading, setLoading] = useState(true)
 const router = useRouter()

 useEffect(() => {
 fetch("/api/dashboard/actions")
 .then((r) => r.json())
 .then(setData)
 .finally(() => setLoading(false))
 }, [])

 if (loading) {
 return (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
 </div>
 )
 }

 if (!data) return null

 const { lowStock = [], pendingOrders = [], pendingApprovals = [], supplierAlerts = [], metrics = { totalProducts: 0, totalOrders: 0, revenueMonth: 0, lowStockCount: 0, pendingOrderCount: 0, pendingApprovalCount: 0 } } = data
 const hasIssues = lowStock.length > 0 || pendingOrders.length > 0 || pendingApprovals.length > 0 || supplierAlerts.length > 0

 return (
 <div className="space-y-6">
 {hasIssues && (
 <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
 <AlertCircle className="w-4 h-4 text-warning shrink-0" />
 <span className="text-foreground">
 <strong>{metrics.lowStockCount}</strong> low stock · <strong>{metrics.pendingOrderCount}</strong> pending orders · <strong>{metrics.pendingApprovalCount}</strong> pending approvals
 </span>
 </div>
 )}

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm flex items-center gap-2">
 Low Stock ({lowStock.length})
 </CardTitle>
 </CardHeader>
 <CardContent>
 {lowStock.length > 0 ? (
 <div className="space-y-2">
 {lowStock.slice(0, 5).map((p) => (
 <button
 key={p.id}
 onClick={() => router.push(`/inventory/${p.id}`)}
 className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface/50 text-left text-sm transition-colors"
 >
 <div>
 <p className="font-medium">{p.name}</p>
 <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
 </div>
 <div className="text-right">
 <p className="font-mono text-destructive">{p.stock}</p>
 <p className="text-xs text-muted-foreground">min: {p.minStock}</p>
 </div>
 </button>
 ))}
 </div>
 ) : (
 <p className="text-sm text-muted-foreground py-4 text-center">All stock levels are healthy</p>
 )}
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm flex items-center gap-2">
 Pending Orders ({pendingOrders.length})
 </CardTitle>
 </CardHeader>
 <CardContent>
 {pendingOrders.length > 0 ? (
 <div className="space-y-2">
 {pendingOrders.slice(0, 5).map((o) => (
 <button
 key={o.id}
 onClick={() => router.push(`/orders/${o.id}`)}
 className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface/50 text-left text-sm transition-colors"
 >
 <div>
 <p className="font-medium">{o.number}</p>
 <Badge variant="secondary" className="text-xs">{o.status}</Badge>
 </div>
 <span className="font-mono text-xs">{formatCurrency(o.total)}</span>
 </button>
 ))}
 </div>
 ) : (
 <p className="text-sm text-muted-foreground py-4 text-center">No pending orders</p>
 )}
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm flex items-center gap-2">
 Pending Approvals ({pendingApprovals.reduce((s, a) => s + a.count, 0)})
 </CardTitle>
 </CardHeader>
 <CardContent>
 {pendingApprovals.length > 0 ? (
 <div className="space-y-2">
 {pendingApprovals.map((a) => (
 <button
 key={a.entity}
 onClick={() => router.push(a.link)}
 className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface/50 text-sm transition-colors"
 >
 <span className="font-medium capitalize">{a.entity}</span>
 <div className="flex items-center gap-2">
 <Badge>{a.count}</Badge>
 </div>
 </button>
 ))}
 </div>
 ) : (
 <p className="text-sm text-muted-foreground py-4 text-center">All clear — nothing pending</p>
 )}
 </CardContent>
 </Card>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {supplierAlerts.length > 0 && (
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm flex items-center gap-2">
 Supplier Alerts
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-2">
 {supplierAlerts.map((s) => (
 <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-surface/50 text-sm">
 <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
 <span><strong>{s.name}</strong> — {s.issue}</span>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 )}

 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm flex items-center gap-2">
 Quick Actions
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-2 gap-2">
 <Button variant="secondary" size="sm" onClick={() => router.push("/inventory/new")} className="justify-start gap-1.5 text-xs">
 Add Product
 </Button>
 <Button variant="secondary" size="sm" onClick={() => router.push("/orders/new")} className="justify-start gap-1.5 text-xs">
 New Order
 </Button>
 <Button variant="secondary" size="sm" onClick={() => router.push("/bom/new")} className="justify-start gap-1.5 text-xs">
 New BOM
 </Button>
 <Button variant="secondary" size="sm" onClick={() => router.push("/suppliers/new")} className="justify-start gap-1.5 text-xs">
 Add Supplier
 </Button>
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm flex items-center gap-2">
 Metrics
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <p className="text-xs text-muted-foreground">Products</p>
 <p className="text-xl font-semibold font-mono">{formatNumber(metrics.totalProducts)}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground">Orders</p>
 <p className="text-xl font-semibold font-mono">{formatNumber(metrics.totalOrders)}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground">30d Revenue</p>
 <p className="text-xl font-semibold font-mono">{formatCurrency(metrics.revenueMonth)}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground">Low Stock</p>
 <p className="text-xl font-semibold font-mono text-destructive">{metrics.lowStockCount}</p>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 )
}
