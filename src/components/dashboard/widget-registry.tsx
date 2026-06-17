import type { ComponentType, ReactNode } from "react"

export type WidgetCategory = "financial" | "inventory" | "sales" | "crm" | "core" | "system"

export interface WidgetLayoutItem {
 i: string
 x: number
 y: number
 w: number
 h: number
 minW?: number
 minH?: number
}

export interface WidgetConfig {
 id: string
 title: string
 description: string
 category: WidgetCategory
 defaultW: number
 defaultH: number
 minW?: number
 minH?: number
 preview: ReactNode
 component: ComponentType<{ compact?: boolean }>
}

const placeholderBox = (label: string, color: string) => (
 <div
 className="w-full h-full rounded-lg flex items-center justify-center text-xs font-medium text-white"
 style={{ background: `linear-gradient(135deg, ${color}88, ${color}44)` }}
 >
 {label}
 </div>
)

import { MetricCardsRow } from "./widget/metric-cards-row"
import { RevenueChart } from "./widget/revenue-chart"
import { LowStockWidget } from "./widget/low-stock"
import { RecentOrdersWidget } from "./widget/recent-orders"
import { TopProductsWidget } from "./widget/top-products"
import { SalesCategoryWidget } from "./widget/sales-category"
import { PaymentStatusWidget } from "./widget/payment-status"
import { CustomerAcquisitionWidget } from "./widget/customer-acquisition"

export const WIDGET_REGISTRY: WidgetConfig[] = [
 {
 id: "metrics",
 title: "Key Metrics",
 description: "Revenue, products, orders, and customers at a glance",
 category: "core",
 defaultW: 12, defaultH: 2, minW: 8, minH: 2,
 preview: placeholderBox("4 Metric Cards", "#3b82f6"),
 component: MetricCardsRow,
 },
 {
 id: "revenue-chart",
 title: "Revenue Trend",
 description: "Monthly revenue area chart with time range filter",
 category: "financial",
 defaultW: 6, defaultH: 3, minW: 4, minH: 2,
 preview: placeholderBox("Revenue Chart", "#06b6d4"),
 component: RevenueChart,
 },
 {
 id: "low-stock",
 title: "Low Stock Alerts",
 description: "Products that need reordering",
 category: "inventory",
 defaultW: 6, defaultH: 3, minW: 4, minH: 2,
 preview: placeholderBox("Low Stock", "#ef4444"),
 component: LowStockWidget,
 },
 {
 id: "recent-orders",
 title: "Recent Orders",
 description: "Latest sales orders and their status",
 category: "sales",
 defaultW: 6, defaultH: 3, minW: 4, minH: 2,
 preview: placeholderBox("Recent Orders", "#f59e0b"),
 component: RecentOrdersWidget,
 },
 {
 id: "top-products",
 title: "Top Products",
 description: "Best selling products by revenue",
 category: "inventory",
 defaultW: 6, defaultH: 3, minW: 4, minH: 2,
 preview: placeholderBox("Top Products", "#8b5cf6"),
 component: TopProductsWidget,
 },
 {
 id: "sales-category",
 title: "Sales by Category",
 description: "Revenue distribution by product category",
 category: "sales",
 defaultW: 6, defaultH: 3, minW: 4, minH: 2,
 preview: placeholderBox("Sales by Category", "#22c55e"),
 component: SalesCategoryWidget,
 },
 {
 id: "payment-status",
 title: "Payment Status",
 description: "Invoice payment status breakdown",
 category: "financial",
 defaultW: 6, defaultH: 3, minW: 4, minH: 2,
 preview: placeholderBox("Payment Status", "#ec4899"),
 component: PaymentStatusWidget,
 },
 {
 id: "customer-acquisition",
 title: "Customer Acquisition",
 description: "New customers over time",
 category: "crm",
 defaultW: 6, defaultH: 3, minW: 4, minH: 2,
 preview: placeholderBox("Customer Acquisition", "#a855f7"),
 component: CustomerAcquisitionWidget,
 },
]

export function getDefaultLayout(): WidgetLayoutItem[] {
 const defaults: [string, number, number, number, number][] = [
 ["metrics", 0, 0, 12, 2],
 ["revenue-chart", 0, 2, 6, 3],
 ["low-stock", 6, 2, 6, 3],
 ["recent-orders", 0, 5, 6, 3],
 ["top-products", 6, 5, 6, 3],
 ["sales-category", 0, 8, 6, 3],
 ["payment-status", 6, 8, 6, 3],
 ["customer-acquisition", 0, 11, 6, 3],
 ]

 return defaults.map(([id, x, y, w, h]) => {
 const config = WIDGET_REGISTRY.find((c) => c.id === id)
 return {
 i: id,
 x, y, w, h,
 minW: config?.minW,
 minH: config?.minH,
 } as WidgetLayoutItem
 })
}
