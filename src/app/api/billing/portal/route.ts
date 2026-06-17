import { NextResponse } from "next/server"
import { apiHandler, requireOrg } from "@/lib/middleware"
import { stripe } from "@/lib/stripe"

export const POST = apiHandler(async () => {
  const { org } = await requireOrg()

  if (!stripe) {
    return NextResponse.json({ url: "/billing" })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: org.id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  })

  return NextResponse.json({ url: session.url })
})

export const dynamic = "force-dynamic"
