"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { formatCurrency, timeAgo } from "@/lib/utils"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "outline"> = {
 completed: "success",
 pending: "warning",
 processing: "default",
 cancelled: "destructive",
 shipped: "default",
}

export function RecentOrdersWidget({ compact }: { compact?: boolean }) {
 const [orders, setOrders] = useState<any[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 fetch("/api/dashboard")
 .then((r) => r.json())
 .then((d) => setOrders(d.recentOrders || []))
 .finally(() => setLoading(false))
 }, [])

 if (loading) return <Skeleton className="h-[260px] w-full rounded-xl" />

 return (
 <Card>
 <CardHeader className="pb-3">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
 </div>
 <CardTitle>Recent Orders</CardTitle>
 </div>
 </CardHeader>
 <CardContent className={compact ? "pb-3" : ""}>
 <div className="space-y-1">
 {orders.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-8 text-center">
 <p className="text-xs text-muted-foreground">No recent orders</p>
 </div>
 ) : (
 orders.slice(0, compact ? 4 : 5).map((o: any) => (
 <div
 key={o.id}
 className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface transition-colors"
 >
 <div className="min-w-0 flex-1">
 <p className="text-sm font-medium truncate">{o.number}</p>
 <p className="text-xs text-muted-foreground truncate">
 {o.customer?.name || "N/A"} · {o.items?.length || 0} items
 </p>
 </div>
 <div className="text-right shrink-0 ml-3">
 <p className="text-sm font-mono font-medium">{formatCurrency(o.total)}</p>
 <div className="flex items-center gap-1.5 justify-end">
 <Badge variant={statusVariant[o.status] || "outline"} className="text-[10px] px-1.5 py-0">
 {o.status}
 </Badge>
 <span className="text-[10px] text-muted-foreground">{timeAgo(new Date(o.createdAt))}</span>
 </div>
 </div>
 </div>
 ))
 )}
 </div>
 {orders.length > 0 && (
 <div className="mt-3 pt-3 border-t border-border">
 <Button variant="ghost" size="sm" className="w-full text-xs h-8" asChild>
 <Link href="/orders">View All</Link>
 </Button>
 </div>
 )}
 </CardContent>
 </Card>
 )
}
