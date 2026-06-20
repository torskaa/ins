"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { EmptyState } from "@/components/ui/empty-state"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge, SemanticBadge } from "@/components/ui/badge"
import { Building2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { SkeletonPageHeader, SkeletonCard } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Suspense } from "react"

type Plan = {
 id: string
 name: string
 description: string
 price: number | null
 currency: string
 interval: string
 features: string[]
 popular?: boolean
 cta?: string
}

function BillingContent() {
 const router = useRouter()
 const searchParams = useSearchParams()
 const [plans, setPlans] = useState<Plan[]>([])
 const [currentPlan, setCurrentPlan] = useState("free")
 const [stripeActive, setStripeActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

 useEffect(() => {
 if (searchParams.get("success")) toast.success("Subscription updated successfully!")
 if (searchParams.get("cancelled")) toast.warning("Checkout was cancelled")

  Promise.all([
    fetch("/api/billing/plans").then((r) => r.json()),
    fetch("/api/onboarding").then((r) => r.json()),
    ]).then(([plansData, orgData]) => {
    setPlans(plansData.plans || [])
    setStripeActive(plansData.stripeActive)
    setCurrentPlan(orgData.settings?.planId || "free")
    }).catch((err) => { setError(err.message || "Failed to load data"); setLoading(false) }).finally(() => setLoading(false))
 }, [searchParams])

 async function handleSelectPlan(planId: string) {
 if (planId === currentPlan) return
 setCheckoutLoading(planId)
 try {
 const res = await fetch("/api/billing/create-checkout", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ planId }),
 })
  const json = await res.json()
  if (json.success && json.data?.url) window.location.href = json.data.url
  else if (json.success) toast.success("Plan updated!")
  else throw new Error(json.error || "Failed to process request")
  } catch {
  toast.error("Failed to process request")
  } finally {
  setCheckoutLoading(null)
  }
  }

  async function handlePortal() {
  if (!stripeActive) return
  try {
  const res = await fetch("/api/billing/portal", { method: "POST" })
  const json = await res.json()
  if (json.success && json.data?.url) window.location.href = json.data.url
 } catch {
 toast.error("Failed to open billing portal")
 }
 }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Failed to load data"
        description={error}
        actions={[{ label: "Try again", onClick: () => window.location.reload() }]}
      />
    )
  }
  if (loading) return <div className="animate-fade-in space-y-6"><SkeletonPageHeader /><div className="grid grid-cols-3 gap-6"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div></div>

  return (
 <div className="animate-fade-in">
 <div className="page-header">
 <h1>Billing & Plans</h1>
 <p>Manage your subscription and billing</p>
 </div>

 {/* Current plan badge */}
 <div className="flex items-center justify-between mb-8 p-4 rounded-xl bg-primary/5 border border-primary/10">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
 <Building2 className="w-5 h-5 text-primary" />
 </div>
 <div>
 <p className="text-sm text-muted-foreground">Current Plan</p>
 <p className="font-semibold text-lg capitalize">{currentPlan}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
  <SemanticBadge semantic={stripeActive ? "active" : "inactive"} category="status">
  {stripeActive ? "Active" : "Free (no card required)"}
  </SemanticBadge>
 {currentPlan !== "free" && stripeActive && (
 <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePortal}>
 Manage
 </Button>
 )}
 </div>
 </div>

 {/* Pricing Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
 {plans.map((plan) => {
 const isCurrent = plan.id === currentPlan
 return (
 <Card key={plan.id} className={cn(
 "relative transition-all",
 plan.popular && "ring-2 ring-primary shadow-lg scale-[1.02]",
 isCurrent && "ring-2 ring-success",
 )}>
 {plan.popular && (
 <div className="absolute -top-3 left-1/2 -translate-x-1/2">
 <Badge className="gap-1">Most Popular</Badge>
 </div>
 )}
 {isCurrent && (
 <div className="absolute -top-3 right-4">
  <SemanticBadge semantic="active" category="status">Active</SemanticBadge>
 </div>
 )}
 <CardHeader>
 <CardTitle>{plan.name}</CardTitle>
 <CardDescription>{plan.description}</CardDescription>
 <div className="mt-4">
 <span className="text-3xl font-bold">{plan.price === null ? "Custom" : `฿${(plan.price / 100).toLocaleString()}`}</span>
 {plan.price !== null && plan.price > 0 && (
 <span className="text-sm text-muted-foreground ml-1">/{plan.interval}</span>
 )}
 {plan.price === 0 && <span className="text-sm text-muted-foreground ml-1">— Free forever</span>}
 </div>
 </CardHeader>
 <CardContent>
 <ul className="space-y-2.5 mb-6">
 {plan.features.map((f) => (
 <li key={f} className="flex items-start gap-2 text-sm">
 {f}
 </li>
 ))}
 </ul>
 <Button
 className="w-full"
 variant={isCurrent ? "outline" : plan.popular ? "default" : "secondary"}
 onClick={() => handleSelectPlan(plan.id)}
 disabled={isCurrent || checkoutLoading !== null}
 loading={checkoutLoading === plan.id}
 >
 {isCurrent ? "Current Plan" : plan.cta || (plan.price === 0 ? "Get Started" : "Subscribe")}
 </Button>
 </CardContent>
 </Card>
 )
 })}
 </div>

 {/* Payment methods */}
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2 text-base">
 Payment Methods
 </CardTitle>
 <CardDescription>Manage your payment methods and billing information</CardDescription>
 </CardHeader>
 <CardContent>
 {stripeActive ? (
 <div className="flex items-center justify-between p-4 rounded-lg bg-surface/50">
 <div className="flex items-center gap-3">
 <div>
 <p className="text-sm font-medium">Card on file</p>
 <p className="text-xs text-muted-foreground">Manage through Stripe Customer Portal</p>
 </div>
 </div>
 <Button variant="outline" size="sm" onClick={handlePortal} className="gap-1.5"><ExternalLink className="w-4 h-4" /> Open Portal</Button>
 </div>
 ) : (
 <div className="p-4 rounded-lg bg-surface/50 text-center">
 <p className="text-sm text-muted-foreground">Set up Stripe to enable payment processing</p>
 <p className="text-xs text-muted-foreground mt-1">Add STRIPE_SECRET_KEY to your .env file</p>
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 )
}

export default function BillingPage() {
 return (
 <Suspense>
 <BillingContent />
 </Suspense>
 )
}
