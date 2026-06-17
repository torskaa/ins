import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission } from "@/lib/middleware"

export const POST = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("settings", "create")
  const { org } = await requireOrg()
  const { id: workflowId } = await params
  const body = await request.json()
  const state = await prisma.workflowState.create({
    data: { name: body.name, color: body.color || "#6b7280", isInitial: body.isInitial || false, isFinal: body.isFinal || false, workflowId },
  })
  return NextResponse.json(state)
})
