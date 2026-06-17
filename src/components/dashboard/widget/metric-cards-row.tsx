"use client"

import { MetricCard } from "./metric-card"
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react"

function generateChartData(base: number, change: number, seed: number): number[] {
 const points = 7
 const trend = change / 10
 return Array.from({ length: points }, (_, i) => {
 const t = i / (points - 1)
 const trendOffset = t * trend * 8
 const cycle = Math.sin((i + seed) * 0.9) * 12
 const noise = Math.sin((i + seed) * 1.7) * 5
 return Math.round(Math.max(5, Math.min(95, 50 + cycle + noise + trendOffset)))
 })
}

export function MetricCardsRow({ compact }: { compact?: boolean }) {
 const metrics = [
 {
 label: "Revenue",
 value: "$128.5K",
 change: 12.5,
 icon: null,
 chartData: generateChartData(128500, 12.5, 1),
 },
 {
 label: "Products",
 value: "1,247",
 change: 8.3,
 icon: null,
 chartData: generateChartData(1247, 8.3, 2),
 },
 {
 label: "Orders",
 value: "342",
 change: -2.1,
 icon: null,
 chartData: generateChartData(342, -2.1, 3),
 },
 {
 label: "Customers",
 value: "89",
 change: 15.7,
 icon: null,
 chartData: generateChartData(89, 15.7, 4),
 },
 ]

 return (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {metrics.map((m) => (
 <MetricCard key={m.label} {...m} compact={compact} />
 ))}
 </div>
 )
}
