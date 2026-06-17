"use client"

import { useEffect, useMemo, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { generateSalesByCategory } from "@/components/dashboard/mock-data"
import { formatCurrency } from "@/lib/utils"
import { PieChart as PieChartIcon } from "lucide-react"

export function SalesCategoryWidget({ compact }: { compact?: boolean }) {
 const [data, setData] = useState<any[]>([])

 useEffect(() => {
 setData(generateSalesByCategory())
 }, [])

 const total = useMemo(() => data.reduce((s, d) => s + d.revenue, 0), [data])

 return (
 <Card>
 <CardHeader className="pb-3">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
 <PieChartIcon className="w-3.5 h-3.5 text-blue-500" />
 </div>
 <CardTitle>Sales by Category</CardTitle>
 </div>
 </CardHeader>
 <CardContent>
 <div className="flex items-center gap-4">
 <div className="h-[140px] w-[140px] shrink-0">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={data}
 cx="50%"
 cy="50%"
 innerRadius={36}
 outerRadius={60}
 paddingAngle={3}
 dataKey="revenue"
 >
 {data.map((entry, i) => (
 <Cell key={entry.name} fill={entry.color} />
 ))}
 </Pie>
 <Tooltip
 contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
 formatter={(value) => formatCurrency(Number(value))}
 />
 </PieChart>
 </ResponsiveContainer>
 </div>
 <div className="flex-1 space-y-1.5">
 {data.map((d) => (
 <div key={d.name} className="flex items-center justify-between text-xs">
 <div className="flex items-center gap-1.5 min-w-0 flex-1">
 <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
 <span className="truncate">{d.name}</span>
 </div>
 <span className="font-mono font-medium ml-2">{d.percentage}%</span>
 </div>
 ))}
 <div className="pt-1.5 mt-1.5 border-t border-border flex justify-between text-xs font-medium">
 <span>Total</span>
 <span className="font-mono">{formatCurrency(total)}</span>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 )
}
