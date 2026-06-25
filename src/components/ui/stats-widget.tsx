"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts"
import { CircleDollarSign, TrendingUp, UserPlus, Package, ShoppingCart, Warehouse, BarChart3, Activity, DollarSign, Users, Target, Zap, ShoppingBag, CreditCard } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface StatsCardData {
  title: string
  period: string
  value: string
  data: { value: number }[]
  color: string
  icon: LucideIcon
  trend?: number
}

interface StatsWidgetProps {
  cards: StatsCardData[]
}

const cardColors: Record<string, string> = {
  emerald: "var(--color-emerald-500)",
  blue: "var(--color-blue-500)",
  violet: "var(--color-violet-500)",
  amber: "var(--color-amber-500)",
  rose: "var(--color-rose-500)",
  cyan: "var(--color-cyan-500)",
}

const iconMap: Record<string, LucideIcon> = {
  "circle-dollar-sign": CircleDollarSign,
  "trending-up": TrendingUp,
  "user-plus": UserPlus,
  "package": Package,
  "shopping-cart": ShoppingCart,
  "warehouse": Warehouse,
  "bar-chart": BarChart3,
  "activity": Activity,
  "dollar-sign": DollarSign,
  "users": Users,
  "target": Target,
  "zap": Zap,
  "shopping-bag": ShoppingBag,
  "credit-card": CreditCard,
}

function detectIcon(title: string): LucideIcon {
  const lower = title.toLowerCase()
  if (lower.includes("revenue") || lower.includes("income") || lower.includes("sales") || lower.includes("earning")) return CircleDollarSign
  if (lower.includes("customer") || lower.includes("user") || lower.includes("client")) return UserPlus
  if (lower.includes("order") || lower.includes("purchase")) return ShoppingCart
  if (lower.includes("product") || lower.includes("item") || lower.includes("inventory") || lower.includes("stock")) return Package
  if (lower.includes("warehouse") || lower.includes("storage") || lower.includes("facility")) return Warehouse
  if (lower.includes("margin") || lower.includes("profit") || lower.includes("growth")) return TrendingUp
  if (lower.includes("active") || lower.includes("visit") || lower.includes("traffic") || lower.includes("session")) return Activity
  if (lower.includes("spend") || lower.includes("cost") || lower.includes("expense")) return CreditCard
  if (lower.includes("goal") || lower.includes("kpi") || lower.includes("target")) return Target
  return BarChart3
}

export function StatsWidget({ cards }: StatsWidgetProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
      {cards.map((card, i) => {
        const Icon = card.icon
        const strokeColor = cardColors[card.color] || card.color

        return (
          <Card key={i}>
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center gap-2">
                <Icon className="size-5" style={{ color: strokeColor }} />
                <span className="text-base font-semibold text-foreground">{card.title}</span>
              </div>

              <div className="flex items-end gap-2.5 justify-between">
                <div className="flex flex-col gap-1">
                  <div className="text-sm text-muted-foreground whitespace-nowrap">{card.period}</div>
                  <div className="text-3xl font-bold text-foreground tracking-tight">{card.value}</div>
                </div>

                <div className="max-w-32 h-16 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={card.data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <defs>
                        <linearGradient id={`stats-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={strokeColor} stopOpacity={0.05} />
                        </linearGradient>
                        <filter id={`stats-shadow-${i}`} x="-50%" y="-50%" width="200%" height="200%">
                          <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.5)" />
                        </filter>
                      </defs>
                      <Tooltip
                        cursor={{ stroke: strokeColor, strokeWidth: 1, strokeDasharray: "2 2" }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const value = payload[0].value as number
                            return (
                              <div className="bg-background/95 backdrop-blur-sm border border-border shadow-lg rounded-lg p-2 pointer-events-none">
                                <p className="text-sm font-semibold text-foreground">{value.toLocaleString()}</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={strokeColor}
                        fill={`url(#stats-grad-${i})`}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 5,
                          fill: strokeColor,
                          stroke: "white",
                          strokeWidth: 2,
                          filter: `url(#stats-shadow-${i})`,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export function detectStatsCards(json: unknown): StatsCardData[] | null {
  try {
    if (Array.isArray(json)) {
      const cards: StatsCardData[] = []
      const colorKeys = Object.keys(cardColors)
      for (const item of json) {
        if (typeof item !== "object" || item === null) continue
        const obj = item as Record<string, unknown>
        if (
          typeof obj.title === "string" &&
          typeof obj.period === "string" &&
          typeof obj.value === "string" &&
          Array.isArray(obj.data) &&
          obj.data.length > 0 &&
          typeof obj.data[0] === "object" &&
          obj.data[0] !== null &&
          "value" in (obj.data[0] as Record<string, unknown>)
        ) {
          const iconName = typeof obj.iconName === "string" ? obj.iconName.toLowerCase() : ""
          cards.push({
            title: obj.title,
            period: obj.period,
            value: obj.value,
            data: obj.data as { value: number }[],
            color: (typeof obj.color === "string" && cardColors[obj.color] ? obj.color : colorKeys[cards.length % colorKeys.length]),
            icon: (iconName && iconMap[iconName]) ? iconMap[iconName] : detectIcon(obj.title),
          })
        }
      }
      return cards.length > 0 ? cards : null
    }
  } catch {}
  return null
}
