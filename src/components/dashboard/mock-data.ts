function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    var t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const seed = 42
const rng = mulberry32(seed)

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export interface MonthlyRevenue {
  month: string
  revenue: number
  cost: number
  profit: number
}

export interface SalesCategory {
  name: string
  revenue: number
  percentage: number
  color: string
}

export interface PaymentStatus {
  paid: number
  pending: number
  overdue: number
  cancelled: number
}

export interface CustomerAcquisition {
  month: string
  customers: number
}

export interface TopProduct {
  name: string
  sku: string
  quantity: number
  revenue: number
}

const CATEGORY_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"]

export function generateMonthlyRevenue(): MonthlyRevenue[] {
  return MONTHS.map((month) => {
    const revenue = Math.round(rng() * 400000 + 100000)
    const cost = Math.round(revenue * (rng() * 0.2 + 0.4))
    return { month, revenue, cost, profit: revenue - cost }
  })
}

export function generateSalesByCategory(): SalesCategory[] {
  const categories = ["Electronics", "Clothing", "Food & Beverage", "Home & Living", "Accessories"]
  const revenues = categories.map(() => Math.round(rng() * 300000 + 50000))
  const total = revenues.reduce((a, b) => a + b, 0)
  return categories.map((name, i) => ({
    name,
    revenue: revenues[i],
    percentage: Math.round((revenues[i] / total) * 100),
    color: CATEGORY_COLORS[i],
  }))
}

export function generatePaymentStatus(): PaymentStatus {
  return {
    paid: Math.round(rng() * 80 + 120),
    pending: Math.round(rng() * 30 + 20),
    overdue: Math.round(rng() * 15 + 5),
    cancelled: Math.round(rng() * 10 + 2),
  }
}

export function generateCustomerAcquisition(): CustomerAcquisition[] {
  return MONTHS.map((month) => ({
    month,
    customers: Math.round(rng() * 80 + 20),
  }))
}

export function generateTopProducts(): TopProduct[] {
  return [
    { name: "Wireless Headphones", sku: "WH-1000X", quantity: 234, revenue: 70200 },
    { name: "Organic Coffee Beans", sku: "OCB-001", quantity: 189, revenue: 28350 },
    { name: "Yoga Mat Premium", sku: "YMP-2024", quantity: 156, revenue: 23400 },
    { name: "Smart Water Bottle", sku: "SWB-420", quantity: 143, revenue: 21450 },
    { name: "Bamboo Desk Organizer", sku: "BDO-001", quantity: 98, revenue: 14700 },
  ]
}

export function reseedRng() {
  const newRng = mulberry32(seed)
  for (let i = 0; i < 100; i++) newRng()
  return newRng
}
