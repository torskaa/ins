import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission } from "@/lib/middleware"

export const POST = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("settings", "create")
  const { org } = await requireOrg()
  const { id: workflowId } = await params
  const body = await request.json()
  const transition = await prisma.workflowTransition.create({
    data: { name: body.name, fromStateId: body.fromStateId, toStateId: body.toStateId, workflowId, requiredRole: body.requiredRole },
  })
  return NextResponse.json(transition)
})
