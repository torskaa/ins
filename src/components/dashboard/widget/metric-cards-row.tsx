"use client"

import { useState, useEffect, useMemo } from "react"
import { MetricCard } from "./metric-card"

function generateSparkline(base: number, points: number = 12): number[] {
  return Array.from({ length: points }, (_, i) => {
    const trend = Math.sin(i / 3) * base * 0.15
    const noise = (Math.random() - 0.5) * base * 0.1
    return Math.max(0, Math.round(base + trend + noise))
  })
}

function calcChange(data: number[]): number {
  if (data.length < 2) return 0
  const first = data[0]
  const last = data[data.length - 1]
  if (first === 0) return 0
  return Math.round(((last - first) / first) * 100)
}

export function MetricCardsRow({ compact }: { compact?: boolean }) {
  const [data, setData] = useState<{
    totalProducts: number
    totalOrders: number
    totalRevenue: number
    totalCustomers: number
    pendingOrders: number
  } | null>(null)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && json.data) setData(json.data)
      })
      .catch(() => {})
  }, [])

  const totalRevenue = data?.totalRevenue || 0

  const metrics = useMemo(() => {
    const revenueData = generateSparkline(totalRevenue / 12 || 8500)
    const productsData = generateSparkline(data?.totalProducts || 120)
    const ordersData = generateSparkline(data?.totalOrders || 45)
    const customersData = generateSparkline(data?.totalCustomers || 30)

    return [
      {
        label: "Revenue",
        value: totalRevenue ? `$${(totalRevenue / 1000).toFixed(1)}K` : "$0",
        change: calcChange(revenueData),
        chartData: revenueData,
      },
      {
        label: "Products",
        value: data?.totalProducts?.toLocaleString() || "0",
        change: calcChange(productsData),
        chartData: productsData,
      },
      {
        label: "Orders",
        value: data?.totalOrders?.toLocaleString() || "0",
        change: calcChange(ordersData),
        chartData: ordersData,
      },
      {
        label: "Customers",
        value: data?.totalCustomers?.toLocaleString() || "0",
        change: calcChange(customersData),
        chartData: customersData,
      },
    ]
  }, [data, totalRevenue])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      {metrics.map((m) => (
        <MetricCard key={m.label} label={m.label} value={m.value} change={m.change} chartData={m.chartData} icon={null} compact={compact} />
      ))}
    </div>
  )
}
