"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Package } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

export function LowStockWidget({ compact }: { compact?: boolean }) {
 const [alerts, setAlerts] = useState<any[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 fetch("/api/dashboard")
 .then((r) => r.json())
 .then((d) => setAlerts(d.stockAlerts || []))
 .finally(() => setLoading(false))
 }, [])

 if (loading) return <Skeleton className="h-[260px] w-full rounded-xl" />

 return (
 <Card>
 <CardHeader className="pb-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center">
 <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
 </div>
 <CardTitle>Low Stock Alerts</CardTitle>
 </div>
 {alerts.length > 0 && <Badge variant="destructive">{alerts.length}</Badge>}
 </div>
 </CardHeader>
 <CardContent className={compact ? "pb-3" : ""}>
 <div className="space-y-1">
 {alerts.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-8 text-center">
 <p className="text-xs text-muted-foreground">All stock levels are healthy</p>
 </div>
 ) : (
 alerts.slice(0, compact ? 4 : 6).map((p: any) => (
 <div
 key={p.id}
 className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface transition-colors"
 >
 <div className="min-w-0 flex-1">
 <p className="text-sm font-medium truncate">{p.name}</p>
 <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>
 </div>
 <Badge variant="destructive" className="font-mono shrink-0 ml-3">
 {p.stock} left
 </Badge>
 </div>
 ))
 )}
 </div>
 {alerts.length > 0 && (
 <div className="mt-3 pt-3 border-t border-border">
 <Button variant="ghost" size="sm" className="w-full text-xs h-8" asChild>
 <Link href="/inventory?lowStock=true">View All</Link>
 </Button>
 </div>
 )}
 </CardContent>
 </Card>
 )
}
