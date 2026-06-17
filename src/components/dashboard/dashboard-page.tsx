"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, ShoppingCart, Users, TrendingUp, AlertTriangle, ArrowUpRight, DollarSign } from "lucide-react"
import { formatCurrency, formatDate, timeAgo } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SkeletonKPICard } from "@/components/ui/skeleton"

type DashboardData = {
 totalProducts: number
 lowStockProducts: number
 totalOrders: number
 pendingOrders: number
 totalCustomers: number
 totalRevenue: number
 recentOrders: any[]
 stockAlerts: any[]
}

export function DashboardPage() {
 const [data, setData] = useState<DashboardData | null>(null)
 const [loading, setLoading] = useState(true)
 const router = useRouter()

 useEffect(() => {
 fetch("/api/dashboard")
 .then((res) => res.json())
 .then(setData)
 .finally(() => setLoading(false))
 }, [])

 if (loading) {
 return (
 <div className="animate-fade-in">
 <div className="page-header">
 <h1>Dashboard</h1>
 <p>Overview of your inventory and business performance</p>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
 {[...Array(4)].map((_, i) => <SkeletonKPICard key={i} />)}
 </div>
 </div>
 )
 }

 const metrics = [
 {
 title: "Total Products",
 value: data?.totalProducts || 0,
 icon: Package,
 href: "/inventory",
 color: "text-primary",
 },
 {
 title: "Low Stock Items",
 value: data?.lowStockProducts || 0,
 icon: AlertTriangle,
 href: "/inventory?lowStock=true",
 color: "text-warning",
 },
 {
 title: "Pending Orders",
 value: data?.pendingOrders || 0,
 icon: ShoppingCart,
 href: "/orders",
 color: "text-info",
 },
 {
 title: "Total Revenue",
 value: formatCurrency(data?.totalRevenue || 0),
 icon: DollarSign,
 href: "/reports",
 color: "text-success",
 },
 ]

 return (
 <div className="animate-fade-in">
 <div className="page-header">
 <h1>Dashboard</h1>
 <p>Overview of your inventory and business performance</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
 {metrics.map((metric) => {
 const Icon = metric.icon
 return (
 <Link key={metric.title} href={metric.href}>
 <Card className="cursor-pointer card-hover">
 <CardContent className="p-5">
 <div className="flex items-center justify-between mb-3">
 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
 {metric.title}
 </span>
 <Icon className={`w-4 h-4 ${metric.color}`} />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-semibold tracking-tight font-mono">
 {typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}
 </span>
 <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
 </div>
 </CardContent>
 </Card>
 </Link>
 )
 })}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
 <Card className="lg:col-span-2">
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle>Recent Orders</CardTitle>
 <Button variant="ghost" size="sm" asChild>
 <Link href="/orders">View All</Link>
 </Button>
 </div>
 </CardHeader>
 <CardContent>
 <div className="space-y-3">
 {data?.recentOrders?.map((order: any) => (
 <div
 key={order.id}
 className="flex items-center justify-between p-3 rounded-lg hover:bg-surface transition-colors cursor-pointer"
 onClick={() => router.push(`/orders/${order.id}`)}
 >
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
 </div>
 <div>
 <p className="text-sm font-medium">{order.number}</p>
 <p className="text-xs text-muted-foreground">
 {order.customer?.name || "N/A"} · {order.items?.length || 0} items
 </p>
 </div>
 </div>
 <div className="text-right">
 <p className="text-sm font-mono font-medium">{formatCurrency(order.total)}</p>
 <p className="text-xs text-muted-foreground">{timeAgo(new Date(order.createdAt))}</p>
 </div>
 </div>
 ))}
 {(!data?.recentOrders || data.recentOrders.length === 0) && (
 <p className="text-sm text-muted-foreground text-center py-8">No recent orders</p>
 )}
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle>Stock Alerts</CardTitle>
 <Badge variant="destructive">{data?.stockAlerts?.length || 0} items</Badge>
 </div>
 </CardHeader>
 <CardContent>
 <div className="space-y-3">
 {data?.stockAlerts?.map((product: any) => (
 <div
 key={product.id}
 className="flex items-center justify-between p-3 rounded-lg hover:bg-surface transition-colors cursor-pointer"
 onClick={() => router.push(`/inventory/${product.id}`)}
 >
 <div>
 <p className="text-sm font-medium">{product.name}</p>
 <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
 </div>
 <div className="text-right">
 <Badge variant="destructive" className="font-mono">
 {product.stock} left
 </Badge>
 </div>
 </div>
 ))}
 {(!data?.stockAlerts || data.stockAlerts.length === 0) && (
 <div className="text-center py-8">
 <p className="text-sm text-muted-foreground">All stock levels are healthy</p>
 </div>
 )}
 </div>
 </CardContent>
 </Card>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
 <Card className="lg:col-span-1">
 <CardHeader>
 <CardTitle>Quick Actions</CardTitle>
 </CardHeader>
 <CardContent className="space-y-2">
 <Button variant="secondary" className="w-full justify-start" asChild>
 <Link href="/inventory/new">
 Add Product
 </Link>
 </Button>
 <Button variant="secondary" className="w-full justify-start" asChild>
 <Link href="/orders/new">
 New Order
 </Link>
 </Button>
 <Button variant="secondary" className="w-full justify-start" asChild>
 <Link href="/crm/new">
 Add Customer
 </Link>
 </Button>
 <Button variant="secondary" className="w-full justify-start" asChild>
 <Link href="/quotations/new">
 Create Quotation
 </Link>
 </Button>
 </CardContent>
 </Card>
 </div>
 </div>
 )
}
