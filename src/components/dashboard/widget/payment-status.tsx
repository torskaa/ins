"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { generatePaymentStatus } from "@/components/dashboard/mock-data"
import { CreditCard } from "lucide-react"

const STATUS_CONFIG = {
 paid: { label: "Paid", color: "bg-emerald-500", textColor: "text-emerald-600", bg: "bg-emerald-50" },
 pending: { label: "Pending", color: "bg-amber-500", textColor: "text-amber-600", bg: "bg-amber-50" },
 overdue: { label: "Overdue", color: "bg-red-500", textColor: "text-red-600", bg: "bg-red-50" },
 cancelled: { label: "Cancelled", color: "bg-slate-400", textColor: "text-slate-500", bg: "bg-slate-50" },
} as const

export function PaymentStatusWidget({ compact }: { compact?: boolean }) {
 const [data, setData] = useState<ReturnType<typeof generatePaymentStatus> | null>(null)

 useEffect(() => {
 setData(generatePaymentStatus())
 }, [])

 const items = useMemo(() => {
 if (!data) return []
 return (Object.entries(STATUS_CONFIG) as [keyof typeof data, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(
 ([key, cfg]) => ({
 key,
 ...cfg,
 value: data[key],
 }),
 )
 }, [data])

 const total = useMemo(() => items.reduce((s, i) => s + i.value, 0), [items])

 if (!data) return null

 return (
 <Card>
 <CardHeader className="pb-3">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
 </div>
 <CardTitle>Payment Status</CardTitle>
 </div>
 </CardHeader>
 <CardContent>
 {/* Stacked bar */}
 <div className="h-5 rounded-full overflow-hidden flex mb-4">
 {items.map((i) => (
 <div
 key={i.key}
 className={i.color + " transition-all duration-500"}
 style={{ width: `${(i.value / total) * 100}%` }}
 />
 ))}
 </div>
 <div className="grid grid-cols-2 gap-2">
 {items.map((i) => (
 <div key={i.key} className={`${i.bg} rounded-lg p-2.5`}>
 <p className="text-[11px] text-muted-foreground">{i.label}</p>
 <p className={`text-lg font-semibold font-mono ${i.textColor}`}>
 {i.value.toLocaleString()}
 </p>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 )
}
