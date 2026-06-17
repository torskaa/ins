import { NextResponse } from "next/server"
import { apiHandler, requireOrg } from "@/lib/middleware"
import { runMRP } from "@/lib/enterprise"

export const POST = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()
  const body = await request.json()
  const result = await runMRP({
    organizationId: org.id,
    horizonDays: body.horizonDays || 30,
  })
  return NextResponse.json(result)
})

export const GET = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()
  const { searchParams } = new URL(request.url)
  const horizonDays = parseInt(searchParams.get("horizonDays") || "30")
  const result = await runMRP({
    organizationId: org.id,
    horizonDays,
  })
  return NextResponse.json(result)
})
