import { NextResponse } from "next/server"
import { apiHandler } from "@/lib/middleware"
import { healthCheck } from "@/lib/infrastructure"

export const GET = apiHandler(async () => {
  const status = await healthCheck()
  const statusCode = status.status === "healthy" ? 200 : 503
  return NextResponse.json(status, { status: statusCode })
})
