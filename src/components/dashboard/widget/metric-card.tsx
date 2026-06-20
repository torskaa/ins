"use client"

import { Minus, ArrowUp, ArrowDown } from "lucide-react"
import { Sparkline } from "@/components/ui/sparkline"

interface MetricCardProps {
 label: string
 value: string
 change?: number
 prefix?: string
 icon?: React.ReactNode
 href?: string
 chartData?: number[]
}

export function MetricCard({ label, value, change, prefix = "", icon, compact, chartData }: MetricCardProps & { compact?: boolean }) {
 const isPositive = change !== undefined && change > 0
 const isNegative = change !== undefined && change < 0
 const p = compact ? "p-3" : "p-5"

  const strokeColor = isPositive ? "var(--color-success)" : isNegative ? "var(--color-destructive)" : "var(--color-muted-foreground)"

  return (
  <div className={`bg-card rounded-2xl shadow-sm ring-1 ring-border ${p}`}>
  <div className="flex items-center justify-between mb-2">
  <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
  {icon && <span className="text-muted-foreground">{icon}</span>}
  </div>
  <div className="flex items-end justify-between gap-3">
  <div className="min-w-0">
  <div className={`font-semibold tracking-tight text-foreground ${compact ? "text-xl" : "text-2xl"}`}>
 {prefix}{value}
 </div>
 {change !== undefined && (
 <div className="flex items-center gap-1 mt-1">
 {isPositive ? (
 <ArrowUp className="w-3.5 h-3.5 text-success" />
 ) : isNegative ? (
 <ArrowDown className="w-3.5 h-3.5 text-destructive" />
 ) : (
 <Minus className="w-3.5 h-3.5 text-muted-foreground" />
 )}
 <span className={`text-xs font-medium ${isPositive ? "text-success" : isNegative ? "text-destructive" : "text-muted-foreground"}`}>
 {isPositive ? "+" : ""}{change}%
 </span>
 <span className="text-xs text-muted-foreground ml-0.5">vs last period</span>
 </div>
 )}
 </div>
 {chartData && chartData.length > 0 && (
 <div className="w-[100px] h-10 shrink-0">
 <Sparkline data={chartData} color={strokeColor} width={100} height={40} />
 </div>
 )}
 </div>
 </div>
 )
}
