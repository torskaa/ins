"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { generateCustomerAcquisition } from "@/components/dashboard/mock-data"
import { Users } from "lucide-react"

export function CustomerAcquisitionWidget({ compact }: { compact?: boolean }) {
 const [data, setData] = useState<any[]>([])

 useEffect(() => {
 setData(generateCustomerAcquisition())
 }, [])

 return (
 <Card>
 <CardHeader className="pb-3">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
 </div>
 <CardTitle>Customer Acquisition</CardTitle>
 </div>
 </CardHeader>
 <CardContent>
 <div className="h-[180px]">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
 <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
 <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
 <Tooltip
 contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
 />
 <Bar dataKey="customers" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={compact ? 12 : 16} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </CardContent>
 </Card>
 )
}
