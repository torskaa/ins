"use client"

import { useState, useEffect } from "react"
import { MetricCard } from "./metric-card"

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
  const metrics = [
    {
      label: "Revenue",
      value: totalRevenue ? `$${(totalRevenue / 1000).toFixed(1)}K` : "$0",
      change: null as number | null,
    },
    {
      label: "Products",
      value: data?.totalProducts?.toLocaleString() || "0",
      change: null as number | null,
    },
    {
      label: "Orders",
      value: data?.totalOrders?.toLocaleString() || "0",
      change: null as number | null,
    },
    {
      label: "Customers",
      value: data?.totalCustomers?.toLocaleString() || "0",
      change: null as number | null,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      {metrics.map((m) => (
        <MetricCard key={m.label} label={m.label} value={m.value} change={m.change} icon={null} compact={compact} />
      ))}
    </div>
  )
}