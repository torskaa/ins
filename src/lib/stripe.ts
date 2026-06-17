import Stripe from "stripe"

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" as any })
  : null

export const PLANS = [
  {
    id: "free",
    name: "Starter",
    description: "For small businesses getting started",
    price: 0,
    currency: "THB",
    interval: "month" as const,
    features: [
      "Up to 500 products",
      "Up to 3 users",
      "Basic inventory management",
      "Sales & purchase orders",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Professional",
    description: "For growing businesses",
    price: 299000,
    currency: "THB",
    interval: "month" as const,
    features: [
      "Up to 10,000 products",
      "Up to 25 users",
      "MRP & production",
      "Accounting & tax",
      "Advanced reporting",
      "API access",
      "Priority support",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    price: null,
    currency: "THB",
    interval: "month" as const,
    features: [
      "Unlimited products",
      "Unlimited users",
      "All features",
      "Custom workflows",
      "Dedicated account manager",
      "SLA guarantee",
      "On-premise available",
    ],
    cta: "Contact Sales",
  },
]

export function formatStripePrice(amount: number | null, currency = "THB") {
  if (amount === null) return "Custom"
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100)
}
