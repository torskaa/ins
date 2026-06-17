import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg } from "@/lib/middleware"
import { stripe, PLANS } from "@/lib/stripe"

export const POST = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()
  const body = await request.json()
  const planId = body.planId as string

  const plan = PLANS.find((p) => p.id === planId)
  if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 })

  if (plan.price === 0 || !stripe) {
    return NextResponse.json({ url: "/billing?upgraded=free" })
  }

  if (plan.price === null) {
    return NextResponse.json({ url: "/billing?contact=sales" })
  }

  const session = await stripe!.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card", "promptpay"],
    line_items: [
      {
        price_data: {
          currency: plan.currency.toLowerCase(),
          product_data: { name: `Ins ${plan.name}` },
          unit_amount: plan.price,
          recurring: { interval: plan.interval },
        },
        quantity: 1,
      },
    ],
    metadata: { orgId: org.id, planId },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?cancelled=true`,
  })

  return NextResponse.json({ url: session.url })
})

export const dynamic = "force-dynamic"
