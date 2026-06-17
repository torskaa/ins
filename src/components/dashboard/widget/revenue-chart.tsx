"use client"

import { useEffect, useState } from "react"
import {
 AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { generateMonthlyRevenue } from "@/components/dashboard/mock-data"
import { SkeletonChart } from "@/components/ui/skeleton"

type RangeKey = "7d" | "30d" | "90d" | "all"
const RANGES: { key: RangeKey; label: string }[] = [
 { key: "7d", label: "7d" },
 { key: "30d", label: "30d" },
 { key: "90d", label: "90d" },
 { key: "all", label: "All" },
]

export function RevenueChart({ compact }: { compact?: boolean }) {
 const [range, setRange] = useState<RangeKey>("all")
 const [data, setData] = useState<any[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 fetch("/api/dashboard")
 .then((r) => r.json())
 .then((d) => {
 if (d.monthlyRevenue?.length) {
 setData(d.monthlyRevenue)
 } else {
 setData(generateMonthlyRevenue())
 }
 })
 .catch(() => setData(generateMonthlyRevenue()))
 .finally(() => setLoading(false))
 }, [])

 const filtered = range === "all" ? data : data.slice(-{ "7d": 7, "30d": 3, "90d": 6 }[range] || data.length)

 if (loading) return <SkeletonChart />

 return (
 <Card>
 <CardHeader className="pb-0">
 <div className="flex items-center justify-between">
 <CardTitle>Revenue Trends</CardTitle>
 <div className="flex gap-1">
 {RANGES.map((r) => (
 <Button
 key={r.key}
 variant={range === r.key ? "default" : "ghost"}
 size="sm"
 className="h-7 px-2 text-xs"
 onClick={() => setRange(r.key)}
 >
 {r.label}
 </Button>
 ))}
 </div>
 </div>
 </CardHeader>
 <CardContent>
 <div className="h-[260px] mt-2">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={filtered} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
 <defs>
 <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
 <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
 </linearGradient>
 <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
 <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
 <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
 <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
 <Tooltip
 contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
 formatter={(value) => formatCurrency(Number(value))}
 />
 <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
 <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revenueGrad)" name="Revenue" />
 <Area type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" fill="none" name="Cost" />
 <Area type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} fill="url(#profitGrad)" name="Profit" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </CardContent>
 </Card>
 )
}
