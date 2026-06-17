import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"

export const POST = async (request: Request) => {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 })
  }

  const body = await request.text()
  const signature = request.headers.get("stripe-signature") || ""

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET || "")
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any
      const orgId = session.metadata?.orgId
      if (orgId) {
        const { prisma } = await import("@/lib/db")
        await prisma.organizationSetting.upsert({
          where: { organizationId: orgId },
          update: { stripeCustomerId: session.customer as string, stripeSubscriptionId: session.subscription as string, planId: session.metadata?.planId || "free" },
          create: { organizationId: orgId, stripeCustomerId: session.customer as string, stripeSubscriptionId: session.subscription as string, planId: session.metadata?.planId || "free" },
        })
      }
      break
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as any
      const { prisma } = await import("@/lib/db")
      await prisma.organizationSetting.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { planId: "free" },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
