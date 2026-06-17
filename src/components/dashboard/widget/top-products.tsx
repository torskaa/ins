"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { generateTopProducts } from "@/components/dashboard/mock-data"
import { Trophy } from "lucide-react"

export function TopProductsWidget({ compact }: { compact?: boolean }) {
 const [products, setProducts] = useState<any[]>([])

 useEffect(() => {
 fetch("/api/dashboard")
 .then((r) => r.json())
 .then((d) => {
 if (d.topProducts?.length) setProducts(d.topProducts)
 else setProducts(generateTopProducts())
 })
 .catch(() => setProducts(generateTopProducts()))
 }, [])

 return (
 <Card>
 <CardHeader className="pb-3">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
 <Trophy className="w-3.5 h-3.5 text-amber-500" />
 </div>
 <CardTitle>Top Products</CardTitle>
 </div>
 </CardHeader>
 <CardContent>
 {/* Bar chart */}
 <div className="h-[120px] mb-3">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={products} layout="vertical" margin={{ top: 0, right: 0, left: 80, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
 <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
 <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} axisLine={false} tickLine={false} />
 <Tooltip
 contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
 formatter={(value) => formatCurrency(Number(value))}
 />
 <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 {/* Product list */}
 <div className="space-y-1">
 {products.slice(0, compact ? 3 : 5).map((p: any, i: number) => (
 <div key={p.sku} className="flex items-center justify-between py-1.5">
 <div className="flex items-center gap-2 min-w-0 flex-1">
 <span className="text-xs text-muted-foreground font-mono w-4">{i + 1}</span>
 <p className="text-sm truncate">{p.name}</p>
 <Badge variant="outline" className="text-[10px] font-mono">{p.sku}</Badge>
 </div>
 <div className="text-right shrink-0 ml-3">
 <p className="text-sm font-mono font-medium">{formatCurrency(p.revenue)}</p>
 <p className="text-xs text-muted-foreground">{p.quantity} sold</p>
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 )
}
