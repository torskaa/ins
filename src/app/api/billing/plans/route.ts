import { NextResponse } from "next/server"
import { PLANS } from "@/lib/stripe"

export const GET = async () => {
  return NextResponse.json({ plans: PLANS, stripeActive: !!process.env.STRIPE_SECRET_KEY })
}
